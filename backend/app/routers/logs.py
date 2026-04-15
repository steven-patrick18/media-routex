import sqlite3

from fastapi import APIRouter, Depends

from app.dependencies import get_db
from app.repository import list_logs
from app.schemas import LogEntry

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("", response_model=list[LogEntry])
def read_logs(connection: sqlite3.Connection = Depends(get_db)) -> list[LogEntry]:
    return list_logs(connection)
