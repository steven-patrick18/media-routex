import sqlite3

from fastapi import APIRouter, Depends

from app.dependencies import get_db
from app.schemas import Settings
from app.services.settings import get_settings, update_settings

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=Settings)
def read_settings(connection: sqlite3.Connection = Depends(get_db)) -> Settings:
    return get_settings(connection)


@router.put("", response_model=Settings)
def update_settings_record(payload: Settings, connection: sqlite3.Connection = Depends(get_db)) -> Settings:
    return update_settings(connection, payload)
