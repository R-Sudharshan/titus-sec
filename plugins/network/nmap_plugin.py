from pluggy import HookimplMarker
import asyncio

hookimpl = HookimplMarker("mcp_ide")

@hookimpl
def mcp_metadata():
    return {
        "name": "nmap",
        "category": "network",
        "description": "Port/network service scanner (example)",
        "requires_approval": True,
        "docker_supported": True,
    }

async def run_tool(target: str, options: str = "-F"):
    # This function only prepares the command, not execution!
    cmd = f"nmap {options} {target}"
    # in real orchestrator, emit approval request and await user
    return {
        "command": cmd,
        "approve_message": f"Run nmap scan on {target} with options {options}?",
        "risk": "low-medium (port scan)",
        "docker": True
    }
