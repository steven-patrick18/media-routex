from __future__ import annotations

import ipaddress
from dataclasses import dataclass


@dataclass(slots=True)
class DiscoveredIp:
    interface_name: str
    ip_address: str


def parse_linux_ipv4_output(output: str) -> list[DiscoveredIp]:
    discovered: list[DiscoveredIp] = []
    seen: set[tuple[str, str]] = set()

    for line in output.splitlines():
        line = line.strip()
        if not line or " inet " not in line:
            continue

        parts = line.split()
        if len(parts) < 4:
            continue

        interface_name = parts[1]
        cidr_value = parts[3]
        ip_value = cidr_value.split("/")[0]

        if interface_name == "lo":
            continue

        try:
            parsed_ip = ipaddress.ip_address(ip_value)
        except ValueError:
            continue

        if parsed_ip.is_loopback or parsed_ip.is_unspecified:
            continue

        key = (interface_name, ip_value)
        if key in seen:
            continue

        seen.add(key)
        discovered.append(DiscoveredIp(interface_name=interface_name, ip_address=ip_value))

    return discovered
