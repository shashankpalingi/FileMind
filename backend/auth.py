from fastapi import Request, HTTPException, Depends
from supabase_client import supabase


async def get_current_user(request: Request) -> str:
    """
    FastAPI dependency that extracts and verifies the Supabase JWT
    from the Authorization header. Returns the user ID.
    """
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header.split("Bearer ")[1]

    try:
        # Verify the token with Supabase
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        return user_response.user.id

    except HTTPException:
        raise
    except Exception as e:
        print(f"AUTH ERROR: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
