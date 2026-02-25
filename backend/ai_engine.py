import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

EMBEDDING_MODEL = "models/text-embedding-004"

def generate_embedding(text):
    if not text.strip():
        return None
    result = genai.embed_content(model=EMBEDDING_MODEL, content=text)
    return result['embedding']
