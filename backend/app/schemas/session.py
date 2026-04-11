from datetime import datetime

from pydantic import BaseModel, Field


class InterviewFeedbackCreate(BaseModel):
    candidate_id: int | None = None
    summary: str = ""
    strengths: str = ""
    improvements: str = ""
    recommendation: str = "hold"
    communication_score: int = Field(ge=0, le=10)
    problem_solving_score: int = Field(ge=0, le=10)
    coding_score: int = Field(ge=0, le=10)


class InterviewFeedbackRead(BaseModel):
    id: int
    session_id: int
    interviewer_id: int
    candidate_id: int | None
    summary: str
    strengths: str
    improvements: str
    recommendation: str
    communication_score: int
    problem_solving_score: int
    coding_score: int
    overall_score: int
    created_at: datetime


class SessionHistoryRead(BaseModel):
    id: int
    language: str
    status: str
    started_at: datetime
    ended_at: datetime | None
    chat_count: int
    latest_code_language: str | None
    latest_code_saved_at: datetime | None
    overall_score: int | None
