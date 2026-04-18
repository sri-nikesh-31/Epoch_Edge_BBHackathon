# Databricks notebook source
# ============================================================
# RBI AI ASSISTANT — FINAL PIPELINE (NOTEBOOK-COMPATIBLE)
# ============================================================

"""
This file integrates your Databricks notebook pipeline directly.

It loads:
    (Clone) final integration.ipynb

and exposes:
    final_pipeline(input_type, content)
"""

# ============================================================
# IMPORTS
# ============================================================

import os
import traceback
import nbformat
from types import ModuleType


# ============================================================
# LOAD NOTEBOOK AS MODULE
# ============================================================

def load_notebook_as_module(notebook_path: str) -> ModuleType:
    """
    Dynamically loads a .ipynb notebook as a Python module.
    """
    module = ModuleType("notebook_module")

    with open(notebook_path, "r", encoding="utf-8") as f:
        notebook = nbformat.read(f, as_version=4)

    code_cells = [
        cell["source"]
        for cell in notebook["cells"]
        if cell["cell_type"] == "code"
    ]

    exec("\n\n".join(code_cells), module.__dict__)
    return module


# ============================================================
# LOAD YOUR PIPELINE NOTEBOOK
# ============================================================

NOTEBOOK_PATH = "(Clone) final integration.ipynb"

nb_module = load_notebook_as_module(NOTEBOOK_PATH)

# Get run_pipeline from notebook
run_pipeline = nb_module.run_pipeline


# ============================================================
# MAIN ENTRY FUNCTION
# ============================================================

def final_pipeline(input_type: str, content: str):
    """
    Unified RBI Assistant interface.

    input_type:
        "text"  → content = query string
        "audio" → content = audio file path
    """

    try:
        # ---- VALIDATION ----
        if input_type not in ["text", "audio"]:
            return {"error": "input_type must be 'text' or 'audio'"}

        if not content:
            return {"error": "content cannot be empty"}

        # ---- TEXT MODE ----
        if input_type == "text":
            result = run_pipeline(
                query_text=content,
                output_filename="text_response"
            )

        # ---- AUDIO MODE ----
        else:
            if not os.path.exists(content):
                return {"error": f"Audio file not found: {content}"}

            result = run_pipeline(
                audio_path=content,
                output_filename="audio_response"
            )

        # ---- STANDARD OUTPUT ----
        return {
            "text": result.get("answer_text"),
            "audio": result.get("audio_path"),
            "sources": result.get("sources", []),
            "language": result.get("lang_name"),
            "user_input": result.get("user_input", content)
        }

    except Exception as e:
        return {
            "error": str(e),
            "trace": traceback.format_exc()
        }


# ============================================================
# OPTIONAL: DATA PIPELINE
# ============================================================

def run_data_pipeline():
    from scraper import main
    main()


# ============================================================
# OPTIONAL: DASHBOARD
# ============================================================

def run_dashboard():
    from dashboard import analyze_repo_trends_with_widgets
    analyze_repo_trends_with_widgets()


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":
    print("\n🚀 Testing pipeline...\n")

    res = final_pipeline("text", "What is RBI repo rate?")

    if "error" in res:
        print("❌ Error:", res["error"])
    else:
        print("\n📝 Answer:\n", res["text"])
        print("\n🌐 Language:", res["language"])

        print("\n📚 Sources:")
        for i, s in enumerate(res["sources"][:3]):
            print(f"[{i+1}] {s.get('chunk_id')} | score: {s.get('score')}")

        if res.get("audio"):
            print("\n🔊 Audio file:", res["audio"])