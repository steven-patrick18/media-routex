from __future__ import annotations

import shutil
import subprocess


class SshServiceError(RuntimeError):
    pass


def run_ssh_command(host: str, port: int, username: str, password: str, command: str, timeout_seconds: int = 20) -> str:
    plink_path = shutil.which("plink.exe") or shutil.which("plink")
    if not plink_path:
      raise SshServiceError("PuTTY plink.exe is not available on this machine.")

    process = subprocess.run(
        [
            plink_path,
            "-batch",
            "-no-antispoof",
            "-P",
            str(port),
            "-l",
            username,
            "-pw",
            password,
            host,
            command,
        ],
        capture_output=True,
        text=True,
        timeout=timeout_seconds,
        check=False,
    )

    if process.returncode != 0:
        message = process.stderr.strip() or process.stdout.strip() or "SSH command failed."
        raise SshServiceError(message)

    return process.stdout
