from fastapi import APIRouter

from app.schemas import SessionResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/session", response_model=SessionResponse)
def read_session() -> SessionResponse:
    return SessionResponse(authenticated=True, user="ops.user", role="admin")
