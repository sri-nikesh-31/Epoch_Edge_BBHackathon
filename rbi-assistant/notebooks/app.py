import streamlit as st
from pipeline import final_pipeline
import tempfile

st.set_page_config(page_title="RBI AI Assistant", layout="wide")

st.title("🏦 RBI AI Assistant")
st.markdown("Ask questions about RBI policies using **text or audio**.")

mode = st.radio("Choose Input Type", ["Text", "Audio"])

# ================= TEXT =================
if mode == "Text":
    query = st.text_area("Enter your question")

    if st.button("Submit"):
        if not query.strip():
            st.warning("Enter a question")
        else:
            with st.spinner("Processing..."):
                res = final_pipeline("text", query)

            if "error" in res:
                st.error(res["error"])
            else:
                st.subheader("📝 Answer")
                st.write(res["text"])

                if res.get("audio"):
                    st.subheader("🔊 Audio")
                    st.audio(res["audio"])

                st.subheader("📚 Sources")
                for s in res["sources"][:3]:
                    st.markdown(f"**{s.get('chunk_id')}** | score: {s.get('score')}")
                    st.caption(s.get("text", "")[:200])


# ================= AUDIO =================
else:
    file = st.file_uploader("Upload audio", type=["wav", "mp3"])

    if file and st.button("Process Audio"):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(file.read())
            path = tmp.name

        with st.spinner("Processing audio..."):
            res = final_pipeline("audio", path)

        if "error" in res:
            st.error(res["error"])
        else:
            st.subheader("📝 You said")
            st.write(res["user_input"])

            st.subheader("🧠 Answer")
            st.write(res["text"])

            if res.get("audio"):
                st.subheader("🔊 Audio")
                st.audio(res["audio"])

            st.subheader("📚 Sources")
            for s in res["sources"][:3]:
                st.markdown(f"**{s.get('chunk_id')}** | score: {s.get('score')}")
                st.caption(s.get("text", "")[:200])
