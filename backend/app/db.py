from __future__ import annotations

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "mediaroutex.db"


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.executescript(
            """
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                status TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS customer_ips (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                dialer_ip TEXT NOT NULL,
                FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS customer_allowed_sip_nodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                node_id INTEGER NOT NULL,
                FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY(node_id) REFERENCES nodes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS vendors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                sip_host TEXT NOT NULL,
                sip_port INTEGER NOT NULL,
                status TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                media_selection_strategy TEXT NOT NULL DEFAULT 'Balanced'
            );

            CREATE TABLE IF NOT EXISTS vendor_allowed_sip_nodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vendor_id INTEGER NOT NULL,
                node_id INTEGER NOT NULL,
                FOREIGN KEY(vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
                FOREIGN KEY(node_id) REFERENCES nodes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS nodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                main_ip TEXT NOT NULL,
                ssh_port INTEGER NOT NULL,
                ssh_username TEXT NOT NULL,
                ssh_password TEXT NOT NULL,
                os_type TEXT NOT NULL,
                purpose TEXT NOT NULL,
                region TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'Provisioning',
                sip_ip_id INTEGER,
                FOREIGN KEY(sip_ip_id) REFERENCES node_ips(id)
            );

            CREATE TABLE IF NOT EXISTS node_ips (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                node_id INTEGER NOT NULL,
                ip_address TEXT NOT NULL,
                ip_role TEXT NOT NULL DEFAULT 'pool',
                status TEXT NOT NULL DEFAULT 'active',
                active_calls INTEGER NOT NULL DEFAULT 0,
                max_concurrent_calls INTEGER NOT NULL DEFAULT 30,
                current_cps INTEGER NOT NULL DEFAULT 0,
                max_cps INTEGER NOT NULL DEFAULT 5,
                weight INTEGER NOT NULL DEFAULT 1,
                drain_mode INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY(node_id) REFERENCES nodes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS media_pools (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                assigned_node_id INTEGER NOT NULL,
                strategy TEXT NOT NULL DEFAULT 'Balanced',
                status TEXT NOT NULL DEFAULT 'Active',
                notes TEXT NOT NULL DEFAULT '',
                FOREIGN KEY(assigned_node_id) REFERENCES nodes(id)
            );

            CREATE TABLE IF NOT EXISTS media_pool_ips (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                media_pool_id INTEGER NOT NULL,
                node_ip_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'Active',
                active_calls INTEGER NOT NULL DEFAULT 0,
                max_concurrent_calls INTEGER NOT NULL DEFAULT 30,
                current_cps INTEGER NOT NULL DEFAULT 0,
                max_cps INTEGER NOT NULL DEFAULT 5,
                weight INTEGER NOT NULL DEFAULT 1,
                drain_mode INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY(media_pool_id) REFERENCES media_pools(id) ON DELETE CASCADE,
                FOREIGN KEY(node_ip_id) REFERENCES node_ips(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS vendor_media_pools (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vendor_id INTEGER NOT NULL,
                media_pool_id INTEGER NOT NULL,
                FOREIGN KEY(vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
                FOREIGN KEY(media_pool_id) REFERENCES media_pools(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                module TEXT NOT NULL,
                action TEXT NOT NULL,
                target TEXT NOT NULL,
                result TEXT NOT NULL,
                user TEXT NOT NULL,
                level TEXT NOT NULL
            );
            """
        )
        _ensure_column(cursor, "nodes", "sip_ip_id", "INTEGER")
        connection.commit()
        seed_db(connection)


def seed_db(connection: sqlite3.Connection) -> None:
    cursor = connection.cursor()
    existing = cursor.execute("SELECT COUNT(*) AS count FROM customers").fetchone()["count"]
    if existing:
        return

    cursor.execute(
        "INSERT INTO customers (name, status, notes) VALUES (?, ?, ?)",
        ("BlueWave Dialing", "Active", "Primary outbound campaign dialer for BFSI traffic."),
    )
    customer_one = cursor.lastrowid
    cursor.executemany(
        "INSERT INTO customer_ips (customer_id, dialer_ip) VALUES (?, ?)",
        [(customer_one, "203.0.113.41"), (customer_one, "203.0.113.42")],
    )

    cursor.execute(
        "INSERT INTO customers (name, status, notes) VALUES (?, ?, ?)",
        ("NorthGrid Connect", "Active", "Dedicated traffic feed for east region campaigns."),
    )
    customer_two = cursor.lastrowid
    cursor.execute(
        "INSERT INTO customer_ips (customer_id, dialer_ip) VALUES (?, ?)",
        (customer_two, "198.51.100.18"),
    )

    cursor.execute(
        """
        INSERT INTO nodes (name, main_ip, ssh_port, ssh_username, ssh_password, os_type, purpose, region, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        ("DEL-SBC-01", "10.10.0.11", 22, "noc-admin", "secret", "Ubuntu 24.04", "SIP + MEDIA", "Delhi", "Primary SIP and media node for north India traffic.", "Healthy"),
    )
    node_one = cursor.lastrowid
    cursor.executemany(
        """
        INSERT INTO node_ips (node_id, ip_address, ip_role, status, active_calls, max_concurrent_calls, current_cps, max_cps, weight, drain_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (node_one, "10.10.0.11", "main", "active", 0, 30, 0, 5, 1, 0),
            (node_one, "10.10.0.12", "sip", "active", 0, 30, 0, 5, 1, 0),
            (node_one, "10.10.0.13", "media", "active", 17, 30, 3, 5, 1, 0),
            (node_one, "10.10.0.14", "media", "draining", 5, 30, 1, 5, 1, 1),
        ],
    )

    cursor.execute(
        """
        INSERT INTO nodes (name, main_ip, ssh_port, ssh_username, ssh_password, os_type, purpose, region, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        ("MUM-GW-02", "10.20.0.21", 22, "gateway-op", "secret", "Debian 12", "ROUTING / GATEWAY", "Mumbai", "Vendor interconnect gateway and NAT policy host.", "Warning"),
    )
    node_two = cursor.lastrowid
    cursor.executemany(
        """
        INSERT INTO node_ips (node_id, ip_address, ip_role, status, active_calls, max_concurrent_calls, current_cps, max_cps, weight, drain_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (node_two, "10.20.0.21", "main", "active", 0, 30, 0, 5, 1, 0),
            (node_two, "10.20.0.22", "sip", "active", 0, 30, 0, 5, 1, 0),
            (node_two, "10.20.0.23", "media", "active", 11, 30, 4, 5, 1, 0),
        ],
    )

    node_ip_ids = {
        row["ip_address"]: row["id"]
        for row in cursor.execute("SELECT id, ip_address FROM node_ips").fetchall()
    }
    cursor.execute("UPDATE nodes SET sip_ip_id = ? WHERE id = ?", (node_ip_ids["10.10.0.12"], node_one))
    cursor.execute("UPDATE nodes SET sip_ip_id = ? WHERE id = ?", (node_ip_ids["10.20.0.22"], node_two))

    cursor.execute(
        """
        INSERT INTO vendors (name, sip_host, sip_port, status, notes, media_selection_strategy)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        ("VoiceGrid Carrier", "198.51.100.10", 5060, "Active", "Primary India route partner.", "Balanced"),
    )
    vendor_one = cursor.lastrowid

    cursor.execute(
        """
        INSERT INTO vendors (name, sip_host, sip_port, status, notes, media_selection_strategy)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        ("TransitWave", "198.51.100.24", 5080, "Standby", "Overflow vendor for campaign spikes.", "Round Robin"),
    )
    vendor_two = cursor.lastrowid

    cursor.executemany(
        "INSERT INTO customer_allowed_sip_nodes (customer_id, node_id) VALUES (?, ?)",
        [(customer_one, node_two), (customer_one, node_one), (customer_two, node_two)],
    )

    cursor.execute(
        "INSERT INTO media_pools (name, assigned_node_id, strategy, status, notes) VALUES (?, ?, ?, ?, ?)",
        ("IN-MEDIA-A", node_one, "Balanced", "Active", "Primary balanced pool for north traffic."),
    )
    pool_one = cursor.lastrowid
    cursor.execute(
        "INSERT INTO media_pools (name, assigned_node_id, strategy, status, notes) VALUES (?, ?, ?, ?, ?)",
        ("WEST-GW-POOL", node_two, "Round Robin", "Active", "Overflow pool for west-region dialer bursts."),
    )
    pool_two = cursor.lastrowid

    cursor.executemany(
        "INSERT INTO vendor_media_pools (vendor_id, media_pool_id) VALUES (?, ?)",
        [(vendor_one, pool_one), (vendor_two, pool_two)],
    )
    cursor.executemany(
        "INSERT INTO vendor_allowed_sip_nodes (vendor_id, node_id) VALUES (?, ?)",
        [(vendor_one, node_one), (vendor_one, node_two), (vendor_two, node_two)],
    )
    cursor.executemany(
        """
        INSERT INTO media_pool_ips (media_pool_id, node_ip_id, status, active_calls, max_concurrent_calls, current_cps, max_cps, weight, drain_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (pool_one, node_ip_ids["10.10.0.13"], "Active", 17, 30, 3, 5, 1, 0),
            (pool_one, node_ip_ids["10.10.0.14"], "Draining", 5, 30, 1, 5, 1, 1),
            (pool_two, node_ip_ids["10.20.0.23"], "Active", 11, 30, 4, 5, 1, 0),
        ],
    )

    cursor.executemany(
        """
        INSERT INTO logs (timestamp, module, action, target, result, user, level)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        [
            ("2026-04-15 17:10:03", "media_pools", "assign_ip", "IN-MEDIA-A / 10.10.0.13", "success", "ops.user", "user action"),
            ("2026-04-15 17:08:40", "vendors", "update_strategy", "TransitWave", "success", "ops.user", "user action"),
            ("2026-04-15 17:06:11", "routing", "capacity_warning", "WEST-GW-POOL", "warning", "system", "warning"),
            ("2026-04-15 17:05:02", "nodes", "agent_check", "BLR-MON-01", "pending", "system", "system action"),
        ],
    )

    connection.commit()


def _ensure_column(cursor: sqlite3.Cursor, table_name: str, column_name: str, definition: str) -> None:
    columns = {
        row[1]
        for row in cursor.execute(f"PRAGMA table_info({table_name})").fetchall()
    }
    if column_name not in columns:
        cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}")
