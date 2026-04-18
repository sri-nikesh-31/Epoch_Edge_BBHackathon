import os
import traceback

# 👇 import from SAME folder (important)
from Final_integration import run_pipeline


def final_pipeline(input_type: str, content: str):
    try:
        if input_type not in ["text", "audio"]:
            return {"error": "input_type must be 'text' or 'audio'"}

        if not content:
            return {"error": "content cannot be empty"}

        # TEXT
        if input_type == "text":
            result = run_pipeline(
                query_text=content,
                output_filename="text_response"
            )

        # AUDIO
        else:
            if not os.path.exists(content):
                return {"error": f"Audio file not found: {content}"}

            result = run_pipeline(
                audio_path=content,
                output_filename="audio_response"
            )

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


# OPTIONAL
def run_dashboard():
    from repo_analyzer import analyze_repo_trends_with_widgets
    return analyze_repo_trends_with_widgets()
