from __future__ import annotations

import sqlite3

from app.schemas import Settings


def get_settings(connection: sqlite3.Connection) -> Settings:
    row = connection.execute("SELECT * FROM settings WHERE id = 1").fetchone()
    if row is None:
        raise KeyError("settings")
    return Settings(
        selection_strategy=row["selection_strategy"],
        default_max_calls=row["default_max_calls"],
        default_max_cps=row["default_max_cps"],
        source_identity_rule=row["source_identity_rule"],
        customer_pool_rule=row["customer_pool_rule"],
        sip_whitelist_rule=row["sip_whitelist_rule"],
        notes=row["notes"],
    )


def update_settings(connection: sqlite3.Connection, payload: Settings) -> Settings:
    connection.execute(
        """
        UPDATE settings
        SET selection_strategy = ?,
            default_max_calls = ?,
            default_max_cps = ?,
            source_identity_rule = ?,
            customer_pool_rule = ?,
            sip_whitelist_rule = ?,
            notes = ?
        WHERE id = 1
        """,
        (
            payload.selection_strategy,
            payload.default_max_calls,
            payload.default_max_cps,
            payload.source_identity_rule,
            payload.customer_pool_rule,
            payload.sip_whitelist_rule,
            payload.notes,
        ),
    )
    connection.commit()
    return get_settings(connection)
