"""
Re-cluster all files for a user from stored embeddings.
No disk access needed — works entirely from storage JSON.

Usage:
    python3 recluster.py --user-id <USER_ID>
    python3 recluster.py --all
"""

import os
import argparse

from storage import load_storage
from cluster_engine import recluster_all


def recluster_user(user_id):
    """Re-cluster all files for a single user from stored embeddings."""
    storage = load_storage(user_id)
    if not storage or all(k == "bridge_files" for k in storage.keys()):
        print(f"No data for user: {user_id}")
        return

    file_count = sum(len(c.get("files", {})) for k, c in storage.items() if k != "bridge_files")
    print(f"\n{'='*60}")
    print(f"Re-clustering user: {user_id} ({file_count} files)")
    print(f"{'='*60}")

    recluster_all(user_id)

    # Show results
    storage = load_storage(user_id)
    cluster_keys = [k for k in storage.keys() if k != "bridge_files"]
    print(f"\nResults: {len(cluster_keys)} clusters")
    for cid in cluster_keys:
        cdata = storage[cid]
        fnames = list(cdata["files"].keys())
        stability = cdata.get("stability_score", 0.0)
        print(f"  Cluster {cid}: {cdata.get('label', '?')} (stability: {stability:.2f}) -> {fnames}")


def main():
    parser = argparse.ArgumentParser(description="Re-cluster files for FileMind users")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--user-id", type=str, help="Specific user ID to re-cluster")
    group.add_argument("--all", action="store_true", help="Re-cluster all users")
    args = parser.parse_args()

    if args.user_id:
        recluster_user(args.user_id)
    elif args.all:
        # Find all user storage files
        for f in os.listdir("."):
            if f.startswith("embeddings_") and f.endswith(".json") and not f.endswith(".bak"):
                user_id = f.replace("embeddings_", "").replace(".json", "")
                if user_id:
                    recluster_user(user_id)

    print("\nDone!")


if __name__ == "__main__":
    main()
