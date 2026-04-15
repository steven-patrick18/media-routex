import sqlite3

from fastapi import APIRouter, Depends

from app.dependencies import get_db
from app.repository import usage_snapshot
from app.schemas import UsageSnapshot

router = APIRouter(prefix="/api/usage", tags=["usage"])


@router.get("", response_model=UsageSnapshot)
def read_usage(connection: sqlite3.Connection = Depends(get_db)) -> UsageSnapshot:
    return usage_snapshot(connection)
