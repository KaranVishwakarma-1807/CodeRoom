import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.code import CodeExecuteRequest, CodeExecuteResponse


LANGUAGE_ALIASES = {
    "python": "python",
    "javascript": "javascript",
    "java": "java",
    "cpp": "c++",
    "c++": "c++",
}


async def execute_code(payload: CodeExecuteRequest) -> CodeExecuteResponse:
    if not settings.piston_api_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Execution service is not configured",
        )

    piston_language = LANGUAGE_ALIASES.get(payload.language.lower())
    if not piston_language:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported language")

    request_payload = {
        "language": piston_language,
        "version": "*",
        "files": [{"content": payload.code}],
        "stdin": payload.stdin or "",
    }
    headers = {"Content-Type": "application/json"}
    if settings.piston_api_key:
        headers["Authorization"] = f"Bearer {settings.piston_api_key}"

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(settings.piston_api_url, json=request_payload, headers=headers)
        if response.status_code >= 400:
            raise HTTPException(status_code=502, detail="Execution provider failed")
        result = response.json().get("run", {})
        return CodeExecuteResponse(output=result.get("stdout", ""), error=result.get("stderr"))
