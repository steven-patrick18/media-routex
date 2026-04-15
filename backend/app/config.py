from __future__ import annotations

import os
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
LOCAL_DATA_DIR = BACKEND_ROOT / ".local"
DEFAULT_DB_PATH = LOCAL_DATA_DIR / "mediaroutex.db"
DB_PATH = Path(os.getenv("MEDIAROUTEX_DB_PATH", DEFAULT_DB_PATH))
