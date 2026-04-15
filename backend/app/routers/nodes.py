import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_db
from app.schemas import Node, NodeBase, NodeBulkMediaAssignmentRequest, NodeConnectionTestRequest, NodeConnectionTestResponse, NodeIpAssignmentRequest, NodeIpUpdateRequest
from app.services.ssh_service import SshServiceError
from app.services.nodes import (
    create_node,
    create_node_ip_record,
    delete_node_ip_record,
    delete_node,
    get_node,
    list_nodes,
    scan_node_ip_pool,
    test_node_connection,
    bulk_assign_node_media_ips,
    update_node_ip_record,
    update_node,
    update_node_ip_role,
)

router = APIRouter(prefix="/api/nodes", tags=["nodes"])


@router.get("", response_model=list[Node])
def read_nodes(connection: sqlite3.Connection = Depends(get_db)) -> list[Node]:
    return list_nodes(connection)


@router.get("/{node_id}", response_model=Node)
def read_node(node_id: int, connection: sqlite3.Connection = Depends(get_db)) -> Node:
    try:
        return get_node(connection, node_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Node not found") from exc


@router.post("", response_model=Node)
def create_node_record(payload: NodeBase, connection: sqlite3.Connection = Depends(get_db)) -> Node:
    return create_node(connection, payload)


@router.put("/{node_id}", response_model=Node)
def update_node_record(node_id: int, payload: NodeBase, connection: sqlite3.Connection = Depends(get_db)) -> Node:
    try:
        return update_node(connection, node_id, payload)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Node not found") from exc


@router.delete("/{node_id}")
def delete_node_record(node_id: int, connection: sqlite3.Connection = Depends(get_db)) -> dict[str, bool]:
    delete_node(connection, node_id)
    return {"ok": True}


@router.post("/test-ssh", response_model=NodeConnectionTestResponse)
def test_node_connection_record(payload: NodeConnectionTestRequest) -> NodeConnectionTestResponse:
    return test_node_connection(payload)


@router.post("/{node_id}/scan-ip-pool", response_model=Node)
def scan_node_ip_pool_record(node_id: int, connection: sqlite3.Connection = Depends(get_db)) -> Node:
    try:
        return scan_node_ip_pool(connection, node_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Node not found") from exc
    except SshServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/{node_id}/ips/{node_ip_id}", response_model=Node)
def update_node_ip_role_record(
    node_id: int,
    node_ip_id: int,
    payload: NodeIpAssignmentRequest,
    connection: sqlite3.Connection = Depends(get_db),
) -> Node:
    try:
        return update_node_ip_role(connection, node_id, node_ip_id, payload.role)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Node not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{node_id}/bulk-assign-media", response_model=Node)
def bulk_assign_media_record(
    node_id: int,
    payload: NodeBulkMediaAssignmentRequest,
    connection: sqlite3.Connection = Depends(get_db),
) -> Node:
    try:
        return bulk_assign_node_media_ips(connection, node_id, payload.sip_node_ip_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Node not found") from exc


@router.post("/{node_id}/ips", response_model=Node)
def create_node_ip_route(
    node_id: int,
    payload: NodeIpUpdateRequest,
    connection: sqlite3.Connection = Depends(get_db),
) -> Node:
    try:
        return create_node_ip_record(connection, node_id, payload)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Node not found") from exc


@router.put("/{node_id}/ips/{node_ip_id}", response_model=Node)
def update_node_ip_route(
    node_id: int,
    node_ip_id: int,
    payload: NodeIpUpdateRequest,
    connection: sqlite3.Connection = Depends(get_db),
) -> Node:
    try:
        return update_node_ip_record(connection, node_id, node_ip_id, payload)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Node not found") from exc


@router.delete("/{node_id}/ips/{node_ip_id}", response_model=Node)
def delete_node_ip_route(
    node_id: int,
    node_ip_id: int,
    connection: sqlite3.Connection = Depends(get_db),
) -> Node:
    try:
        return delete_node_ip_record(connection, node_id, node_ip_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Node not found") from exc
