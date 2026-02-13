"""Business logic — session management, puzzle checking, progress tracking."""

import json
import random
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import AttemptLog, Session
from app.puzzles import PUZZLES, TOTAL_STAGES
from app.s3 import generate_presigned_url
from app.schemas import (
    AdminAttempt,
    AdminSessionDetail,
    AdminSessionInfo,
    ChallengeStatus,
    PuzzleData,
    PuzzleResult,
    SessionStatus,
)


async def start_session(db: AsyncSession, fingerprint: str, ip_address: str | None = None) -> SessionStatus:
    """Create or restore a session by fingerprint."""
    result = await db.execute(select(Session).where(Session.fingerprint == fingerprint))
    session = result.scalar_one_or_none()

    if session is None:
        now = datetime.now(timezone.utc)
        session = Session(
            fingerprint=fingerprint,
            current_stage=0,
            started_at=now,
            expires_at=now + timedelta(hours=settings.session_duration_hours),
            ip_address=ip_address,
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
    elif ip_address and not session.ip_address:
        session.ip_address = ip_address
        await db.commit()

    return _session_to_status(session)


async def get_session_status(db: AsyncSession, session_id: UUID) -> SessionStatus | None:
    session = await db.get(Session, session_id)
    if session is None:
        return None
    return _session_to_status(session)


async def get_puzzle_data(db: AsyncSession, session_id: UUID, stage: int) -> PuzzleData | None:
    puzzle = PUZZLES.get(stage)
    if puzzle is None:
        return None

    ptype = puzzle["type"]

    # For color_trick and choose_person, just return title/description and type
    if ptype in ("color_trick", "choose_person"):
        return PuzzleData(
            stage=stage,
            title=puzzle["title"],
            description=puzzle["description"],
            type=ptype,
        )

    # For audio type, generate presigned URL for the audio file
    if ptype == "audio":
        audio_url = generate_presigned_url(puzzle["photo_keys"][0]) if puzzle.get("photo_keys") else None
        return PuzzleData(
            stage=stage,
            title=puzzle["title"],
            description=puzzle["description"],
            type=ptype,
            audio_url=audio_url,
        )

    # For complex_captcha, build complex_data with presigned URLs
    if ptype == "complex_captcha":
        part_a_questions = []
        for q in puzzle.get("part_a", {}).get("questions", []):
            options = []
            for opt in q["options"]:
                options.append({
                    "label": opt["label"],
                    "photo_url": generate_presigned_url(opt["photo_key"]),
                })
            part_a_questions.append({
                "text": q["text"],
                "options": options,
            })

        part_b_rounds = []
        for r in puzzle.get("part_b", {}).get("rounds", []):
            grid_urls = [generate_presigned_url(k) for k in r["grid_keys"]]
            part_b_rounds.append({
                "instruction": r["instruction"],
                "grid_urls": grid_urls,
            })

        return PuzzleData(
            stage=stage,
            title=puzzle["title"],
            description=puzzle["description"],
            type=ptype,
            complex_data={
                "part_a": {"questions": part_a_questions},
                "part_b": {"rounds": part_b_rounds},
            },
        )

    photo_urls = [generate_presigned_url(key) for key in puzzle.get("photo_keys", [])]

    data = PuzzleData(
        stage=stage,
        title=puzzle["title"],
        description=puzzle["description"],
        type=ptype,
        photo_urls=photo_urls,
    )

    if ptype == "captcha" and "questions" in puzzle:
        data.options = [q["text"] for q in puzzle["questions"]]

    return data


async def check_answer(db: AsyncSession, session_id: UUID, stage: int, answer: str) -> PuzzleResult:
    session = await db.get(Session, session_id)
    if session is None:
        return PuzzleResult(correct=False, message="Сессия не найдена")

    puzzle = PUZZLES.get(stage)
    if puzzle is None:
        return PuzzleResult(correct=False, message="Этап не найден")

    normalized = answer.strip().lower()
    correct = False
    custom_wrong_msg = None

    if puzzle["type"] == "color_trick":
        # Always "correct" for logging — frontend handles the trick flow visually
        correct = True
    elif puzzle["type"] == "choose_person":
        # Always correct — any choice advances
        correct = True
    elif puzzle["type"] == "captcha":
        # For captcha, answer is comma-separated indices like "1,0,3"
        try:
            indices = [int(x.strip()) for x in answer.split(",")]
            expected = [q["answer_index"] for q in puzzle["questions"]]
            correct = indices == expected
        except (ValueError, IndexError):
            correct = False
    elif puzzle["type"] == "complex_captcha":
        # Answer is JSON: {"part_a": [0, 1, 2], "part_b": [[0,3,6], [1,4,7], ...]}
        try:
            data = json.loads(answer)
            part_a_answers = data.get("part_a", [])
            part_b_answers = data.get("part_b", [])

            # Validate part_a
            part_a_correct = True
            questions = puzzle.get("part_a", {}).get("questions", [])
            for i, q in enumerate(questions):
                if i >= len(part_a_answers) or part_a_answers[i] != q["correct_index"]:
                    part_a_correct = False
                    # Get custom wrong message for the chosen option
                    if i < len(part_a_answers):
                        wrong_msgs = q.get("wrong_messages", {})
                        custom_wrong_msg = wrong_msgs.get(str(part_a_answers[i]))
                    break

            # Validate part_b
            part_b_correct = True
            rounds = puzzle.get("part_b", {}).get("rounds", [])
            for i, r in enumerate(rounds):
                if i >= len(part_b_answers):
                    part_b_correct = False
                    break
                if sorted(part_b_answers[i]) != sorted(r["correct_indices"]):
                    part_b_correct = False
                    break

            correct = part_a_correct and part_b_correct
        except (json.JSONDecodeError, KeyError, TypeError):
            correct = False
    else:
        expected = puzzle["answer"].strip().lower()
        aliases = [a.strip().lower() for a in puzzle.get("answer_aliases", [])]
        correct = normalized == expected or normalized in aliases

    # Log attempt
    log = AttemptLog(
        session_id=session_id,
        stage=stage,
        answer=answer,
        correct=correct,
    )
    db.add(log)

    if correct:
        next_stage = stage + 1
        session.current_stage = next_stage
        await db.commit()
        return PuzzleResult(
            correct=True,
            message=puzzle["correct_message"],
            next_stage=next_stage,
        )

    await db.commit()
    if custom_wrong_msg:
        return PuzzleResult(correct=False, message=custom_wrong_msg)
    messages = puzzle.get("wrong_messages", ["Неправильно!"])
    return PuzzleResult(correct=False, message=random.choice(messages))


async def advance_stage(db: AsyncSession, session_id: UUID, stage: int) -> bool:
    """Advance session to a specific stage (for non-puzzle screens like trolling)."""
    session = await db.get(Session, session_id)
    if session is None:
        return False
    session.current_stage = stage
    # Mark completed only after passing the trolling stage (stage 11 → stage 12)
    if stage > TOTAL_STAGES + 1:
        session.completed = True
    await db.commit()
    return True


async def challenge_submit(db: AsyncSession, session_id: UUID) -> ChallengeStatus:
    """User claims they did pushups — set to pending."""
    session = await db.get(Session, session_id)
    if session is None:
        return ChallengeStatus(status="error")
    session.challenge_status = "pending"
    await db.commit()
    return ChallengeStatus(status="pending")


async def challenge_status(db: AsyncSession, session_id: UUID) -> ChallengeStatus:
    """Poll challenge status."""
    session = await db.get(Session, session_id)
    if session is None:
        return ChallengeStatus(status="error")
    return ChallengeStatus(status=session.challenge_status)


async def admin_approve(db: AsyncSession, session_id: UUID) -> ChallengeStatus:
    """Admin approves the challenge."""
    session = await db.get(Session, session_id)
    if session is None:
        return ChallengeStatus(status="error")
    session.challenge_status = "approved"
    await db.commit()
    return ChallengeStatus(status="approved")


async def get_all_sessions(db: AsyncSession) -> list[AdminSessionInfo]:
    """Get all sessions for admin dashboard."""
    result = await db.execute(select(Session).order_by(Session.started_at.desc()))
    sessions = result.scalars().all()
    return [
        AdminSessionInfo(
            session_id=s.id,
            fingerprint=s.fingerprint,
            ip_address=s.ip_address,
            current_stage=s.current_stage,
            challenge_status=s.challenge_status,
            started_at=s.started_at,
            completed=s.completed,
        )
        for s in sessions
    ]


async def get_session_detail(db: AsyncSession, session_id: UUID) -> AdminSessionDetail | None:
    """Get full session detail with attempts."""
    session = await db.get(Session, session_id)
    if session is None:
        return None

    result = await db.execute(
        select(AttemptLog)
        .where(AttemptLog.session_id == session_id)
        .order_by(AttemptLog.created_at)
    )
    attempts = result.scalars().all()

    attempt_list = [
        AdminAttempt(
            stage=a.stage,
            answer=a.answer,
            correct=a.correct,
            created_at=a.created_at,
        )
        for a in attempts
    ]
    total_correct = sum(1 for a in attempts if a.correct)
    total_wrong = sum(1 for a in attempts if not a.correct)

    return AdminSessionDetail(
        session_id=session.id,
        fingerprint=session.fingerprint,
        ip_address=session.ip_address,
        current_stage=session.current_stage,
        challenge_status=session.challenge_status,
        started_at=session.started_at,
        expires_at=session.expires_at,
        completed=session.completed,
        attempts=attempt_list,
        total_correct=total_correct,
        total_wrong=total_wrong,
    )


async def save_trolling_phase(db: AsyncSession, session_id: UUID, phase: str) -> bool:
    """Save trolling sub-phase to DB for persistence across refreshes."""
    session = await db.get(Session, session_id)
    if session is None:
        return False
    session.trolling_phase = phase
    await db.commit()
    return True


def _session_to_status(session: Session) -> SessionStatus:
    now = datetime.now(timezone.utc)
    return SessionStatus(
        session_id=session.id,
        current_stage=session.current_stage,
        started_at=session.started_at,
        expires_at=session.expires_at,
        completed=session.completed,
        expired=now > session.expires_at and not session.completed,
        challenge_status=session.challenge_status,
        trolling_phase=session.trolling_phase,
    )
