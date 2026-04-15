from collections.abc import Generator

from app.db import get_connection


def get_db() -> Generator:
    connection = get_connection()
    try:
        yield connection
    finally:
        connection.close()
