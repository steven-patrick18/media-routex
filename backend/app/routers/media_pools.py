import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_db
from app.repository import create_media_pool, delete_media_pool, get_media_pool, list_media_pools, update_media_pool
from app.schemas import MediaPool, MediaPoolBase

router = APIRouter(prefix="/api/media-pools", tags=["media-pools"])


@router.get("", response_model=list[MediaPool])
def read_media_pools(connection: sqlite3.Connection = Depends(get_db)) -> list[MediaPool]:
    return list_media_pools(connection)


@router.get("/{media_pool_id}", response_model=MediaPool)
def read_media_pool(media_pool_id: int, connection: sqlite3.Connection = Depends(get_db)) -> MediaPool:
    try:
        return get_media_pool(connection, media_pool_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Media pool not found") from exc


@router.post("", response_model=MediaPool)
def create_media_pool_record(payload: MediaPoolBase, connection: sqlite3.Connection = Depends(get_db)) -> MediaPool:
    return create_media_pool(connection, payload)


@router.put("/{media_pool_id}", response_model=MediaPool)
def update_media_pool_record(
    media_pool_id: int,
    payload: MediaPoolBase,
    connection: sqlite3.Connection = Depends(get_db),
) -> MediaPool:
    try:
        return update_media_pool(connection, media_pool_id, payload)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Media pool not found") from exc


@router.delete("/{media_pool_id}")
def delete_media_pool_record(
    media_pool_id: int,
    connection: sqlite3.Connection = Depends(get_db),
) -> dict[str, bool]:
    delete_media_pool(connection, media_pool_id)
    return {"ok": True}
