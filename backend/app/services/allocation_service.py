from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class AllocationCandidate:
    ip_address: str
    status: str
    active_calls: int
    max_concurrent_calls: int
    current_cps: int
    max_cps: int
    weight: int = 1
    drain_mode: bool = False


def select_media_ip(candidates: list[AllocationCandidate]) -> AllocationCandidate | None:
    """
    Placeholder for the future balanced media IP selection engine.

    Intended future behavior:
    - skip disabled IPs
    - skip draining IPs for new calls
    - skip IPs at max concurrent calls
    - skip IPs at max CPS for the current second
    - prefer the least-used available IP
    """
    eligible = [
        candidate
        for candidate in candidates
        if candidate.status.lower() == "active"
        and not candidate.drain_mode
        and candidate.active_calls < candidate.max_concurrent_calls
        and candidate.current_cps < candidate.max_cps
    ]
    if not eligible:
        return None
    return min(eligible, key=lambda candidate: (candidate.active_calls, candidate.current_cps, candidate.ip_address))
