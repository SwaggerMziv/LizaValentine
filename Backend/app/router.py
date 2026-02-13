"""API endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.puzzles import PUZZLES
from app.s3 import generate_presigned_url
from app.schemas import PuzzleCheck, SessionStart
from app.service import (
    advance_stage,
    admin_approve,
    challenge_status,
    challenge_submit,
    check_answer,
    get_all_sessions,
    get_puzzle_data,
    get_session_detail,
    get_session_status,
    save_trolling_phase,
    start_session,
)

router = APIRouter(prefix="/api")


@router.post("/session/start")
async def session_start(body: SessionStart, request: Request, db: AsyncSession = Depends(get_db)):
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (
        request.client.host if request.client else None
    )
    return await start_session(db, body.fingerprint, ip_address=ip)


@router.get("/session/status")
async def session_status(session_id: UUID, db: AsyncSession = Depends(get_db)):
    status = await get_session_status(db, session_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return status


@router.get("/puzzle/{stage}")
async def puzzle_data(stage: int, session_id: UUID, db: AsyncSession = Depends(get_db)):
    data = await get_puzzle_data(db, session_id, stage)
    if data is None:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    return data


@router.post("/puzzle/check")
async def puzzle_check(body: PuzzleCheck, db: AsyncSession = Depends(get_db)):
    return await check_answer(db, body.session_id, body.stage, body.answer)


@router.post("/puzzle/advance")
async def puzzle_advance(session_id: UUID, stage: int, db: AsyncSession = Depends(get_db)):
    ok = await advance_stage(db, session_id, stage)
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"ok": True}


@router.get("/photos/{key:path}")
async def photo_url(key: str):
    try:
        url = generate_presigned_url(key)
        return {"url": url}
    except Exception:
        raise HTTPException(status_code=404, detail="Photo not found")


@router.get("/puzzle/{stage}/captcha")
async def captcha_data(stage: int):
    puzzle = PUZZLES.get(stage)
    if puzzle is None:
        raise HTTPException(status_code=404, detail="Captcha not found")

    if puzzle["type"] == "captcha":
        questions = []
        for i, q in enumerate(puzzle["questions"]):
            photo_url = generate_presigned_url(puzzle["photo_keys"][i]) if i < len(puzzle.get("photo_keys", [])) else None
            questions.append({
                "text": q["text"],
                "options": q["options"],
                "photo_url": photo_url,
            })
        return {"questions": questions}

    if puzzle["type"] == "complex_captcha":
        # Return part_a and part_b with presigned URLs
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

        return {
            "part_a": {"questions": part_a_questions},
            "part_b": {"rounds": part_b_rounds},
        }

    raise HTTPException(status_code=404, detail="Captcha not found")


# --- Trolling phase persistence ---


@router.post("/trolling/phase")
async def trolling_phase(session_id: UUID, phase: str, db: AsyncSession = Depends(get_db)):
    ok = await save_trolling_phase(db, session_id, phase)
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"ok": True}


# --- Challenge endpoints ---


@router.post("/challenge/submit")
async def challenge_submit_endpoint(session_id: UUID, db: AsyncSession = Depends(get_db)):
    return await challenge_submit(db, session_id)


@router.get("/challenge/status")
async def challenge_status_endpoint(session_id: UUID, db: AsyncSession = Depends(get_db)):
    return await challenge_status(db, session_id)


# --- Admin endpoints ---


def _get_admin_password(x_admin_password: str = Header()) -> str:
    if x_admin_password != settings.admin_password:
        raise HTTPException(status_code=403, detail="Wrong password")
    return x_admin_password


@router.post("/admin/login")
async def admin_login(password: str = Depends(_get_admin_password)):
    return {"ok": True}


@router.get("/admin/sessions")
async def admin_sessions(password: str = Depends(_get_admin_password), db: AsyncSession = Depends(get_db)):
    return await get_all_sessions(db)


@router.get("/admin/session/{session_id}")
async def admin_session_detail(session_id: UUID, password: str = Depends(_get_admin_password), db: AsyncSession = Depends(get_db)):
    detail = await get_session_detail(db, session_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return detail


@router.post("/admin/approve/{session_id}")
async def admin_approve_endpoint(session_id: UUID, password: str = Depends(_get_admin_password), db: AsyncSession = Depends(get_db)):
    return await admin_approve(db, session_id)
