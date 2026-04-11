from fastapi import APIRouter

from app.schemas.code import CodeExecuteRequest, CodeExecuteResponse
from app.services.execution_service import execute_code


router = APIRouter(tags=["execution"])


@router.post("/execute", response_model=CodeExecuteResponse)
async def execute(payload: CodeExecuteRequest):
    return await execute_code(payload)
