from fastapi import FastAPI
from pydantic import BaseModel
import requests

app = FastAPI()

# Input schema
class Query(BaseModel):
    text: str

# 🔴 PUT YOUR DETAILS HERE
DATABRICKS_ENDPOINT = "https://<your-endpoint>/invocations"
TOKEN = "your_token_here"

@app.get("/")
def home():
    return {"message": "Backend running 🚀"}

@app.post("/chat")
def chat(query: Query):
    response = requests.post(
        DATABRICKS_ENDPOINT,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json"
        },
        json={"inputs": query.text}
    )

    return response.json()