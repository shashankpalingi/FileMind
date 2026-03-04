"""
SaaS-grade semantic clustering engine for FileMind.

Architecture:
- Files live in Supabase Storage — NO local disk dependency
- Embeddings + clusters stored in per-user JSON
- Naming uses stored chunk text (no disk reads)
- Clusters are virtual groups (no physical folders)
- All operations are per-user scoped

Algorithm: Online Agglomerative Clustering with Pairwise Coherence
- Best-match against ALL cluster centroids (not first-match)
- Pairwise coherence check before joining
- Adaptive thresholds based on corpus size
- Bridge file detection for ambiguous placements
- Per-file confidence scores + placement explainability
- Deterministic ordering for UX consistency
"""

import numpy as np
import os
from storage import load_storage, save_storage
from naming_engine import generate_cluster_label
import time


def _cosine_sim(a, b):
    """Cosine similarity between two vectors."""
    a, b = np.array(a).flatten(), np.array(b).flatten()
    dot = np.dot(a, b)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    return float(dot / norm) if norm > 0 else 0.0


def _cosine_sim_matrix(vectors):
    """Pairwise cosine similarity matrix for a list of vectors."""
    mat = np.array(vectors)
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    normalized = mat / norms
    return np.dot(normalized, normalized.T)

# ─── Base Thresholds (tuned strictly for google-genai embeddings) ─────
BASE_PRIMARY_THRESHOLD = 0.72
BASE_COHERENCE_THRESHOLD = 0.68
BASE_MERGE_THRESHOLD = 0.75
BRIDGE_PROXIMITY_RATIO = 0.85


# ─── Adaptive Thresholds ──────────────────────────────────────────────

def _adaptive_factor(storage):
    """Scale thresholds by corpus size. Small=lenient, large=strict."""
    total = sum(len(c.get("files", {})) for k, c in storage.items() if k != "bridge_files")
    if total < 5:
        return 1.05  # Extra strict for first few files
    elif total <= 20:
        return 1.0
    return 1.02


def _get_thresholds(storage):
    f = _adaptive_factor(storage)
    return {
        "primary": BASE_PRIMARY_THRESHOLD * f,
        "coherence": BASE_COHERENCE_THRESHOLD * f,
        "merge": BASE_MERGE_THRESHOLD * f,
    }


# ─── Helpers ───────────────────────────────────────────────────────────

def _cluster_keys(storage):
    """Get only real cluster keys, excluding bridge_files."""
    return [k for k in storage.keys() if k != "bridge_files"]


def _next_cluster_id(storage):
    keys = _cluster_keys(storage)
    if not keys:
        return 0
    return max(int(k) for k in keys) + 1


def _file_embedding(chunks_data):
    embs = [np.array(c["embedding"]) for c in chunks_data if "embedding" in c]
    if not embs:
        return None
    return np.mean(embs, axis=0)


def _cluster_member_embeddings(cluster_data):
    embeddings = {}
    for fpath, chunks in cluster_data["files"].items():
        emb = _file_embedding(chunks)
        if emb is not None:
            embeddings[fpath] = emb
    return embeddings


def _update_centroid(cluster_data):
    member_embs = _cluster_member_embeddings(cluster_data)
    if member_embs:
        cluster_data["centroid"] = np.mean(list(member_embs.values()), axis=0).tolist()
    return cluster_data


def _prune_empty_clusters(storage):
    """Remove clusters with zero files. Never touches bridge_files."""
    empty = [cid for cid in _cluster_keys(storage)
             if len(storage[cid].get("files", {})) == 0]
    for cid in empty:
        print(f"CLUSTER: Pruning empty cluster {cid} (was: {storage[cid].get('label', '?')})")
        del storage[cid]
    return storage


def _compute_stability(cluster_data):
    """Cluster cohesion score (0.0–1.0) from average pairwise similarity."""
    member_embs = _cluster_member_embeddings(cluster_data)
    if len(member_embs) <= 1:
        return 1.0
    emb_list = list(member_embs.values())
    sim_matrix = _cosine_sim_matrix(emb_list)
    n = len(emb_list)
    total = sum(sim_matrix[i][j] for i in range(n) for j in range(i + 1, n))
    count = n * (n - 1) // 2
    return total / count if count > 0 else 1.0


def _get_file_texts(cluster_data):
    """Extract text snippets from stored chunks for naming (no disk needed)."""
    file_texts = {}
    for fpath, chunks in cluster_data["files"].items():
        texts = [c.get("text", "") for c in chunks[:3]]
        file_texts[os.path.basename(fpath)] = " ".join(texts)[:500]
    return file_texts


# ─── Core API ──────────────────────────────────────────────────────────

def get_engine_state(user_id):
    """Rebuilds clusters and file_embeddings from storage. Excludes bridge_files."""
    raw = load_storage(user_id)
    # Return only real clusters — never expose bridge_files to callers
    storage = {k: v for k, v in raw.items() if k != "bridge_files"}
    file_embeddings = {}
    clusters = {}

    for cid, cluster_data in storage.items():
        clusters[int(cid)] = list(cluster_data["files"].keys())
        file_embeddings.update(_cluster_member_embeddings(cluster_data))

    return storage, file_embeddings, clusters


def add_file(user_id, file_name, chunks_data, metadata, skip_naming=False):
    """
    Add a file to the best-matching cluster, or create a new one.
    
    Key SaaS behaviors:
    - file_name is just the filename (not a disk path)
    - Only names cluster on CREATION (not every file add)
    - Stores confidence scores + placement reason
    - Detects bridge files
    """
    storage = load_storage(user_id)
    thresholds = _get_thresholds(storage)

    file_emb = _file_embedding(chunks_data)
    if file_emb is None:
        return

    # Remove from any existing cluster (handles re-uploads)
    for cid in _cluster_keys(storage):
        cdata = storage[cid]
        if file_name in cdata["files"]:
            cdata["files"].pop(file_name)
            cdata.get("metadata", {}).pop(file_name, None)
            cdata.get("file_scores", {}).pop(file_name, None)
            _update_centroid(cdata)
            break

    # Clean bridge files
    if "bridge_files" in storage:
        storage["bridge_files"].pop(file_name, None)

    storage = _prune_empty_clusters(storage)

    # ── FIRST FILE ──
    cluster_ids = _cluster_keys(storage)
    if not cluster_ids:
        file_texts = {file_name: " ".join(c.get("text", "") for c in chunks_data[:3])[:500]}
        label = generate_cluster_label(file_texts) if not skip_naming else "Refining_Label"
        storage["0"] = {
            "label": label,
            "centroid": file_emb.tolist(),
            "files": {file_name: chunks_data},
            "metadata": {file_name: metadata},
            "file_scores": {file_name: {
                "centroid_similarity": 1.0, "coherence_score": 1.0,
                "confidence": 1.0, "placement_reason": "First file — created initial cluster"
            }},
            "stability_score": 1.0, "internal_cohesion": 1.0,
        }
        save_storage(storage, user_id)
        print(f"CLUSTER: Created cluster 0 for {file_name}")
        return

    # ── FIND BEST & SECOND-BEST CLUSTER ──
    best_sim, best_cid = -1, None
    second_sim, second_cid = -1, None

    for cid in cluster_ids:
        centroid = np.array(storage[cid]["centroid"])
        sim = _cosine_sim(file_emb, centroid)
        print(f"  → Cluster {cid} ({storage[cid].get('label', '?')}): sim={sim:.4f}")

        if sim > best_sim:
            second_sim, second_cid = best_sim, best_cid
            best_sim, best_cid = sim, cid
        elif sim > second_sim:
            second_sim, second_cid = sim, cid

    # ── JOIN OR CREATE ──
    should_join = False
    coherence_val = 0.0

    if best_sim >= thresholds["primary"] and best_cid is not None:
        member_embs = _cluster_member_embeddings(storage[best_cid])
        if not member_embs:
            should_join, coherence_val = True, best_sim
        else:
            pairwise = [_cosine_sim(file_emb, e) for e in member_embs.values()]
            coherence_val = float(np.mean(pairwise))
            max_member_sim = float(max(pairwise))
            print(f"  → Coherence: avg={coherence_val:.4f}, min={min(pairwise):.4f}, max={max_member_sim:.4f}")
            # Join if average coherence passes, OR if very similar to at least one member
            if coherence_val >= thresholds["coherence"] or max_member_sim >= thresholds["primary"] + 0.10:
                should_join = True

    if should_join:
        cid = best_cid
        confidence = round(best_sim * 0.6 + coherence_val * 0.4, 4)
        reason = f"Matched '{storage[cid].get('label', cid)}' — sim {best_sim:.2f}, coherence {coherence_val:.2f}"

        storage[cid]["files"][file_name] = chunks_data
        storage[cid].setdefault("metadata", {})[file_name] = metadata
        storage[cid].setdefault("file_scores", {})[file_name] = {
            "centroid_similarity": round(best_sim, 4),
            "coherence_score": round(coherence_val, 4),
            "confidence": confidence,
            "placement_reason": reason,
        }
        _update_centroid(storage[cid])
        storage[cid]["stability_score"] = round(_compute_stability(storage[cid]), 4)
        storage[cid]["internal_cohesion"] = storage[cid]["stability_score"]

        # Skip renaming on join — only name on cluster creation for speed


        print(f"CLUSTER: {file_name} → cluster {cid} ({storage[cid].get('label', '?')}) [conf={confidence:.2f}]")
    else:
        new_id = str(_next_cluster_id(storage))
        if skip_naming:
            label = "Refining_Label"
        else:
            file_texts = {file_name: " ".join(c.get("text", "") for c in chunks_data[:3])[:500]}
            label = generate_cluster_label(file_texts)

        reason = f"No cluster above threshold ({thresholds['primary']:.2f}) — best was {best_sim:.2f}" if best_cid else "New content type"
        storage[new_id] = {
            "label": label,
            "centroid": file_emb.tolist(),
            "files": {file_name: chunks_data},
            "metadata": {file_name: metadata},
            "file_scores": {file_name: {
                "centroid_similarity": 1.0, "coherence_score": 1.0,
                "confidence": 1.0, "placement_reason": reason,
            }},
            "stability_score": 1.0, "internal_cohesion": 1.0,
        }
        cid = new_id
        print(f"CLUSTER: New cluster {new_id} ({label}) for {file_name}")

    # ── BRIDGE FILE DETECTION ──
    if (best_cid and second_cid
            and second_sim >= thresholds["primary"] * BRIDGE_PROXIMITY_RATIO):
        storage.setdefault("bridge_files", {})[file_name] = {
            "primary_cluster": best_cid,
            "primary_label": storage.get(best_cid, {}).get("label", "?"),
            "primary_sim": round(best_sim, 4),
            "secondary_cluster": second_cid,
            "secondary_label": storage.get(second_cid, {}).get("label", "?"),
            "secondary_sim": round(second_sim, 4),
        }
        print(f"CLUSTER: Bridge file: {file_name} spans '{storage.get(best_cid, {}).get('label')}' ↔ '{storage.get(second_cid, {}).get('label')}'")

    save_storage(storage, user_id, skip_sync=True)  # Skip cloud sync, merge will do final save

    # ── AUTO-MERGE after every add ── keeps clusters consolidated
    _merge_similar_clusters(user_id)


def remove_file(user_id, file_identifier):
    """Remove a file by filename from its cluster."""
    storage = load_storage(user_id)

    for cid in _cluster_keys(storage):
        cdata = storage[cid]
        # Match by exact key or basename
        match = None
        if file_identifier in cdata["files"]:
            match = file_identifier
        else:
            for fpath in cdata["files"]:
                if os.path.basename(fpath) == file_identifier:
                    match = fpath
                    break

        if match:
            cdata["files"].pop(match)
            cdata.get("metadata", {}).pop(match, None)
            cdata.get("file_scores", {}).pop(match, None)
            if cdata["files"]:
                _update_centroid(cdata)
                cdata["stability_score"] = round(_compute_stability(cdata), 4)
            print(f"CLUSTER: Removed {match} from cluster {cid}")
            break

    if "bridge_files" in storage:
        storage["bridge_files"].pop(file_identifier, None)

    storage = _prune_empty_clusters(storage)
    save_storage(storage, user_id)
    return storage


def recluster_all(user_id):
    """
    Full re-clustering from stored embeddings. No disk access needed.
    Deterministic sort by filename for consistent results.
    """
    storage = load_storage(user_id)
    cluster_store = {k: v for k, v in storage.items() if k != "bridge_files"}

    if not cluster_store:
        print("RECLUSTER: No data")
        return

    # Collect all file data from storage
    all_files = {}
    for cid, cdata in cluster_store.items():
        for fname, chunks in cdata["files"].items():
            emb = _file_embedding(chunks)
            meta = cdata.get("metadata", {}).get(fname, {})
            if emb is not None:
                all_files[fname] = {"chunks": chunks, "metadata": meta, "embedding": emb}

    if not all_files:
        print("RECLUSTER: No valid embeddings")
        return

    print(f"RECLUSTER: Re-clustering {len(all_files)} files for user {user_id}")

    # Clear storage completely
    storage.clear()
    save_storage(storage, user_id)

    # Deterministic sort by filename
    for i, fname in enumerate(sorted(all_files.keys(), key=str.lower)):
        fdata = all_files[fname]
        print(f"RECLUSTER: [{i+1}/{len(all_files)}] {fname}")
        add_file(user_id, fname, fdata["chunks"], fdata["metadata"], skip_naming=True)

    # Merge similar clusters
    _merge_similar_clusters(user_id)

    # Single naming pass using stored text (no disk reads)
    storage = load_storage(user_id)
    cids = _cluster_keys(storage)
    print(f"RECLUSTER: Naming {len(cids)} clusters...")
    for cid in cids:
        cdata = storage[cid]
        if cdata["files"]:
            file_texts = _get_file_texts(cdata)
            label = generate_cluster_label(file_texts)
            if label and not label.startswith("Refining"):
                cdata["label"] = label
                print(f"RECLUSTER: Cluster {cid} -> {label}")
            else:
                cdata["label"] = f"Cluster_{cid}"


    # Final stability
    for cid in _cluster_keys(storage):
        storage[cid]["stability_score"] = round(_compute_stability(storage[cid]), 4)
        storage[cid]["internal_cohesion"] = storage[cid]["stability_score"]

    save_storage(storage, user_id)
    final_cids = _cluster_keys(load_storage(user_id))
    print(f"RECLUSTER: Complete. {len(final_cids)} clusters")


def _merge_similar_clusters(user_id):
    """Merge clusters above threshold. Rollback if coherence drops."""
    storage = load_storage(user_id)
    if len(_cluster_keys(storage)) < 2:
        return

    thresholds = _get_thresholds(storage)
    merged = True

    while merged:
        merged = False
        cids = _cluster_keys(storage)

        for i in range(len(cids)):
            if merged:
                break
            for j in range(i + 1, len(cids)):
                a, b = cids[i], cids[j]
                if a not in storage or b not in storage:
                    continue

                sim = _cosine_sim(
                    np.array(storage[a]["centroid"]),
                    np.array(storage[b]["centroid"])
                )

                if sim < thresholds["merge"]:
                    continue

                # Snapshot for rollback
                snap = {k: dict(v) if isinstance(v, dict) else v
                        for k, v in storage[a].items()}

                print(f"CLUSTER: Merging {b} ({storage[b].get('label')}) into {a} ({storage[a].get('label')}), sim={sim:.4f}")

                storage[a]["files"].update(storage[b]["files"])
                storage[a].setdefault("metadata", {}).update(storage[b].get("metadata", {}))
                storage[a].setdefault("file_scores", {}).update(storage[b].get("file_scores", {}))
                _update_centroid(storage[a])

                post_stability = _compute_stability(storage[a])
                if post_stability < thresholds["coherence"]:
                    print(f"CLUSTER: Merge rollback — stability {post_stability:.4f} < {thresholds['coherence']:.4f}")
                    storage[a] = snap
                    continue

                storage[a]["stability_score"] = round(post_stability, 4)
                storage[a]["internal_cohesion"] = round(post_stability, 4)

                # Keep primary cluster's label (skip LLM call for speed)
                # Naming is refreshed during explicit recluster

                del storage[b]
                merged = True
                break

    save_storage(storage, user_id)  # Final save with cloud sync

