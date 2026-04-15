import sqlite3

from fastapi import APIRouter, Depends

from app.dependencies import get_db
from app.schemas import UsageSnapshot
from app.services.usage import usage_snapshot

router = APIRouter(prefix="/api/usage", tags=["usage"])


@router.get("", response_model=UsageSnapshot)
def read_usage(connection: sqlite3.Connection = Depends(get_db)) -> UsageSnapshot:
    return usage_snapshot(connection)
