import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_db
from app.repository import create_vendor, delete_vendor, get_vendor, list_vendors, update_vendor
from app.schemas import Vendor, VendorBase

router = APIRouter(prefix="/api/vendors", tags=["vendors"])


@router.get("", response_model=list[Vendor])
def read_vendors(connection: sqlite3.Connection = Depends(get_db)) -> list[Vendor]:
    return list_vendors(connection)


@router.get("/{vendor_id}", response_model=Vendor)
def read_vendor(vendor_id: int, connection: sqlite3.Connection = Depends(get_db)) -> Vendor:
    try:
        return get_vendor(connection, vendor_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Vendor not found") from exc


@router.post("", response_model=Vendor)
def create_vendor_record(payload: VendorBase, connection: sqlite3.Connection = Depends(get_db)) -> Vendor:
    return create_vendor(connection, payload)


@router.put("/{vendor_id}", response_model=Vendor)
def update_vendor_record(
    vendor_id: int,
    payload: VendorBase,
    connection: sqlite3.Connection = Depends(get_db),
) -> Vendor:
    try:
        return update_vendor(connection, vendor_id, payload)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Vendor not found") from exc


@router.delete("/{vendor_id}")
def delete_vendor_record(vendor_id: int, connection: sqlite3.Connection = Depends(get_db)) -> dict[str, bool]:
    delete_vendor(connection, vendor_id)
    return {"ok": True}
