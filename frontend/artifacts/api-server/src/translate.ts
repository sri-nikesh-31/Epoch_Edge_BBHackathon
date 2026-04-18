const NLLB_CODES: Record<string, string> = {
  english:   "eng_Latn",
  hindi:     "hin_Deva",
  tamil:     "tam_Taml",
  bengali:   "ben_Beng",
  marathi:   "mar_Deva",
  telugu:    "tel_Telu",
  gujarati:  "guj_Gujr",
  kannada:   "kan_Knda",
  malayalam: "mal_Mlym",
  punjabi:   "pan_Guru",
  odia:      "ory_Orya",
  urdu:      "urd_Arab",
  assamese:  "asm_Beng",
};

const HF_API = "https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M";

async function callNLLB(text: string, srcLang: string, tgtLang: string): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.HF_TOKEN) headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;

  const res = await fetch(HF_API, {
    method: "POST",
    headers,
    body: JSON.stringify({
      inputs: text,
      parameters: { src_lang: srcLang, tgt_lang: tgtLang },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`HF API error ${res.status}`);
  const data = await res.json() as Array<{ translation_text: string }>;
  if (!Array.isArray(data) || !data[0]?.translation_text) throw new Error("Unexpected HF response");
  return data[0].translation_text;
}

export async function translateToEnglish(text: string, fromLang: string): Promise<string> {
  if (fromLang === "english") return text;
  const src = NLLB_CODES[fromLang];
  if (!src) return text;
  try {
    return await callNLLB(text, src, "eng_Latn");
  } catch {
    return text;
  }
}

export async function translateFromEnglish(text: string, toLang: string): Promise<string> {
  if (toLang === "english") return text;
  const tgt = NLLB_CODES[toLang];
  if (!tgt) return text;
  try {
    return await callNLLB(text, "eng_Latn", tgt);
  } catch {
    return text;
  }
}
