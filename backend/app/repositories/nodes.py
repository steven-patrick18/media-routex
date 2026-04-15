from __future__ import annotations

import sqlite3

from app.repository import create_node, delete_node, get_node, list_nodes, update_node
from app.schemas import Node, NodeIpBase


def insert_or_update_node_ips(connection: sqlite3.Connection, node_id: int, discovered_ips: list[tuple[str, str]]) -> Node:
    existing_rows = connection.execute(
        "SELECT id, ip_address FROM node_ips WHERE node_id = ?",
        (node_id,),
    ).fetchall()
    existing_by_ip = {row["ip_address"]: row["id"] for row in existing_rows}

    for interface_name, ip_address in discovered_ips:
        if ip_address in existing_by_ip:
            connection.execute(
                "UPDATE node_ips SET interface_name = ? WHERE id = ?",
                (interface_name, existing_by_ip[ip_address]),
            )
        else:
            connection.execute(
                """
                INSERT INTO node_ips (node_id, ip_address, interface_name, ip_role, status, active_calls, max_concurrent_calls, current_cps, max_cps, weight, drain_mode)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (node_id, ip_address, interface_name, "pool", "active", 0, 30, 0, 5, 1, 0),
            )

    connection.commit()
    return get_node(connection, node_id)


def assign_node_ip_role(connection: sqlite3.Connection, node_id: int, node_ip_id: int, role: str) -> Node:
    if role == "sip":
        connection.execute("UPDATE node_ips SET ip_role = 'pool' WHERE node_id = ? AND ip_role = 'sip'", (node_id,))
        connection.execute("UPDATE node_ips SET ip_role = 'sip' WHERE id = ? AND node_id = ?", (node_ip_id, node_id))
        connection.execute("UPDATE nodes SET sip_ip_id = ? WHERE id = ?", (node_ip_id, node_id))
    elif role == "media":
        connection.execute("UPDATE node_ips SET ip_role = 'media' WHERE id = ? AND node_id = ?", (node_ip_id, node_id))
        sip_row = connection.execute("SELECT sip_ip_id FROM nodes WHERE id = ?", (node_id,)).fetchone()
        if sip_row and sip_row["sip_ip_id"] == node_ip_id:
            connection.execute("UPDATE nodes SET sip_ip_id = NULL WHERE id = ?", (node_id,))
    elif role == "unassign":
        connection.execute("UPDATE node_ips SET ip_role = 'pool' WHERE id = ? AND node_id = ?", (node_ip_id, node_id))
        sip_row = connection.execute("SELECT sip_ip_id FROM nodes WHERE id = ?", (node_id,)).fetchone()
        if sip_row and sip_row["sip_ip_id"] == node_ip_id:
            connection.execute("UPDATE nodes SET sip_ip_id = NULL WHERE id = ?", (node_id,))
    else:
        raise ValueError(f"Unsupported role assignment: {role}")

    connection.commit()
    return get_node(connection, node_id)


def bulk_assign_media_ips(connection: sqlite3.Connection, node_id: int, sip_node_ip_id: int) -> Node:
    connection.execute("UPDATE node_ips SET ip_role = 'pool' WHERE node_id = ? AND ip_role = 'sip'", (node_id,))
    connection.execute("UPDATE node_ips SET ip_role = 'sip' WHERE id = ? AND node_id = ?", (sip_node_ip_id, node_id))
    connection.execute("UPDATE nodes SET sip_ip_id = ? WHERE id = ?", (sip_node_ip_id, node_id))
    connection.execute(
        """
        UPDATE node_ips
        SET ip_role = 'media'
        WHERE node_id = ?
          AND id != ?
          AND ip_role = 'pool'
        """,
        (node_id, sip_node_ip_id),
    )
    connection.commit()
    return get_node(connection, node_id)


def create_node_ip(connection: sqlite3.Connection, node_id: int, payload: NodeIpBase) -> Node:
    connection.execute(
        """
        INSERT INTO node_ips (node_id, ip_address, interface_name, ip_role, status, active_calls, max_concurrent_calls, current_cps, max_cps, weight, drain_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            node_id,
            payload.ip_address,
            payload.interface_name,
            payload.ip_role,
            payload.status,
            payload.active_calls,
            payload.max_concurrent_calls,
            payload.current_cps,
            payload.max_cps,
            payload.weight,
            int(payload.drain_mode),
        ),
    )
    connection.commit()
    return get_node(connection, node_id)


def update_node_ip(connection: sqlite3.Connection, node_id: int, node_ip_id: int, payload: NodeIpBase) -> Node:
    connection.execute(
        """
        UPDATE node_ips
        SET ip_address = ?,
            interface_name = ?,
            ip_role = ?,
            status = ?,
            active_calls = ?,
            max_concurrent_calls = ?,
            current_cps = ?,
            max_cps = ?,
            weight = ?,
            drain_mode = ?
        WHERE id = ? AND node_id = ?
        """,
        (
            payload.ip_address,
            payload.interface_name,
            payload.ip_role,
            payload.status,
            payload.active_calls,
            payload.max_concurrent_calls,
            payload.current_cps,
            payload.max_cps,
            payload.weight,
            int(payload.drain_mode),
            node_ip_id,
            node_id,
        ),
    )
    if payload.ip_role == "sip":
        connection.execute("UPDATE node_ips SET ip_role = 'pool' WHERE node_id = ? AND id != ? AND ip_role = 'sip'", (node_id, node_ip_id))
        connection.execute("UPDATE nodes SET sip_ip_id = ? WHERE id = ?", (node_ip_id, node_id))
    else:
        sip_row = connection.execute("SELECT sip_ip_id FROM nodes WHERE id = ?", (node_id,)).fetchone()
        if sip_row and sip_row["sip_ip_id"] == node_ip_id:
            connection.execute("UPDATE nodes SET sip_ip_id = NULL WHERE id = ?", (node_id,))
    connection.commit()
    return get_node(connection, node_id)


def delete_node_ip(connection: sqlite3.Connection, node_id: int, node_ip_id: int) -> Node:
    sip_row = connection.execute("SELECT sip_ip_id FROM nodes WHERE id = ?", (node_id,)).fetchone()
    if sip_row and sip_row["sip_ip_id"] == node_ip_id:
        connection.execute("UPDATE nodes SET sip_ip_id = NULL WHERE id = ?", (node_id,))
    connection.execute("DELETE FROM node_ips WHERE id = ? AND node_id = ?", (node_ip_id, node_id))
    connection.commit()
    return get_node(connection, node_id)
