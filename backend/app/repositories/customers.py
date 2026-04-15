from __future__ import annotations

import sqlite3

from app.schemas import Customer, CustomerBase


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
