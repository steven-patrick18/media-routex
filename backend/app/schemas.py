from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: Literal["Backend Running"]


class CustomerBase(BaseModel):
    name: str
    status: str
    notes: str = ""
    dialer_ips: list[str] = Field(default_factory=list)
    allowed_sip_node_ids: list[int] = Field(default_factory=list)


class Customer(CustomerBase):
    id: int


class VendorBase(BaseModel):
    name: str
    sip_host: str
    sip_port: int
    status: str
    notes: str = ""
    allowed_sip_node_ids: list[int] = Field(default_factory=list)
    media_selection_strategy: str = "Balanced"
    media_pool_ids: list[int] = Field(default_factory=list)


class Vendor(VendorBase):
    id: int


class NodeBase(BaseModel):
    name: str
    main_ip: str
    ssh_port: int
    ssh_username: str
    ssh_password: str
    os_type: str
    purpose: str
    region: str
    notes: str = ""
    status: str = "Provisioning"
    sip_ip_id: int | None = None


class NodeIp(BaseModel):
    id: int
    ip_address: str
    ip_role: str
    status: str
    active_calls: int
    max_concurrent_calls: int
    current_cps: int
    max_cps: int
    weight: int
    drain_mode: bool


class Node(NodeBase):
    id: int
    ips: list[NodeIp] = Field(default_factory=list)


class MediaPoolBase(BaseModel):
    name: str
    assigned_node_id: int
    strategy: str = "Balanced"
    status: str = "Active"
    notes: str = ""
    assigned_media_ip_ids: list[int] = Field(default_factory=list)


class MediaPoolIp(BaseModel):
    id: int
    node_ip_id: int
    ip_address: str
    status: str
    active_calls: int
    max_concurrent_calls: int
    current_cps: int
    max_cps: int
    weight: int
    drain_mode: bool


class MediaPool(MediaPoolBase):
    id: int
    assigned_vendors: list[int] = Field(default_factory=list)
    media_ips: list[MediaPoolIp] = Field(default_factory=list)


class LogEntry(BaseModel):
    id: int
    timestamp: str
    module: str
    action: str
    target: str
    result: str
    user: str
    level: str


class DashboardSummary(BaseModel):
    total_customers: int
    total_vendors: int
    total_nodes: int
    total_media_pools: int
    active_media_ips: int
    total_concurrent_capacity: int


class UsageItem(BaseModel):
    label: str
    active_calls: int
    concurrent_capacity: int
    cps_capacity: int


class UsageSnapshot(BaseModel):
    nodes: list[UsageItem]
    media_pools: list[UsageItem]
    media_ips: list[UsageItem]


class SessionResponse(BaseModel):
    authenticated: bool
    user: str
    role: str
