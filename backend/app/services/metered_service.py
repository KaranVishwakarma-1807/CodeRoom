import httpx
from fastapi import HTTPException, status

from app.core.config import settings


def _metered_base_url() -> str:
    if not settings.metered_domain or not settings.metered_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Metered integration is not configured",
        )
    return f"https://{settings.metered_domain}/api/v1"


async def ensure_metered_room(room_name: str) -> None:
    base_url = _metered_base_url()
    payload = {
        "roomName": room_name,
        "privacy": "private",
        "autoJoin": True,
        "enableRequestToJoin": False,
        "enableChat": True,
        "enableScreenSharing": True,
        "joinVideoOn": True,
        "joinAudioOn": True,
        "recordRoom": False,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            f"{base_url}/room",
            params={"secretKey": settings.metered_secret_key},
            json=payload,
            headers={"Accept": "application/json", "Content-Type": "application/json"},
        )
        # Metered returns error if room already exists; we can proceed.
        if response.status_code in (200, 201):
            return
        if response.status_code in (400, 409):
            return
        raise HTTPException(status_code=502, detail="Failed to create Metered room")


async def generate_metered_token(room_name: str, user_name: str, is_admin: bool) -> str:
    base_url = _metered_base_url()
    payload = {"roomName": room_name, "name": user_name, "isAdmin": is_admin}
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            f"{base_url}/token",
            params={"secretKey": settings.metered_secret_key},
            json=payload,
            headers={"Accept": "application/json", "Content-Type": "application/json"},
        )
        if response.status_code >= 400:
            raise HTTPException(status_code=502, detail="Failed to generate Metered token")
        data = response.json()
        token = data.get("token")
        if not token:
            raise HTTPException(status_code=502, detail="Metered token missing in response")
        return token
