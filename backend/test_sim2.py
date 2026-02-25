import os, numpy as np
from google import genai

client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

def get_emb(t):
    res = client.models.embed_content(model="gemini-embedding-001", contents=t)
    return np.array(res.embeddings[0].values)

e1 = get_emb("Information about Golden Retrievers, dog breed, puppies, pet care, canine health.")
e2 = get_emb("Indian Cinema, Tollywood, Bollywood, Actor, Hero, Movie script, Film industry.")

print(f"Dog vs Cinema: {np.dot(e1, e2)/(np.linalg.norm(e1)*np.linalg.norm(e2)):.4f}")
