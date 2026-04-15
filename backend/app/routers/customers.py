import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_db
from app.schemas import Customer, CustomerBase
from app.services.customers import create_customer, delete_customer, get_customer, list_customers, update_customer

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("", response_model=list[Customer])
def read_customers(connection: sqlite3.Connection = Depends(get_db)) -> list[Customer]:
    return list_customers(connection)


@router.get("/{customer_id}", response_model=Customer)
def read_customer(customer_id: int, connection: sqlite3.Connection = Depends(get_db)) -> Customer:
    try:
        return get_customer(connection, customer_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Customer not found") from exc


@router.post("", response_model=Customer)
def create_customer_record(payload: CustomerBase, connection: sqlite3.Connection = Depends(get_db)) -> Customer:
    return create_customer(connection, payload)


@router.put("/{customer_id}", response_model=Customer)
def update_customer_record(
    customer_id: int,
    payload: CustomerBase,
    connection: sqlite3.Connection = Depends(get_db),
) -> Customer:
    try:
        return update_customer(connection, customer_id, payload)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Customer not found") from exc


@router.delete("/{customer_id}")
def delete_customer_record(customer_id: int, connection: sqlite3.Connection = Depends(get_db)) -> dict[str, bool]:
    delete_customer(connection, customer_id)
    return {"ok": True}
