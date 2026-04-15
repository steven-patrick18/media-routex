from __future__ import annotations

import sqlite3

from app.schemas import (
    Customer,
    CustomerBase,
    DashboardSummary,
    LogEntry,
    MediaPool,
    MediaPoolBase,
    MediaPoolIp,
    Node,
    NodeBase,
    NodeIp,
    UsageItem,
    UsageSnapshot,
    Vendor,
    VendorBase,
)


def list_customers(connection: sqlite3.Connection) -> list[Customer]:
    rows = connection.execute("SELECT * FROM customers ORDER BY id DESC").fetchall()
    items: list[Customer] = []
    for row in rows:
        ips = [
            ip_row["dialer_ip"]
            for ip_row in connection.execute(
                "SELECT dialer_ip FROM customer_ips WHERE customer_id = ? ORDER BY id",
                (row["id"],),
            ).fetchall()
        ]
        items.append(
            Customer(
                id=row["id"],
                name=row["name"],
                status=row["status"],
                notes=row["notes"],
                dialer_ips=ips,
                allowed_sip_node_ids=[
                    link["node_id"]
                    for link in connection.execute(
                        "SELECT node_id FROM customer_allowed_sip_nodes WHERE customer_id = ? ORDER BY node_id",
                        (row["id"],),
                    ).fetchall()
                ],
            )
        )
    return items


def create_customer(connection: sqlite3.Connection, payload: CustomerBase) -> Customer:
    cursor = connection.execute(
        "INSERT INTO customers (name, status, notes) VALUES (?, ?, ?)",
        (payload.name, payload.status, payload.notes),
    )
    customer_id = cursor.lastrowid
    connection.executemany(
        "INSERT INTO customer_ips (customer_id, dialer_ip) VALUES (?, ?)",
        [(customer_id, ip) for ip in payload.dialer_ips],
    )
    connection.executemany(
        "INSERT INTO customer_allowed_sip_nodes (customer_id, node_id) VALUES (?, ?)",
        [(customer_id, node_id) for node_id in payload.allowed_sip_node_ids],
    )
    connection.commit()
    return get_customer(connection, customer_id)


def get_customer(connection: sqlite3.Connection, customer_id: int) -> Customer:
    row = connection.execute("SELECT * FROM customers WHERE id = ?", (customer_id,)).fetchone()
    if row is None:
        raise KeyError(customer_id)
    ips = [
        ip_row["dialer_ip"]
        for ip_row in connection.execute(
            "SELECT dialer_ip FROM customer_ips WHERE customer_id = ? ORDER BY id",
            (customer_id,),
        ).fetchall()
    ]
    allowed_nodes = [
        link["node_id"]
        for link in connection.execute(
            "SELECT node_id FROM customer_allowed_sip_nodes WHERE customer_id = ? ORDER BY node_id",
            (customer_id,),
        ).fetchall()
    ]
    return Customer(id=row["id"], name=row["name"], status=row["status"], notes=row["notes"], dialer_ips=ips, allowed_sip_node_ids=allowed_nodes)


def update_customer(connection: sqlite3.Connection, customer_id: int, payload: CustomerBase) -> Customer:
    connection.execute(
        "UPDATE customers SET name = ?, status = ?, notes = ? WHERE id = ?",
        (payload.name, payload.status, payload.notes, customer_id),
    )
    connection.execute("DELETE FROM customer_ips WHERE customer_id = ?", (customer_id,))
    connection.execute("DELETE FROM customer_allowed_sip_nodes WHERE customer_id = ?", (customer_id,))
    connection.executemany(
        "INSERT INTO customer_ips (customer_id, dialer_ip) VALUES (?, ?)",
        [(customer_id, ip) for ip in payload.dialer_ips],
    )
    connection.executemany(
        "INSERT INTO customer_allowed_sip_nodes (customer_id, node_id) VALUES (?, ?)",
        [(customer_id, node_id) for node_id in payload.allowed_sip_node_ids],
    )
    connection.commit()
    return get_customer(connection, customer_id)


def delete_customer(connection: sqlite3.Connection, customer_id: int) -> None:
    connection.execute("DELETE FROM customers WHERE id = ?", (customer_id,))
    connection.commit()


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


def list_nodes(connection: sqlite3.Connection) -> list[Node]:
    rows = connection.execute("SELECT * FROM nodes ORDER BY id DESC").fetchall()
    return [_node_from_row(connection, row) for row in rows]


def get_node(connection: sqlite3.Connection, node_id: int) -> Node:
    row = connection.execute("SELECT * FROM nodes WHERE id = ?", (node_id,)).fetchone()
    if row is None:
        raise KeyError(node_id)
    return _node_from_row(connection, row)


def create_node(connection: sqlite3.Connection, payload: NodeBase) -> Node:
    cursor = connection.execute(
        """
        INSERT INTO nodes (name, main_ip, ssh_port, ssh_username, ssh_password, os_type, purpose, region, notes, status, sip_ip_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.name,
            payload.main_ip,
            payload.ssh_port,
            payload.ssh_username,
            payload.ssh_password,
            payload.os_type,
            payload.purpose,
            payload.region,
            payload.notes,
            payload.status,
            payload.sip_ip_id,
        ),
    )
    node_id = cursor.lastrowid
    connection.execute(
        """
        INSERT INTO node_ips (node_id, ip_address, ip_role, status, active_calls, max_concurrent_calls, current_cps, max_cps, weight, drain_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (node_id, payload.main_ip, "main", "active", 0, 30, 0, 5, 1, 0),
    )
    connection.commit()
    return get_node(connection, node_id)


def update_node(connection: sqlite3.Connection, node_id: int, payload: NodeBase) -> Node:
    connection.execute(
        """
        UPDATE nodes
        SET name = ?, main_ip = ?, ssh_port = ?, ssh_username = ?, ssh_password = ?, os_type = ?, purpose = ?, region = ?, notes = ?, status = ?, sip_ip_id = ?
        WHERE id = ?
        """,
        (
            payload.name,
            payload.main_ip,
            payload.ssh_port,
            payload.ssh_username,
            payload.ssh_password,
            payload.os_type,
            payload.purpose,
            payload.region,
            payload.notes,
            payload.status,
            payload.sip_ip_id,
            node_id,
        ),
    )
    connection.commit()
    return get_node(connection, node_id)


def delete_node(connection: sqlite3.Connection, node_id: int) -> None:
    connection.execute("DELETE FROM nodes WHERE id = ?", (node_id,))
    connection.commit()


def list_media_pools(connection: sqlite3.Connection) -> list[MediaPool]:
    rows = connection.execute("SELECT * FROM media_pools ORDER BY id DESC").fetchall()
    return [_media_pool_from_row(connection, row) for row in rows]


def get_media_pool(connection: sqlite3.Connection, media_pool_id: int) -> MediaPool:
    row = connection.execute("SELECT * FROM media_pools WHERE id = ?", (media_pool_id,)).fetchone()
    if row is None:
        raise KeyError(media_pool_id)
    return _media_pool_from_row(connection, row)


def create_media_pool(connection: sqlite3.Connection, payload: MediaPoolBase) -> MediaPool:
    cursor = connection.execute(
        "INSERT INTO media_pools (name, assigned_node_id, strategy, status, notes) VALUES (?, ?, ?, ?, ?)",
        (payload.name, payload.assigned_node_id, payload.strategy, payload.status, payload.notes),
    )
    media_pool_id = cursor.lastrowid
    connection.executemany(
        """
        INSERT INTO media_pool_ips (media_pool_id, node_ip_id, status, active_calls, max_concurrent_calls, current_cps, max_cps, weight, drain_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [(media_pool_id, ip_id, "Active", 0, 30, 0, 5, 1, 0) for ip_id in payload.assigned_media_ip_ids],
    )
    connection.commit()
    return get_media_pool(connection, media_pool_id)


def update_media_pool(connection: sqlite3.Connection, media_pool_id: int, payload: MediaPoolBase) -> MediaPool:
    connection.execute(
        "UPDATE media_pools SET name = ?, assigned_node_id = ?, strategy = ?, status = ?, notes = ? WHERE id = ?",
        (payload.name, payload.assigned_node_id, payload.strategy, payload.status, payload.notes, media_pool_id),
    )
    connection.execute("DELETE FROM media_pool_ips WHERE media_pool_id = ?", (media_pool_id,))
    connection.executemany(
        """
        INSERT INTO media_pool_ips (media_pool_id, node_ip_id, status, active_calls, max_concurrent_calls, current_cps, max_cps, weight, drain_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [(media_pool_id, ip_id, "Active", 0, 30, 0, 5, 1, 0) for ip_id in payload.assigned_media_ip_ids],
    )
    connection.commit()
    return get_media_pool(connection, media_pool_id)


def delete_media_pool(connection: sqlite3.Connection, media_pool_id: int) -> None:
    connection.execute("DELETE FROM media_pools WHERE id = ?", (media_pool_id,))
    connection.commit()


def list_logs(connection: sqlite3.Connection) -> list[LogEntry]:
    rows = connection.execute("SELECT * FROM logs ORDER BY timestamp DESC, id DESC").fetchall()
    return [LogEntry(**dict(row)) for row in rows]


def create_log(connection: sqlite3.Connection, payload: LogEntry) -> LogEntry:
    cursor = connection.execute(
        "INSERT INTO logs (timestamp, module, action, target, result, user, level) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (payload.timestamp, payload.module, payload.action, payload.target, payload.result, payload.user, payload.level),
    )
    connection.commit()
    row = connection.execute("SELECT * FROM logs WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return LogEntry(**dict(row))


def dashboard_summary(connection: sqlite3.Connection) -> DashboardSummary:
    active_media_ips = connection.execute(
        "SELECT COUNT(*) AS count FROM media_pool_ips WHERE status = 'Active'"
    ).fetchone()["count"]
    return DashboardSummary(
        total_customers=connection.execute("SELECT COUNT(*) AS count FROM customers").fetchone()["count"],
        total_vendors=connection.execute("SELECT COUNT(*) AS count FROM vendors").fetchone()["count"],
        total_nodes=connection.execute("SELECT COUNT(*) AS count FROM nodes").fetchone()["count"],
        total_media_pools=connection.execute("SELECT COUNT(*) AS count FROM media_pools").fetchone()["count"],
        active_media_ips=active_media_ips,
        total_concurrent_capacity=active_media_ips * 30,
    )


def usage_snapshot(connection: sqlite3.Connection) -> UsageSnapshot:
    node_rows = connection.execute(
        """
        SELECT nodes.name AS label,
               COALESCE(SUM(node_ips.active_calls), 0) AS active_calls,
               COUNT(node_ips.id) * 30 AS concurrent_capacity,
               COUNT(node_ips.id) * 5 AS cps_capacity
        FROM nodes
        LEFT JOIN node_ips ON node_ips.node_id = nodes.id AND node_ips.ip_role = 'media'
        GROUP BY nodes.id
        ORDER BY nodes.name
        """
    ).fetchall()
    pool_rows = connection.execute(
        """
        SELECT media_pools.name AS label,
               COALESCE(SUM(media_pool_ips.active_calls), 0) AS active_calls,
               SUM(CASE WHEN media_pool_ips.status = 'Active' THEN media_pool_ips.max_concurrent_calls ELSE 0 END) AS concurrent_capacity,
               SUM(CASE WHEN media_pool_ips.status = 'Active' THEN media_pool_ips.max_cps ELSE 0 END) AS cps_capacity
        FROM media_pools
        LEFT JOIN media_pool_ips ON media_pool_ips.media_pool_id = media_pools.id
        GROUP BY media_pools.id
        ORDER BY media_pools.name
        """
    ).fetchall()
    media_ip_rows = connection.execute(
        """
        SELECT node_ips.ip_address AS label,
               COALESCE(media_pool_ips.active_calls, node_ips.active_calls) AS active_calls,
               COALESCE(media_pool_ips.max_concurrent_calls, node_ips.max_concurrent_calls) AS concurrent_capacity,
               COALESCE(media_pool_ips.max_cps, node_ips.max_cps) AS cps_capacity
        FROM node_ips
        LEFT JOIN media_pool_ips ON media_pool_ips.node_ip_id = node_ips.id
        WHERE node_ips.ip_role = 'media'
        ORDER BY node_ips.ip_address
        """
    ).fetchall()
    return UsageSnapshot(
        nodes=[UsageItem(**dict(row)) for row in node_rows],
        media_pools=[UsageItem(**dict(row)) for row in pool_rows],
        media_ips=[UsageItem(**dict(row)) for row in media_ip_rows],
    )


def _node_from_row(connection: sqlite3.Connection, row: sqlite3.Row) -> Node:
    ip_rows = connection.execute("SELECT * FROM node_ips WHERE node_id = ? ORDER BY id", (row["id"],)).fetchall()
    return Node(
        id=row["id"],
        name=row["name"],
        main_ip=row["main_ip"],
        ssh_port=row["ssh_port"],
        ssh_username=row["ssh_username"],
        ssh_password=row["ssh_password"],
        os_type=row["os_type"],
        purpose=row["purpose"],
        region=row["region"],
        notes=row["notes"],
        status=row["status"],
        sip_ip_id=row["sip_ip_id"],
        ips=[
            NodeIp(
                id=ip_row["id"],
                ip_address=ip_row["ip_address"],
                ip_role=ip_row["ip_role"],
                status=ip_row["status"],
                active_calls=ip_row["active_calls"],
                max_concurrent_calls=ip_row["max_concurrent_calls"],
                current_cps=ip_row["current_cps"],
                max_cps=ip_row["max_cps"],
                weight=ip_row["weight"],
                drain_mode=bool(ip_row["drain_mode"]),
            )
            for ip_row in ip_rows
        ],
    )


def _media_pool_from_row(connection: sqlite3.Connection, row: sqlite3.Row) -> MediaPool:
    vendor_rows = connection.execute(
        "SELECT vendor_id FROM vendor_media_pools WHERE media_pool_id = ? ORDER BY vendor_id",
        (row["id"],),
    ).fetchall()
    media_ip_rows = connection.execute(
        """
        SELECT media_pool_ips.*, node_ips.ip_address
        FROM media_pool_ips
        JOIN node_ips ON node_ips.id = media_pool_ips.node_ip_id
        WHERE media_pool_id = ?
        ORDER BY media_pool_ips.id
        """,
        (row["id"],),
    ).fetchall()
    return MediaPool(
        id=row["id"],
        name=row["name"],
        assigned_node_id=row["assigned_node_id"],
        strategy=row["strategy"],
        status=row["status"],
        notes=row["notes"],
        assigned_media_ip_ids=[media_row["node_ip_id"] for media_row in media_ip_rows],
        assigned_vendors=[vendor_row["vendor_id"] for vendor_row in vendor_rows],
        media_ips=[
            MediaPoolIp(
                id=media_row["id"],
                node_ip_id=media_row["node_ip_id"],
                ip_address=media_row["ip_address"],
                status=media_row["status"],
                active_calls=media_row["active_calls"],
                max_concurrent_calls=media_row["max_concurrent_calls"],
                current_cps=media_row["current_cps"],
                max_cps=media_row["max_cps"],
                weight=media_row["weight"],
                drain_mode=bool(media_row["drain_mode"]),
            )
            for media_row in media_ip_rows
        ],
    )
