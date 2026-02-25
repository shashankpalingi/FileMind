from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, WebSocket, UploadFile, File, Depends, HTTPException
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import asyncio
import threading
import os
import tempfile

from cluster_engine import get_engine_state, remove_file, recluster_all, add_file
from extractor import extract_text, chunk_text, extract_metadata

from pydantic import BaseModel
import numpy as np

from auth import get_current_user
from supabase_client import supabase, supabase_admin, STORAGE_BUCKET

# -----------------------------
# MODEL SETUP
# -----------------------------

# Configure Google Generative AI for embeddings
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
EMBEDDING_MODEL = "models/embedding-001"

def embed_texts(texts):
    """Embed one or more texts using Google Generative AI."""
    if isinstance(texts, str):
        texts = [texts]
    result = genai.embed_content(model=EMBEDDING_MODEL, content=texts)
    return [np.array(e) for e in result['embedding']]

def embed_query(text):
    """Embed a single query string. Returns a numpy array."""
    result = genai.embed_content(model=EMBEDDING_MODEL, content=text)
    return np.array(result['embedding'])

def cosine_similarity_pairs(a, b):
    """Compute cosine similarity between two vectors (numpy arrays)."""
    a, b = np.array(a).flatten(), np.array(b).flatten()
    dot = np.dot(a, b)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    return float(dot / norm) if norm > 0 else 0.0

# Groq client for RAG chatbot
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = "llama-3.3-70b-versatile"

# Sanity Check for API Keys
REQUIRED_KEYS = ["SUPABASE_URL", "SUPABASE_KEY", "GROQ_API_KEY"]
missing_keys = [k for k in REQUIRED_KEYS if not os.getenv(k) or "xxxx" in str(os.getenv(k))]
if missing_keys:
    print(f"\n[!] WARNING: Missing or placeholder API keys in .env: {', '.join(missing_keys)}")
    print("[!] Some features (Naming, RAG) may fail until these are provided.\n")

# -----------------------------
# FASTAPI SETUP
# -----------------------------

class SearchRequest(BaseModel):
    query: str

class AuthRequest(BaseModel):
    email: str
    password: str

app = FastAPI()

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connected_clients = []

# -----------------------------
# FILE PROCESSOR (temp file → embed → cluster → delete)
# -----------------------------

def process_file_content(file_content: bytes, filename: str, user_id: str):
    """
    Process a file: extract text, embed, cluster. Uses temp file for extraction.
    No permanent local storage — files live in Supabase only.
    """
    ext = os.path.splitext(filename)[1].lower()
    tmp_path = None

    try:
        # Save to temp for text extraction
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name

        content = extract_text(tmp_path)
        if not content:
            print(f"PROCESS: Skipping empty/unreadable file: {filename}")
            return

        chunks = chunk_text(content, chunk_size=500, overlap=100)
        if len(chunks) > 20:
            print(f"PROCESS: Truncating {filename} to 20 chunks")
            chunks = chunks[:20]

        if not chunks:
            return

        print(f"PROCESS: Embedding {len(chunks)} chunks for {filename}...")
        embeddings = embed_texts(chunks)
        chunks_data = [{"text": t, "embedding": e.tolist()} for t, e in zip(chunks, embeddings)]

        metadata = extract_metadata(tmp_path)
        metadata["filename"] = filename

        # Cluster using just the filename as key (no absolute paths)
        add_file(user_id, filename, chunks_data, metadata)
        print(f"PROCESS: Done — {filename} (user: {user_id})")

    except Exception as e:
        import traceback
        print(f"PROCESS ERROR ({filename}): {e}")
        traceback.print_exc()
    finally:
        # Always clean up temp file
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

# -----------------------------
# AUTH ENDPOINTS (public)
# -----------------------------

@app.post("/auth/signup")
async def signup(request: AuthRequest):
    try:
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        if response.user:
            return {
                "status": "success",
                "message": "Account created. Please check your email for confirmation.",
                "user_id": response.user.id
            }
        return {"status": "error", "message": "Sign-up failed"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def login(request: AuthRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        return {
            "status": "success",
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "FileMind Backend Running"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            await asyncio.sleep(1)
    except:
        connected_clients.remove(websocket)

@app.get("/status")
def system_status(user_id: str = Depends(get_current_user)):
    storage, _, _ = get_engine_state(user_id)
    return {
        "status": "running",
        "clusters": len(storage),
        "files": sum(len(c["files"]) for c in storage.values())
    }

# -----------------------------
# CLUSTER ENDPOINTS
# -----------------------------

@app.get("/clusters")
def get_clusters(user_id: str = Depends(get_current_user)):
    """Returns enriched cluster data with stability, confidence, and bridge files."""
    storage, _, _ = get_engine_state(user_id)

    # get_engine_state already filters bridge_files from cluster keys
    # but raw storage still has it — load separately
    from storage import load_storage
    raw = load_storage(user_id)
    bridge_files = raw.get("bridge_files", {})

    enriched = {}
    for cid, cdata in storage.items():
        enriched[cid] = {
            "label": cdata.get("label", f"Cluster_{cid}"),
            "stability_score": cdata.get("stability_score", 0.0),
            "internal_cohesion": cdata.get("internal_cohesion", 0.0),
            "files": cdata.get("files", {}),
            "metadata": cdata.get("metadata", {}),
            "file_scores": cdata.get("file_scores", {}),
        }

    bridge_display = {}
    for fname, bdata in bridge_files.items():
        bridge_display[fname] = {**bdata, "filename": os.path.basename(fname)}

    return {"clusters": enriched, "bridge_files": bridge_display}

@app.get("/files")
def list_files_with_metadata(user_id: str = Depends(get_current_user)):
    """Returns list of files with metadata, cluster info, and confidence scores."""
    storage, _, _ = get_engine_state(user_id)
    all_files = []
    for cluster_id, cluster_data in storage.items():
        metadata_map = cluster_data.get("metadata", {})
        file_scores = cluster_data.get("file_scores", {})
        for file_name in cluster_data["files"]:
            scores = file_scores.get(file_name, {})
            all_files.append({
                "file": file_name,
                "cluster_name": os.path.basename(file_name),
                "cluster_id": cluster_id,
                "cluster_label": cluster_data.get("label", "Unknown"),
                "metadata": metadata_map.get(file_name, {}),
                "confidence": scores.get("confidence", 0.0),
                "placement_reason": scores.get("placement_reason", ""),
            })
    return all_files

# -----------------------------
# UPLOAD ENDPOINT
# -----------------------------

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    """
    Upload flow:
    1. Store in Supabase Storage (permanent)
    2. Process in background: temp file → extract → embed → cluster → delete temp
    No permanent local storage.
    """
    try:
        allowed_extensions = {".txt", ".pdf"}
        filename = "".join(c for c in file.filename if c.isalnum() or c in (".", "-", "_")).strip()
        ext = os.path.splitext(filename)[1].lower()
        if ext not in allowed_extensions:
            return {"error": f"Unsupported file type: {ext}. Only .txt and .pdf are allowed."}

        content = await file.read()
        storage_path = f"{user_id}/{filename}"

        # Upload to Supabase Storage (permanent home)
        supabase_admin.storage.from_(STORAGE_BUCKET).upload(
            path=storage_path,
            file=content,
            file_options={"content-type": file.content_type or "application/octet-stream", "upsert": "true"}
        )
        print(f"UPLOAD: Stored {filename} in Supabase")

        # Process in background thread (temp file, no permanent local storage)
        thread = threading.Thread(
            target=process_file_content,
            args=(content, filename, user_id),
            daemon=True
        )
        thread.start()

        return {"status": "success", "filename": filename, "path": storage_path}
    except Exception as e:
        print(f"UPLOAD ERROR: {e}")
        return {"error": str(e)}

# -----------------------------
# DELETE ENDPOINT
# -----------------------------

@app.delete("/files/{filename}")
async def delete_file(filename: str, user_id: str = Depends(get_current_user)):
    """
    Delete flow:
    1. Remove from Supabase Storage
    2. Remove from cluster storage (JSON)
    No local disk operations.
    """
    try:
        # Remove from Supabase Storage
        storage_path = f"{user_id}/{filename}"
        try:
            supabase_admin.storage.from_(STORAGE_BUCKET).remove([storage_path])
            print(f"DELETE: Removed {filename} from Supabase")
        except Exception as e:
            print(f"DELETE: Supabase warning: {e}")

        # Remove from cluster storage
        remove_file(user_id, filename)

        return {"status": "success", "filename": filename}
    except Exception as e:
        print(f"DELETE ERROR: {e}")
        return {"error": str(e)}

# -----------------------------
# UPDATE ENDPOINT
# -----------------------------

@app.put("/files/{filename}")
async def update_file(filename: str, file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    """
    Update flow:
    1. Replace in Supabase Storage
    2. Remove old entry from cluster storage
    3. Re-process new version (temp file)
    """
    try:
        allowed_extensions = {".txt", ".pdf"}
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed_extensions:
            return {"error": f"Unsupported file type: {ext}"}

        content = await file.read()
        storage_path = f"{user_id}/{filename}"

        # Replace in Supabase
        supabase_admin.storage.from_(STORAGE_BUCKET).upload(
            path=storage_path,
            file=content,
            file_options={"content-type": file.content_type or "application/octet-stream", "upsert": "true"}
        )
        print(f"UPDATE: Replaced {filename} in Supabase")

        # Remove old entry and re-process
        remove_file(user_id, filename)

        thread = threading.Thread(
            target=process_file_content,
            args=(content, filename, user_id),
            daemon=True
        )
        thread.start()

        return {"status": "success", "filename": filename, "path": storage_path}
    except Exception as e:
        print(f"UPDATE ERROR: {e}")
        return {"error": str(e)}

# -----------------------------
# SEARCH ENDPOINT
# -----------------------------

@app.post("/search")
def search_files(request: SearchRequest, user_id: str = Depends(get_current_user)):
    try:
        storage, _, _ = get_engine_state(user_id)
        query_embedding = embed_query(request.query)
        results = []

        for cluster_id, cluster_data in storage.items():
            for file_name, chunks in cluster_data["files"].items():
                max_sim = -1.0
                best_chunk = ""

                for chunk in chunks:
                    sim = cosine_similarity_pairs(query_embedding, chunk["embedding"])
                    if sim > max_sim:
                        max_sim = sim
                        best_chunk = chunk["text"]

                results.append({
                    "file": file_name,
                    "similarity": float(max_sim),
                    "snippet": best_chunk[:200] + "...",
                    "cluster_label": cluster_data.get("label", cluster_id)
                })

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return {"results": results[:5]}
    except Exception as e:
        print("SEARCH ERROR:", e)
        return {"results": [], "error": str(e)}

# -----------------------------
# RAG QA ENDPOINT
# -----------------------------

@app.post("/ask")
def rag_answer(request: SearchRequest, user_id: str = Depends(get_current_user)):
    try:
        storage, _, _ = get_engine_state(user_id)
        query_embedding = embedding_model.encode(request.query)
        all_chunks = []

        for cluster_id, cluster_data in storage.items():
            for file_name, chunks in cluster_data["files"].items():
                for chunk in chunks:
                    similarity = cosine_similarity_pairs(query_embedding, chunk["embedding"])
                    all_chunks.append({
                        "file": file_name,
                        "text": chunk["text"],
                        "similarity": similarity
                    })

        all_chunks.sort(key=lambda x: x["similarity"], reverse=True)
        top_chunks = all_chunks[:10]

        if not top_chunks:
            return {"answer": "No relevant documents found.", "sources": [], "confidence": 0.0}

        confidence = sum(c["similarity"] for c in top_chunks[:3]) / min(3, len(top_chunks))

        MAX_CONTEXT_CHARS = 4000
        context_parts = []
        chars_used = 0
        sources = set()
        seen_chunks = set()

        for chunk in top_chunks:
            if chunk["text"] in seen_chunks:
                continue
            seen_chunks.add(chunk["text"])

            header = f"[File: {os.path.basename(chunk['file'])}]\n"
            content = f"{chunk['text']}\n\n"

            if chars_used + len(header) + len(content) > MAX_CONTEXT_CHARS:
                break

            context_parts.append(header + content)
            chars_used += len(header) + len(content)
            sources.add(chunk["file"])

        context = "".join(context_parts)

        prompt = f"""
You are an AI assistant for document-based question answering.

Rules:
- Use ONLY the provided context
- If answer not present → say "Information not found in knowledge base"
- Be concise and factual

Context:
{context}

Question:
{request.query}

Answer:
"""

        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an AI assistant for document QA. Use ONLY the provided context."},
                {"role": "user", "content": prompt}
            ],
            model=GROQ_MODEL,
            temperature=0.1,
            max_tokens=1024,
        )

        answer = chat_completion.choices[0].message.content.strip() if chat_completion.choices else "AI returned empty response."

        return {
            "answer": answer,
            "sources": list(sources),
            "confidence": float(confidence)
        }
    except Exception as e:
        print("RAG ERROR:", e)
        error_msg = "API Rate limit exceeded." if "429" in str(e) else "AI service error."
        return {"answer": error_msg, "sources": [], "confidence": 0.0, "error": str(e)}

# -----------------------------
# RECLUSTER ENDPOINT
# -----------------------------

@app.post("/recluster")
async def trigger_recluster(user_id: str = Depends(get_current_user)):
    """Re-cluster all files from stored embeddings. No disk access needed."""
    try:
        recluster_all(user_id)

        storage, _, _ = get_engine_state(user_id)
        from storage import load_storage
        bridge_files = load_storage(user_id).get("bridge_files", {})

        cluster_summary = {}
        stability_scores = []
        for cid, cdata in storage.items():
            stability = cdata.get("stability_score", 0.0)
            stability_scores.append(stability)
            cluster_summary[cid] = {
                "label": cdata.get("label", "Unknown"),
                "file_count": len(cdata["files"]),
                "files": list(cdata["files"].keys()),
                "stability_score": stability,
            }

        avg_stability = sum(stability_scores) / len(stability_scores) if stability_scores else 0.0

        return {
            "status": "success",
            "clusters": len(storage),
            "summary": cluster_summary,
            "avg_stability": round(avg_stability, 4),
            "bridge_file_count": len(bridge_files),
        }
    except Exception as e:
        print(f"RECLUSTER ERROR: {e}")
        return {"error": str(e)}

# No watcher thread — files come through the API only.
# Embeddings are stored in JSON. No startup re-indexing needed.
print("✓ FileMind backend ready (SaaS mode — no watcher, no local storage)")
