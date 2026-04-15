import sqlite3

from fastapi import APIRouter, Depends

from app.dependencies import get_db
from app.repository import dashboard_summary
from app.schemas import DashboardSummary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def read_dashboard_summary(connection: sqlite3.Connection = Depends(get_db)) -> DashboardSummary:
    return dashboard_summary(connection)
