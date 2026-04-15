from __future__ import annotations

import sqlite3

from app.schemas import Vendor, VendorBase


def list_vendors(connection: sqlite3.Connection) -> list[Vendor]:
    rows = connection.execute("SELECT * FROM vendors ORDER BY id DESC").fetchall()
    items: list[Vendor] = []
    for row in rows:
        media_pool_ids = [
            link["media_pool_id"]
            for link in connection.execute(
                "SELECT media_pool_id FROM vendor_media_pools WHERE vendor_id = ? ORDER BY media_pool_id",
                (row["id"],),
            ).fetchall()
        ]
        items.append(
            Vendor(
                id=row["id"],
                name=row["name"],
                sip_host=row["sip_host"],
                sip_port=row["sip_port"],
                status=row["status"],
                notes=row["notes"],
                allowed_sip_node_ids=[
                    link["node_id"]
                    for link in connection.execute(
                        "SELECT node_id FROM vendor_allowed_sip_nodes WHERE vendor_id = ? ORDER BY node_id",
                        (row["id"],),
                    ).fetchall()
                ],
                media_selection_strategy=row["media_selection_strategy"],
                media_pool_ids=media_pool_ids,
            )
        )
    return items


def get_vendor(connection: sqlite3.Connection, vendor_id: int) -> Vendor:
    row = connection.execute("SELECT * FROM vendors WHERE id = ?", (vendor_id,)).fetchone()
    if row is None:
        raise KeyError(vendor_id)
    media_pool_ids = [
        link["media_pool_id"]
        for link in connection.execute(
            "SELECT media_pool_id FROM vendor_media_pools WHERE vendor_id = ? ORDER BY media_pool_id",
            (vendor_id,),
        ).fetchall()
    ]
    return Vendor(
        id=row["id"],
        name=row["name"],
        sip_host=row["sip_host"],
        sip_port=row["sip_port"],
        status=row["status"],
        notes=row["notes"],
        allowed_sip_node_ids=[
            link["node_id"]
            for link in connection.execute(
                "SELECT node_id FROM vendor_allowed_sip_nodes WHERE vendor_id = ? ORDER BY node_id",
                (vendor_id,),
            ).fetchall()
        ],
        media_selection_strategy=row["media_selection_strategy"],
        media_pool_ids=media_pool_ids,
    )


def create_vendor(connection: sqlite3.Connection, payload: VendorBase) -> Vendor:
    cursor = connection.execute(
        """
        INSERT INTO vendors (name, sip_host, sip_port, status, notes, media_selection_strategy)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (payload.name, payload.sip_host, payload.sip_port, payload.status, payload.notes, payload.media_selection_strategy),
    )
    vendor_id = cursor.lastrowid
    connection.executemany(
        "INSERT INTO vendor_media_pools (vendor_id, media_pool_id) VALUES (?, ?)",
        [(vendor_id, pool_id) for pool_id in payload.media_pool_ids],
    )
    connection.executemany(
        "INSERT INTO vendor_allowed_sip_nodes (vendor_id, node_id) VALUES (?, ?)",
        [(vendor_id, node_id) for node_id in payload.allowed_sip_node_ids],
    )
    connection.commit()
    return get_vendor(connection, vendor_id)


def update_vendor(connection: sqlite3.Connection, vendor_id: int, payload: VendorBase) -> Vendor:
    connection.execute(
        """
        UPDATE vendors
        SET name = ?, sip_host = ?, sip_port = ?, status = ?, notes = ?, media_selection_strategy = ?
        WHERE id = ?
        """,
        (payload.name, payload.sip_host, payload.sip_port, payload.status, payload.notes, payload.media_selection_strategy, vendor_id),
    )
    connection.execute("DELETE FROM vendor_media_pools WHERE vendor_id = ?", (vendor_id,))
    connection.execute("DELETE FROM vendor_allowed_sip_nodes WHERE vendor_id = ?", (vendor_id,))
    connection.executemany(
        "INSERT INTO vendor_media_pools (vendor_id, media_pool_id) VALUES (?, ?)",
        [(vendor_id, pool_id) for pool_id in payload.media_pool_ids],
    )
    connection.executemany(
        "INSERT INTO vendor_allowed_sip_nodes (vendor_id, node_id) VALUES (?, ?)",
        [(vendor_id, node_id) for node_id in payload.allowed_sip_node_ids],
    )
    connection.commit()
    return get_vendor(connection, vendor_id)


def delete_vendor(connection: sqlite3.Connection, vendor_id: int) -> None:
    connection.execute("DELETE FROM vendors WHERE id = ?", (vendor_id,))
    connection.commit()
