from __future__ import annotations

import sqlite3

from app.repositories.nodes import (
    bulk_assign_media_ips,
    assign_node_ip_role,
    create_node_ip,
    create_node,
    delete_node_ip,
    delete_node,
    get_node,
    insert_or_update_node_ips,
    list_nodes,
    update_node_ip,
    update_node,
)
from app.schemas import Node, NodeConnectionTestRequest, NodeConnectionTestResponse, NodeIpBase
from app.services.ip_discovery import parse_linux_ipv4_output
from app.services.ssh_service import SshServiceError, run_ssh_command


def test_node_connection(payload: NodeConnectionTestRequest) -> NodeConnectionTestResponse:
    try:
        output = run_ssh_command(
            host=payload.main_ip,
            port=payload.ssh_port,
            username=payload.ssh_username,
            password=payload.ssh_password,
            command="echo mediaroutex-ssh-ok",
        )
    except SshServiceError as exc:
        return NodeConnectionTestResponse(ok=False, message=str(exc))

    if "mediaroutex-ssh-ok" not in output:
        return NodeConnectionTestResponse(ok=False, message="SSH connected, but the remote verification command did not return the expected result.")

    return NodeConnectionTestResponse(ok=True, message="SSH connection test succeeded.")


def scan_node_ip_pool(connection: sqlite3.Connection, node_id: int) -> Node:
    node = get_node(connection, node_id)
    output = run_ssh_command(
        host=node.main_ip,
        port=node.ssh_port,
        username=node.ssh_username,
        password=node.ssh_password,
        command="ip -o -4 addr show",
        timeout_seconds=30,
    )
    discovered = parse_linux_ipv4_output(output)
    return insert_or_update_node_ips(connection, node_id, [(item.interface_name, item.ip_address) for item in discovered])


def update_node_ip_role(connection: sqlite3.Connection, node_id: int, node_ip_id: int, role: str) -> Node:
    return assign_node_ip_role(connection, node_id, node_ip_id, role)


def bulk_assign_node_media_ips(connection: sqlite3.Connection, node_id: int, sip_node_ip_id: int) -> Node:
    return bulk_assign_media_ips(connection, node_id, sip_node_ip_id)


def create_node_ip_record(connection: sqlite3.Connection, node_id: int, payload: NodeIpBase) -> Node:
    return create_node_ip(connection, node_id, payload)


def update_node_ip_record(connection: sqlite3.Connection, node_id: int, node_ip_id: int, payload: NodeIpBase) -> Node:
    return update_node_ip(connection, node_id, node_ip_id, payload)


def delete_node_ip_record(connection: sqlite3.Connection, node_id: int, node_ip_id: int) -> Node:
    return delete_node_ip(connection, node_id, node_ip_id)
