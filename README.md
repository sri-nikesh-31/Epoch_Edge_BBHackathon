# RBI Janamitra

RBI Janamitra is a multilingual AI assistant built on Databricks that enables users to understand RBI policies through text and voice queries. It combines a Retrieval-Augmented Generation (RAG) pipeline with Indian AI models to deliver accessible and accurate financial insights.

---

## Architecture (Databricks-Centric)

```
                         ┌────────────────────────────┐
                         │        User Interface       │
                         │  (Streamlit / Notebook UI)  │
                         └────────────┬───────────────┘
                                      │
                                      ▼
                         ┌────────────────────────────┐
                         │   Application Layer        │
                         │ (Chatbot + Repo Analyzer)  │
                         └────────────┬───────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌────────────────┐        ┌────────────────────┐        ┌────────────────────┐
│ Sarvam STT     │        │ Sarvam Translation │        │ Sarvam TTS         │
│ (Speech Input) │        │ (Indian Languages) │        │ (Voice Output)     │
└────────────────┘        └────────────────────┘        └────────────────────┘

                                      │
                                      ▼
                ┌──────────────────────────────────────────────┐
                │        Databricks RAG Pipeline               │
                │                                              │
                │  1. Embeddings (BGE via MLflow)              │
                │  2. Vector Search (Delta Table)              │
                │  3. LLM Inference (Llama 3 via MLflow)       │
                └────────────────────┬─────────────────────────┘
                                     │
                                     ▼
        ┌──────────────────────────────────────────────────────────────┐
        │                Databricks Data Architecture                  │
        │                                                              │
        │  Bronze  → Raw RBI PDFs ingestion (rbi_bronze_docs)          │
        │  Silver  → Structured extraction (rbi_silver_policy)         │
        │  Gold    → Analytics-ready tables (rbi_gold_repo_rates)      │
        │                                                              │
        │  Vector Store → rbi_embeddings (for retrieval)               │
        └──────────────────────────────────────────────────────────────┘
```

---

## How Databricks Components Connect

The system is built using Databricks-native components and follows a structured data and inference pipeline.

### Data Pipeline (Bronze → Silver → Gold)

* Bronze Layer: Raw RBI PDF documents are ingested into Delta tables
* Silver Layer: LLM-based extraction structures the data into usable fields
* Gold Layer: Clean, analytics-ready tables are generated for insights

### RAG Pipeline

* RBI documents are chunked and stored in Delta tables
* Embeddings are generated using the BGE Large model
* MLflow deployments are used for:

  * Embedding generation
  * LLM inference (Llama 3.1 / 70B)
* Retrieval is performed using similarity search over embeddings

### Query Flow

1. User provides input (text or voice)
2. Speech input is converted using Sarvam STT
3. Input is translated to English using Facebook NLLB
4. Relevant documents are retrieved using the RAG pipeline
5. LLM generates a contextual response
6. Response is translated back to the user’s language
7. Output is converted to speech using Sarvam TTS

---

## Indian AI Integration

The system integrates Indian AI models for multilingual accessibility:

* Saaras: Speech-to-Text for Indian languages
* Mayura: Translation across Indian languages
* Bulbul: Text-to-Speech for Indian voice output

This ensures usability for non-English speakers, particularly in rural contexts.

---

## Technologies Used

### Databricks

* Delta Tables (Bronze, Silver, Gold architecture)
* MLflow Deployments for model serving
* Spark SQL for querying and analytics
* Notebook-based execution

### Models

* LLaMA 3.1 / LLaMA 3 70B (Language Model via Databricks)
* BGE Large (Embedding Model)
* Facebook NLLB (Translation Model)
* Sarvam AI Models (Speech Processing)

---

## How to Run

### Databricks (Recommended)

1. Upload the code to Databricks Workspace
2. Attach a compute cluster
3. Execute the main notebook or script

```python
%run /Workspace/Users/<your-username>/app
```

---

### Local Execution (Optional)

```bash
pip install -r requirements.txt
streamlit run app.py
```

---

## Demo Steps

### Repo Rate Analysis

1. Select "Repo Rates"
2. Run analysis
3. View trend charts and structured data

### AI Insights

1. Navigate to insights section
2. Generate analysis
3. Review model-generated insights

### RBI Assistant (Chatbot)

1. Enter a query such as:
   "What is repo rate?"
2. Optionally provide voice input
3. Receive:

   * Text response
   * Source-backed explanation
   * Audio output

---

## Key Features

* Multilingual AI assistant supporting Indian languages
* Voice and text-based interaction
* Databricks-native RAG pipeline
* Structured data architecture (Bronze, Silver, Gold)
* Repo rate analytics and AI-generated insights
* Designed for accessibility and scalability

---

## Deployment

The system is deployed using Databricks notebooks and integrated services.
