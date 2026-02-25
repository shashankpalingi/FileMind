import json
import os
import threading
from supabase_client import supabase_admin, STORAGE_BUCKET

# Per-user locks to prevent concurrent writes to the same storage file
_user_locks = {}
_lock_guard = threading.Lock()


def _get_lock(user_id):
    """Get or create a threading lock for a specific user."""
    with _lock_guard:
        if user_id not in _user_locks:
            _user_locks[user_id] = threading.Lock()
        return _user_locks[user_id]


def get_user_storage_path(user_id):
    return f"embeddings_{user_id}.json"


def load_storage(user_id):
    lock = _get_lock(user_id)
    with lock:
        storage_file = get_user_storage_path(user_id)
        
        # 1. If not found locally, try to pull from Supabase (Persistent Cloud)
        if not os.path.exists(storage_file):
            print(f"STORAGE: {storage_file} not found locally. Pulling from Supabase...")
            try:
                remote_path = f"{user_id}/.system/metadata.json"
                response = supabase_admin.storage.from_(STORAGE_BUCKET).download(remote_path)
                if response:
                    with open(storage_file, "wb") as f:
                        f.write(response)
                    print(f"STORAGE: Successfully restored {storage_file} from Supabase.")
            except Exception as e:
                # 404 is normal if it's a brand new user
                if "404" not in str(e) and "not_found" not in str(e).lower():
                    print(f"STORAGE: Sync-pull error: {e}")

        # 2. Standard local load
        if not os.path.exists(storage_file):
            return {}
        try:
            with open(storage_file, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"STORAGE: Error reading {storage_file}: {e}")
            bak = storage_file + ".bak"
            if os.path.exists(bak):
                print(f"STORAGE: Recovering from backup {bak}")
                with open(bak, "r") as f:
                    return json.load(f)
            return {}


def save_storage(data, user_id):
    lock = _get_lock(user_id)
    with lock:
        storage_file = get_user_storage_path(user_id)
        # Backup existing file before overwrite
        if os.path.exists(storage_file):
            bak = storage_file + ".bak"
            try:
                os.replace(storage_file, bak)
            except OSError:
                pass
        # Atomic write: write to temp, then rename
        tmp_file = storage_file + ".tmp"
        try:
            with open(tmp_file, "w") as f:
                json.dump(data, f, indent=2)
            os.replace(tmp_file, storage_file)
            
            # 3. Push to Supabase (Cloud Sync)
            # Use a hidden folder '.system' to avoid cluttering their main view
            try:
                remote_path = f"{user_id}/.system/metadata.json"
                supabase_admin.storage.from_(STORAGE_BUCKET).upload(
                    path=remote_path,
                    file=storage_file,
                    file_options={"upsert": "true"}
                )
                print(f"STORAGE: Synced {storage_file} to cloud state.")
            except Exception as e:
                print(f"STORAGE: Sync-push error: {e}")

        except Exception as e:
            print(f"STORAGE: Write error for {storage_file}: {e}")
            # Restore from backup if write failed
            bak = storage_file + ".bak"
            if os.path.exists(bak) and not os.path.exists(storage_file):
                os.replace(bak, storage_file)
