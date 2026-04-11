from pydantic import BaseModel


class CodeExecuteRequest(BaseModel):
    language: str
    code: str
    stdin: str | None = ""


class CodeExecuteResponse(BaseModel):
    output: str
    error: str | None = None
