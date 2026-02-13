from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class SessionStart(BaseModel):
    fingerprint: str


class SessionStatus(BaseModel):
    session_id: UUID
    current_stage: int
    started_at: datetime
    expires_at: datetime
    completed: bool
    expired: bool
    challenge_status: str
    trolling_phase: str


class PuzzleCheck(BaseModel):
    session_id: UUID
    stage: int
    answer: str


class PuzzleResult(BaseModel):
    correct: bool
    message: str
    next_stage: int | None = None


class PuzzleData(BaseModel):
    stage: int
    title: str
    description: str
    type: str
    photo_urls: list[str] = []
    options: list[str] = []
    audio_url: str | None = None
    complex_data: dict | None = None


class ChallengeStatus(BaseModel):
    status: str


class AdminAttempt(BaseModel):
    stage: int
    answer: str
    correct: bool
    created_at: datetime


class AdminSessionInfo(BaseModel):
    session_id: UUID
    fingerprint: str
    ip_address: str | None
    current_stage: int
    challenge_status: str
    started_at: datetime
    completed: bool


class AdminSessionDetail(BaseModel):
    session_id: UUID
    fingerprint: str
    ip_address: str | None
    current_stage: int
    challenge_status: str
    started_at: datetime
    expires_at: datetime
    completed: bool
    attempts: list[AdminAttempt]
    total_correct: int
    total_wrong: int
