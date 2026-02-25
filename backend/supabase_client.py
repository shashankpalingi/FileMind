import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")           # anon key (for auth flows)
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # service-role key (for admin ops)

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

# Public client – used for auth (sign-up, sign-in, token verify)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Service client – used for storage operations (bypasses RLS)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY) if SUPABASE_SERVICE_KEY else supabase

STORAGE_BUCKET = "filemind-files"
