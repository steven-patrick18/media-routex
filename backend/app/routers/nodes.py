import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_db
from app.repository import create_node, delete_node, get_node, list_nodes, update_node
from app.schemas import Node, NodeBase

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
