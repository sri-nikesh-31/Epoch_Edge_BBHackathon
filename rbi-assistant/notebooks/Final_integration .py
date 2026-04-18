# Databricks notebook source
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CELL 1 — INSTALL  (run once; next cell restarts Python)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
%pip install --quiet \
    langid mlflow \
    scikit-learn numpy requests \
    soundfile librosa



# COMMAND ----------

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CELL 2 — RESTART PYTHON
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
dbutils.library.restartPython()



# COMMAND ----------


# CELL 3 — IMPORTS, CONFIG & LANGUAGE MAP
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import os, re, shutil, warnings, base64, json
warnings.filterwarnings("ignore")

import numpy as np
import soundfile as sf
import librosa
import langid
import requests
import mlflow.deployments

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, udf, length, explode, concat_ws,
    regexp_extract, input_file_name,
)
from pyspark.sql.types import (
    StringType, ArrayType, StructType,
    StructField, IntegerType, FloatType,
)
import pandas as pd
from pyspark.sql.functions import pandas_udf
from sklearn.metrics.pairwise import cosine_similarity
import IPython.display as ipd

# ── Paths ─────────────────────────────────────────────────────────
VOLUME_PATH    = "/Volumes/bharatbricks_hackathon/default/bbhackathon"
DATA_PATH      = f"{VOLUME_PATH}/rbi_text/"
LOCAL_TEMP     = "/tmp/rbi_audio_staging"
OUTPUT_TABLE   = "bharatbricks_hackathon.default.rbi_embeddings"
EMBED_ENDPOINT = "databricks-bge-large-en"
LLM_ENDPOINT   = "databricks-meta-llama-3-3-70b-instruct"

os.makedirs(LOCAL_TEMP, exist_ok=True)

# ── Sarvam AI config ──────────────────────────────────────────────
# Set your Sarvam API key here (or via env variable SARVAM_API_KEY)
SARVAM_API_KEY     = os.environ.get("SARVAM_API_KEY", "sk_b8la06z3_vp7yWCRyc0LDexILzYwGS9A6")  
SARVAM_STT_URL     = "https://api.sarvam.ai/speech-to-text"                    
SARVAM_TRANS_URL   = "https://api.sarvam.ai/translate"
SARVAM_TTS_URL     = "https://api.sarvam.ai/text-to-speech/stream" 
SARVAM_HEADERS = {
    "api-subscription-key": SARVAM_API_KEY,
    "Content-Type": "application/json",
}

# ── Language registry ─────────────────────────────────────────────
# langid code → {Sarvam language code for STT/TTS/translate}
# Sarvam uses BCP-47 style codes for its APIs.
LANG = {
    "hi": {"name": "Hindi",     "sarvam": "hi-IN"},
    "ta": {"name": "Tamil",     "sarvam": "ta-IN"},
    "te": {"name": "Telugu",    "sarvam": "te-IN"},
    "kn": {"name": "Kannada",   "sarvam": "kn-IN"},
    "ml": {"name": "Malayalam", "sarvam": "ml-IN"},
    "mr": {"name": "Marathi",   "sarvam": "mr-IN"},
    "bn": {"name": "Bengali",   "sarvam": "bn-IN"},
    "gu": {"name": "Gujarati",  "sarvam": "gu-IN"},
    "pa": {"name": "Punjabi",   "sarvam": "pa-IN"},
    "en": {"name": "English",   "sarvam": "en-IN"},
}

print(f"✅ Config ready | Sarvam AI edition")
print(f"   Languages: {', '.join(v['name'] for v in LANG.values())}")


# COMMAND ----------

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CELL 4 — DATA PIPELINE  (unchanged — run once to build vector store)
# Load TXT files → clean → chunk → embed → save to Delta
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

spark = SparkSession.builder.getOrCreate()

# ── Load ───────────────────────────────────────────────────────────
raw_df = (
    spark.read
    .option("wholetext", "true")
    .option("encoding", "UTF-8")
    .text(DATA_PATH + "*.txt")
    .withColumn("file_path", col("_metadata.file_path"))
    .withColumnRenamed("value", "raw_text")
    .withColumn("doc_id", regexp_extract(col("file_path"), r"([^/]+)\.txt$", 1))
)
print(f"Documents loaded: {raw_df.count()}")

# ── Clean ──────────────────────────────────────────────────────────
def _clean(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'Page\s+\d+\s+of\s+\d+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'www\.rbi\.org\.in', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Reserve Bank of India\s*[-–]\s*\w+', '', text)
    text = re.sub(r'\r\n|\r', '\n', text)
    text = re.sub(r'\f', '\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[^\x00-\x7F\u0900-\u097F]', ' ', text)
    lines = [l for l in text.split('\n') if not re.match(r'^\s*\d+\s*$', l)]
    return '\n'.join(lines).strip()

clean_udf = udf(_clean, StringType())
cleaned_df = (
    raw_df
    .withColumn("cleaned_text", clean_udf(col("raw_text")))
    .filter(length(col("cleaned_text")) > 100)
    .drop("raw_text")
)
print(f"Documents after cleaning: {cleaned_df.count()}")

# ── Chunk ──────────────────────────────────────────────────────────
def _chunk(text: str, size=512, overlap=64):
    if not text:
        return []
    words = []
    for sent in re.split(r'(?<=[.!?])\s+', text):
        words.extend(sent.split())
    chunks, start, idx = [], 0, 0
    while start < len(words):
        end = min(start + size, len(words))
        chunks.append((idx, ' '.join(words[start:end]).strip()))
        idx += 1
        if end == len(words):
            break
        start += size - overlap
    return chunks

_chunk_schema = ArrayType(StructType([
    StructField("chunk_index", IntegerType(), False),
    StructField("chunk_text",  StringType(),  False),
]))
chunk_udf = udf(lambda t: _chunk(t, 512, 64), _chunk_schema)

chunked_df = (
    cleaned_df
    .withColumn("chunks", chunk_udf(col("cleaned_text")))
    .withColumn("chunk",  explode(col("chunks")))
    .select(
        "doc_id", "file_path",
        col("chunk.chunk_index").alias("chunk_index"),
        col("chunk.chunk_text").alias("chunk_text"),
    )
    .withColumn("chunk_id", concat_ws("_", col("doc_id"), col("chunk_index").cast("string")))
    .filter(length(col("chunk_text")) > 50)
)
print(f"Total chunks: {chunked_df.count()}")

# ── Embed ──────────────────────────────────────────────────────────
@pandas_udf(ArrayType(FloatType()))
def _embed(texts: pd.Series) -> pd.Series:
    c = mlflow.deployments.get_deploy_client("databricks")
    results, batch = [], 32
    lst = texts.tolist()
    for i in range(0, len(lst), batch):
        resp = c.predict(endpoint=EMBED_ENDPOINT, inputs={"input": lst[i:i+batch]})
        results.extend(item["embedding"] for item in resp["data"])
    return pd.Series(results)

embedded_df = chunked_df.repartition(16).withColumn("embedding", _embed(col("chunk_text")))

# ── Persist ────────────────────────────────────────────────────────
(
    embedded_df
    .select("chunk_id", "doc_id", "file_path", "chunk_index", "chunk_text", "embedding")
    .write.format("delta").mode("overwrite")
    .option("overwriteSchema", "true")
    .saveAsTable(OUTPUT_TABLE)
)
print(f"✅ Saved {spark.table(OUTPUT_TABLE).count()} rows → {OUTPUT_TABLE}")



# COMMAND ----------


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CELL 5 — LOAD VECTOR STORE
# No heavy local model loading needed — Sarvam handles STT/TTS/Trans
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

print("📂 Loading vector store ...")
_rows = spark.table(OUTPUT_TABLE).select("chunk_id", "chunk_text", "embedding").collect()
_chunk_ids      = [r["chunk_id"]  for r in _rows]
_chunk_texts    = [r["chunk_text"] for r in _rows]
_doc_embeddings = np.array([r["embedding"] for r in _rows])
_db_client      = mlflow.deployments.get_deploy_client("databricks")
print(f"✅ Vector store ready — {len(_chunk_ids)} chunks loaded.")

print("✅ All systems ready (STT/TTS/Translation via Sarvam AI API)")

# COMMAND ----------

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CELL 6 — CORE FUNCTIONS
# transcribe · detect_language · translate · rag · generate_audio
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ── STT via Sarvam Saaras ─────────────────────────────────────────
def transcribe_audio(audio_path: str, lang_hint: str = None) -> tuple[str, str]:
    """
    Transcribe an audio file using Sarvam AI's Saaras STT API.
    Supports all Indian languages + English natively.

    Args:
        audio_path : path to audio file (.wav / .mp3 / .ogg etc.)
        lang_hint  : optional ISO 639-1 code hint (e.g. 'hi'). If None,
                     Sarvam auto-detects the language.

    Returns:
        (transcript_text, iso_language_code)
    """
    # Read and encode audio to base64
    with open(audio_path, "rb") as f:
        audio_bytes = f.read()

    # Determine audio format from extension
    ext = os.path.splitext(audio_path)[-1].lower().lstrip(".")
    audio_format_map = {
        "wav": "wav", "mp3": "mp3", "ogg": "ogg",
        "flac": "flac", "m4a": "mp4", "mp4": "mp4",
    }
    audio_format = audio_format_map.get(ext, "wav")

    # Build payload — use multipart/form-data as Sarvam STT expects
    headers = {"api-subscription-key": SARVAM_API_KEY}
    files   = {"file": (os.path.basename(audio_path), audio_bytes, f"audio/{audio_format}")}
    data    = {
        "model": "saaras:v3",   # Sarvam's latest multilingual ASR model
        "with_timestamps": "false",
        "with_disfluencies": "false",
        "debug_mode": "false",
    }
    # Optionally pass language hint (speeds up & improves accuracy)
    if lang_hint and lang_hint in LANG:
        data["language_code"] = LANG[lang_hint]["sarvam"]

    resp = requests.post(SARVAM_STT_URL, headers=headers, files=files, data=data)
    resp.raise_for_status()
    result = resp.json()

    transcript = result.get("transcript", "").strip()

    # Sarvam returns the detected language in BCP-47 (e.g. "hi-IN")
    sarvam_lang = result.get("language_code", "en-IN")
    # Convert "hi-IN" → "hi" for our internal lang codes
    detected_lang = sarvam_lang.split("-")[0]
    if detected_lang not in LANG:
        detected_lang = "en"

    print(f"🎤 Transcribed [{detected_lang}]: {transcript[:120]}")
    return transcript, detected_lang


# ── Language detection for text input ─────────────────────────────
def detect_language(text: str) -> str:
    """Detect ISO 639-1 language code from text using langid."""
    lang, _ = langid.classify(text)
    return lang if lang in LANG else "en"


# ── Translation via Sarvam Translate API ──────────────────────────
def translate(text: str, src_lang: str, tgt_lang: str) -> str:
    """
    Translate between any supported language pair using Sarvam's
    Translate API — fully replaces NLLB-200, no local model needed.

    src_lang / tgt_lang are ISO 639-1 codes (e.g. 'hi', 'en').
    """
    if src_lang == tgt_lang:
        return text

    src_sarvam = LANG.get(src_lang, {}).get("sarvam", "en-IN")
    tgt_sarvam = LANG.get(tgt_lang, {}).get("sarvam", "en-IN")

    # Sarvam translate accepts up to ~1000 words per call; split if needed
    MAX_CHARS = 2000
    if len(text) <= MAX_CHARS:
        return _sarvam_translate_chunk(text, src_sarvam, tgt_sarvam)

    # Split on sentence boundaries and translate in chunks
    sentences = re.split(r'(?<=[.!?\n])\s+', text)
    chunks, current = [], ""
    translated_chunks = []
    for sent in sentences:
        if len(current) + len(sent) < MAX_CHARS:
            current += " " + sent
        else:
            if current.strip():
                translated_chunks.append(
                    _sarvam_translate_chunk(current.strip(), src_sarvam, tgt_sarvam)
                )
            current = sent
    if current.strip():
        translated_chunks.append(
            _sarvam_translate_chunk(current.strip(), src_sarvam, tgt_sarvam)
        )
    return " ".join(translated_chunks)


def _sarvam_translate_chunk(text: str, src_sarvam: str, tgt_sarvam: str) -> str:
    """Single-chunk translation call to Sarvam API."""
    payload = {
        "input":            text,
        "source_language_code": src_sarvam,
        "target_language_code": tgt_sarvam,
        "speaker_gender":   "Female",
        "mode":             "formal",
        "model":            "mayura:v1",
        "enable_preprocessing": True,
    }
    resp = requests.post(SARVAM_TRANS_URL, headers=SARVAM_HEADERS, json=payload)
    resp.raise_for_status()
    return resp.json().get("translated_text", text)


# ── RAG (unchanged) ───────────────────────────────────────────────
def _embed_query(query: str) -> np.ndarray:
    resp = _db_client.predict(endpoint=EMBED_ENDPOINT, inputs={"input": [query]})
    return np.array(resp["data"][0]["embedding"])

def _retrieve(query: str, top_k: int = 5) -> list[dict]:
    q_emb  = _embed_query(query).reshape(1, -1)
    scores = cosine_similarity(q_emb, _doc_embeddings)[0]
    top_i  = np.argsort(scores)[-top_k:][::-1]
    return [{"chunk_id": _chunk_ids[i], "text": _chunk_texts[i],
             "score": float(scores[i])} for i in top_i]

def _llm(prompt: str) -> str:
    safe = prompt.replace("'", " ")
    df   = spark.sql(f"SELECT ai_query('{LLM_ENDPOINT}', '{safe}') AS response")
    return df.collect()[0]["response"]

def rag(query: str, top_k: int = 5) -> tuple[str, list[dict]]:
    """
    Retrieve relevant chunks + generate answer with Llama 3.3 70B.
    Query must be in English. Returns (answer, sources).
    """
    results    = _retrieve(query, top_k)
    confidence = sum(r["score"] for r in results[:3]) / 3
    context    = "\n\n".join(f"[Source {i+1}]:\n{r['text']}"
                              for i, r in enumerate(results))

    if confidence > 0.70:
        mode = "DOCUMENT"
        prompt = f"""You are an expert in RBI regulations.
Answer ONLY from the context below. Cite every point as [Source X].
If not found, say "Not found in documents."

Context:
{context}

Question: {query}

Answer in clear bullet points with citations."""

    elif confidence > 0.50:
        mode = "HYBRID"
        prompt = f"""You are an expert in RBI regulations.
Use context as primary source (cite as [Source X]). Use general knowledge only if needed.

Context:
{context}

Question: {query}

Answer in bullet points."""

    else:
        mode = "GENERAL"
        prompt = f"""You are an expert in RBI regulations.
Answer using your general knowledge.

Question: {query}

Answer in clear bullet points."""

    print(f"   Confidence: {confidence:.2f} | Mode: {mode}")
    return _llm(prompt), results


# ── TTS via Sarvam Bulbul ─────────────────────────────────────────
def generate_audio(text: str, filename: str, lang: str = "en") -> str:
    """
    Generate speech audio using Sarvam AI's Bulbul TTS voice.
    Works for ALL supported languages including English.
    Returns the final .wav path saved to the Databricks Volume.
    """
    if not SARVAM_API_KEY or SARVAM_API_KEY == "":
        raise ValueError("SARVAM_API_KEY is not set. Please set it in Cell 1-3.")
    
    local_path = f"{LOCAL_TEMP}/{filename}.wav"
    final_path = f"{VOLUME_PATH}/{filename}.wav"
    os.makedirs(VOLUME_PATH, exist_ok=True)

    sarvam_lang = LANG.get(lang, {}).get("sarvam", "en-IN")

    MAX_CHARS = 500
    if len(text) <= MAX_CHARS:
        audio_segments = [_sarvam_tts_chunk(text, sarvam_lang)]
    else:
        sentences = re.split(r'(?<=[.!?\n।])\s+', text)
        audio_segments = []
        current = ""
        for sent in sentences:
            if len(current) + len(sent) < MAX_CHARS:
                current += " " + sent
            else:
                if current.strip():
                    audio_segments.append(_sarvam_tts_chunk(current.strip(), sarvam_lang))
                current = sent
        if current.strip():
            audio_segments.append(_sarvam_tts_chunk(current.strip(), sarvam_lang))

    if len(audio_segments) == 1:
        audio_data, sample_rate = audio_segments[0]
    else:
        audio_data = np.concatenate([seg for seg, _ in audio_segments])
        sample_rate = audio_segments[0][1]

    sf.write(local_path, audio_data, sample_rate)
    shutil.move(local_path, final_path)
    print(f"✅ Audio saved: {filename}.wav")
    return final_path
    # Concatenate audio segments
    if len(audio_segments) == 1:
        audio_data, sample_rate = audio_segments[0]
    else:
        audio_data = np.concatenate([seg for seg, _ in audio_segments])
        sample_rate = audio_segments[0][1]

    sf.write(local_path, audio_data, sample_rate)
    shutil.move(local_path, final_path)
    print(f"✅ Audio saved: {filename}.wav")
    return final_path


def _sarvam_tts_chunk(text: str, sarvam_lang: str) -> tuple[np.ndarray, int]:
    payload = {
        "text":           text,                # ← "text" not "inputs": [...]
        "target_language_code": sarvam_lang,
        "speaker":        "ishita",            # or "shubh" — both work on bulbul:v3
        "model":          "bulbul:v3",         # ← v3 is latest per your docs
        "pace":           1.1,
        "speech_sample_rate": 22050,
        "output_audio_codec": "mp3",           # ← streaming returns mp3
        "enable_preprocessing": True,
    }
    # Stream response and collect bytes
    audio_buffer = b""
    with requests.post(
        SARVAM_TTS_URL,                        # already updated to /stream in Cell 3
        headers={"api-subscription-key": SARVAM_API_KEY, "Content-Type": "application/json"},
        json=payload,
        stream=True
    ) as resp:
        resp.raise_for_status()
        for chunk in resp.iter_content(chunk_size=8192):
            if chunk:
                audio_buffer += chunk

    import io
    audio_array, sample_rate = sf.read(io.BytesIO(audio_buffer))
    return audio_array, sample_rate

# COMMAND ----------

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CELL 7 — PIPELINE ORCHESTRATION  (logic identical to original)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def run_pipeline(
    query_text: str | None = None,
    audio_path: str | None = None,
    output_filename: str = "rbi_response",
) -> dict:
    """
    Unified pipeline — accepts either text OR audio, returns answer in the same language.

    Args:
        query_text      : text query in any supported language (optional)
        audio_path      : path to audio file with spoken query (optional)
        output_filename : base filename for the output audio

    Returns:
        {
          "user_input":    original text (from audio transcription or direct input),
          "detected_lang": ISO language code detected,
          "lang_name":     human-readable language name,
          "answer_text":   final answer in the user's language,
          "audio_path":    path to the answer audio file,
          "sources":       list of retrieved RAG sources,
        }

    Examples:
        # Voice input (Hindi speaker):
        run_pipeline(audio_path="/Volumes/.../query.mp3")

        # Text input (Telugu):
        run_pipeline(query_text="రెపో రేటు ఏమిటి?")

        # Text input (English):
        run_pipeline(query_text="What are RBI locker safety rules?")
    """
    if audio_path:
        print(f"\n🎤 Transcribing audio: {audio_path}")
        user_input, detected_lang = transcribe_audio(audio_path)
    elif query_text:
        user_input    = query_text.strip()
        detected_lang = detect_language(user_input)
    else:
        raise ValueError("Provide either query_text or audio_path.")

    lang_name = LANG.get(detected_lang, {}).get("name", detected_lang.upper())
    print(f"🌐 Detected language: {lang_name} [{detected_lang}]")
    print(f"📝 Input: {user_input}")

    # Step 1 → translate user input to English for RAG
    english_query = translate(user_input, src_lang=detected_lang, tgt_lang="en")
    print(f"🔤 → English: {english_query}")

    # Step 2 → RAG (LLM answers in English)
    print("\n🧠 Running RAG ...")
    english_answer, sources = rag("RBI regulation: " + english_query)
    print(f"💬 English answer: {english_answer[:200]}...")

    # Step 3 → translate answer back to user's language
    if detected_lang != "en":
        final_answer = translate(english_answer, src_lang="en", tgt_lang=detected_lang)
        print(f"🔤 → {lang_name}: {final_answer[:200]}...")
    else:
        final_answer = english_answer

    # Step 4 → generate audio in user's language via Sarvam Bulbul
    print(f"\n🔊 Generating {lang_name} audio (Bulbul) ...")
    audio_out = generate_audio(final_answer, output_filename, lang=detected_lang)

    return {
        "user_input":    user_input,
        "detected_lang": detected_lang,
        "lang_name":     lang_name,
        "answer_text":   final_answer,
        "audio_path":    audio_out,
        "sources":       sources,
    }


# COMMAND ----------


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CELL 8 — INTERACTIVE DEMO  (identical UX, same pipeline under hood)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def demo_assistant():
    """
    Interactive RBI assistant.
    Supports TEXT mode and VOICE mode.
    Automatically detects language and responds in kind (via Sarvam Bulbul).
    """
    supported = ", ".join(v["name"] for v in LANG.values())

    welcome = (
        "Welcome to Bharat Bricks RBI Assistant. "
        "I understand Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, "
        "Bengali, Gujarati, Punjabi, and English. "
        "Ask me about RBI circulars, banking rules, and policy guidelines."
    )
    print("=" * 60)
    print(welcome)
    print(f"\nSupported languages: {supported}")
    print("=" * 60)

    welcome_audio = generate_audio(welcome, "rbi_welcome", lang="en")
    ipd.display(ipd.Audio(welcome_audio))

    print("\nChoose mode:")
    print("  1 → Text  (type your question in any supported language)")
    print("  2 → Voice (provide audio file path)")
    mode = input("\n👉 Enter 1 or 2: ").strip()
    print()

    # ── TEXT mode ─────────────────────────────────────────────────
    if mode == "1":
        print("💬 TEXT MODE — Type in any supported language. Type 'exit' to quit.\n")
        i = 0
        while True:
            query = input("You: ").strip()
            if query.lower() in ("exit", "quit"):
                print("👋 Goodbye!")
                break
            if not query:
                continue
            try:
                result = run_pipeline(query_text=query, output_filename=f"text_response_{i}")
                print(f"\n🌐 [{result['lang_name']}] Answer:\n{result['answer_text']}\n")
                ipd.display(ipd.Audio(result["audio_path"]))
                print("\n── Sources ──")
                for j, s in enumerate(result["sources"][:3]):
                    print(f"  [{j+1}] {s['chunk_id']} | score: {s['score']:.3f}")
                    print(f"       {s['text'][:120]}...")
                print()
            except Exception as e:
                print(f"❌ Error: {e}\n")
            i += 1

    # ── VOICE mode ────────────────────────────────────────────────
    elif mode == "2":
        print("🎤 VOICE MODE — Provide path to audio file. Type 'exit' to quit.\n")
        intro = "Voice mode active. Please provide the path to your audio file."
        ipd.display(ipd.Audio(generate_audio(intro, "voice_intro", lang="en")))

        i = 0
        while True:
            path = input("🎤 Audio path: ").strip()
            if path.lower() in ("exit", "quit"):
                print("👋 Goodbye!")
                break
            if not path or not os.path.exists(path):
                print("❌ File not found. Try again.\n")
                continue
            try:
                result = run_pipeline(audio_path=path, output_filename=f"voice_response_{i}")
                print(f"\n📝 You said   : {result['user_input']}")
                print(f"🌐 [{result['lang_name']}] Answer:\n{result['answer_text']}\n")
                ipd.display(ipd.Audio(result["audio_path"]))
                print("\n── Sources ──")
                for j, s in enumerate(result["sources"][:3]):
                    print(f"  [{j+1}] {s['chunk_id']} | score: {s['score']:.3f}")
                    print(f"       {s['text'][:120]}...")
                print()
            except Exception as e:
                print(f"❌ Error: {e}\n")
            i += 1

    else:
        print("❌ Invalid option. Please run again and choose 1 or 2.")


# ── Run ────────────────────────────────────────────────────────────
demo_assistant()




# COMMAND ----------

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# QUICK SINGLE-QUERY TEST (optional)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Telugu text query
# result = run_pipeline(
#     query_text="నేను తీసుకున్న హోమ్ లోన్‌ను గడువు కంటే ముందే చెల్లించాలనుకుంటున్నాను. ఫోర్ క్లోజర్ చార్జీలు వసూలు చేయవచ్చా?",
#     output_filename="telugu_test"
# )
# print(result["answer_text"])
# ipd.display(ipd.Audio(result["audio_path"]))

# Hindi audio query
# result = run_pipeline(
#     audio_path="/Volumes/bharatbricks_hackathon/default/bbhackathon/query_hindi.mp3",
#     output_filename="hindi_voice_test"
# )
# print(result["answer_text"])
# ipd.display(ipd.Audio(result["audio_path"]))