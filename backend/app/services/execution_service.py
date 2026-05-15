import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.code import CodeExecuteRequest, CodeExecuteResponse


# Judge0 Language IDs
LANGUAGE_ALIASES = {
    "python": 71,
    "javascript": 63,
    "java": 62,
    "cpp": 54,
    "c++": 54,
}


async def execute_code(payload: CodeExecuteRequest) -> CodeExecuteResponse:
    if not settings.judge0_api_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Execution service is not configured",
        )

    language_id = LANGUAGE_ALIASES.get(payload.language.lower())
    if not language_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported language")

    request_payload = {
        "source_code": payload.code,
        "language_id": language_id,
        "stdin": payload.stdin or "",
    }
    
    headers = {"Content-Type": "application/json"}
    if settings.judge0_api_key:
        # Default header for open source Judge0
        headers["X-Auth-Token"] = settings.judge0_api_key
        # If user is using RapidAPI, they might need X-RapidAPI-Key instead.
        headers["X-RapidAPI-Key"] = settings.judge0_api_key

    url = settings.judge0_api_url.rstrip('/')
    if not url.endswith('/submissions'):
        url = f"{url}/submissions"
    url = f"{url}?base64_encoded=false&wait=true"

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            response = await client.post(url, json=request_payload, headers=headers)
        except httpx.RequestError:
            raise HTTPException(status_code=502, detail="Unable to connect to execution provider")
            
        if response.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Execution provider failed: {response.text}")
            
        result = response.json()
        
        # Judge0 returns stdout, stderr, and compile_output
        output = result.get("stdout") or ""
        error = result.get("stderr") or result.get("compile_output") or ""
        
        return CodeExecuteResponse(output=output, error=error)
