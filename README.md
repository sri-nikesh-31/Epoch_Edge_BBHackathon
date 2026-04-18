# 🏦 RBI Assistant — RAG-Based Financial Intelligence System

## 📌 Overview

RBI Assistant is a backend-driven system designed to **simplify and democratize access to RBI policies and financial information**.

It leverages a **Retrieval-Augmented Generation (RAG)** pipeline to:

* Understand user queries in natural language
* Retrieve relevant RBI documents/data
* Generate accurate, contextual responses

This system is built to support:

* Policy explanation
* Financial guidance
* Intelligent document querying

---

## 🧠 Core Idea

Instead of relying only on a language model, this system:

1. Retrieves **relevant RBI data**
2. Injects it into the prompt
3. Generates **fact-grounded answers**

👉 This ensures **accuracy + context-awareness**

---

## ⚙️ System Architecture

```
                ┌────────────────────┐
                │    User Query      │
                └─────────┬──────────┘
                          ↓
                ┌────────────────────┐
                │   chatbot.py       │
                │ (entry interface)  │
                └─────────┬──────────┘
                          ↓
                ┌────────────────────┐
                │      rag.py        │
                │ (RAG pipeline)     │
                └─────────┬──────────┘
                          ↓
        ┌──────────────────────────────────┐
        │  Retrieval Layer                 │
        │  - embeddings                   │
        │  - vector search               │
        └─────────┬──────────────────────┘
                          ↓
                ┌────────────────────┐
                │  Relevant Context  │
                └─────────┬──────────┘
                          ↓
                ┌────────────────────┐
                │   LLM Generation   │
                └─────────┬──────────┘
                          ↓
                ┌────────────────────┐
                │   Final Response   │
                └────────────────────┘
```

---

## 📂 Project Structure

```
rbi-assistant/
│
├── app/                        # Core application logic
│   ├── chatbot.py              # Handles user queries & flow
│   ├── rag.py                  # Retrieval + generation logic
│   ├── repo_analyzer.py        # Repo insights module
│   ├── audio.py                # Voice input/output (optional)
│   ├── translate.py            # Multi-language support
│   ├── utils.py                # Helper functions
│
├── pipelines/                  # Offline data pipelines
│   ├── data_loader.py          # Load RBI data (PDF/API)
│   ├── chunking.py             # Split text into chunks
│   ├── embedding.py            # Convert text → embeddings
│
├── notebooks/                  # Experimental scripts / testing
│
├── config/
│   └── config.py               # Configurations & constants
│
├── main.py                     # Entry point
├── requirements.txt
└── README.md
```

---

## 🔄 RAG Pipeline Flow

### Step 1: Data Loading

* RBI documents (PDFs, circulars, datasets) are ingested
* Handled in: `pipelines/data_loader.py`

---

### Step 2: Chunking

* Large documents are split into smaller chunks
* Improves retrieval accuracy

Handled in:

```
pipelines/chunking.py
```

---

### Step 3: Embedding

* Each chunk is converted into a vector representation
* Stored in a vector database

Handled in:

```
pipelines/embedding.py
```

---

### Step 4: Query Processing

* User query is converted into embedding
* Similar chunks are retrieved

Handled in:

```
app/rag.py
```

---

### Step 5: Response Generation

* Retrieved context is passed to LLM
* Final answer is generated

---

## 🚀 How to Run

### 1. Install dependencies

```
pip install -r requirements.txt
```

### 2. Run the backend

```
python main.py
```

---

## 🧪 Example Flow

```
User: What is RBI repo rate?

→ chatbot.py receives query  
→ rag.py retrieves relevant RBI documents  
→ context passed to LLM  
→ response generated  

Output:
"RBI repo rate is the rate at which..."
```

---

## 🔌 Extensibility

This system can be extended to:

* 🔊 Voice-based interaction (`audio.py`)
* 🌍 Multi-language support (`translate.py`)
* 📊 Repo analysis (`repo_analyzer.py`)
* ⚡ Real-time fraud detection models

---

## 🎯 Use Case

This project addresses:

> **“Secure and democratize financial access”**

By enabling:

* Easy understanding of RBI policies
* Access to financial insights in simple language
* Scalable AI-driven assistance

---

## 🧠 Future Improvements

* Vector DB integration (FAISS / Pinecone)
* Fine-tuned financial LLM
* Multilingual chatbot
* Deployment on Databricks / cloud

---

## 👨‍💻 Authors

* Team Epoch Edge
* Built for BB Hackathon
