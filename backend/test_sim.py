import os, numpy as np
from google import genai

client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

def get_emb(t):
    return np.array(client.models.embed_content(model="gemini-embedding-001", contents=t).embeddings[0].values)

e1 = get_emb("Quarterly finance report and stock market trends, banking and investments.")
e2 = get_emb("Personal finance tips, budgeting, and how to save money.")

print(f"Finance vs Finance (Related): {np.dot(e1, e2)/(np.linalg.norm(e1)*np.linalg.norm(e2)):.4f}")
