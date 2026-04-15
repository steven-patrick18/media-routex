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
    sip_port: int = 5060
    sip_protocol: str = "UDP"
    sip_status: str = "Standby"


class NodeIp(BaseModel):
    id: int
    ip_address: str
    interface_name: str | None = None
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


class NodeConnectionTestRequest(BaseModel):
    main_ip: str
    ssh_port: int
    ssh_username: str
    ssh_password: str


class NodeConnectionTestResponse(BaseModel):
    ok: bool
    message: str


class NodeIpAssignmentRequest(BaseModel):
    role: Literal["sip", "media", "unassign"]


class NodeIpBase(BaseModel):
    ip_address: str
    interface_name: str | None = None
    ip_role: str = "pool"
    status: str = "active"
    active_calls: int = 0
    max_concurrent_calls: int = 30
    current_cps: int = 0
    max_cps: int = 5
    weight: int = 1
    drain_mode: bool = False


class NodeIpUpdateRequest(NodeIpBase):
    pass


class NodeBulkMediaAssignmentRequest(BaseModel):
    sip_node_ip_id: int


class MediaPoolIpConfig(BaseModel):
    node_ip_id: int
    status: str = "Active"
    active_calls: int = 0
    max_concurrent_calls: int = 30
    current_cps: int = 0
    max_cps: int = 5
    weight: int = 1
    drain_mode: bool = False


class MediaPoolBase(BaseModel):
    name: str
    assigned_node_id: int
    strategy: str = "Balanced"
    status: str = "Active"
    notes: str = ""
    assigned_media_ips: list[MediaPoolIpConfig] = Field(default_factory=list)


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
    assigned_media_ip_ids: list[int] = Field(default_factory=list)
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


class Settings(BaseModel):
    selection_strategy: str = "Balanced"
    default_max_calls: int = 30
    default_max_cps: int = 5
    source_identity_rule: str = "Source dialer IP only"
    customer_pool_rule: str = "Customers do not receive media pools directly"
    sip_whitelist_rule: str = "Customers and vendors whitelist the selected node SIP IP"
    notes: str = ""
