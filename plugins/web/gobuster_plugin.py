from pluggy import HookimplMarker
import shutil

hookimpl = HookimplMarker("mcp_ide")

@hookimpl
def mcp_metadata():
    return {
        "name": "gobuster",
        "category": "web",
        "description": "URL directory and file enumeration tool",
        "requires_approval": True,
        "docker_supported": True,
    }

async def run_tool(target: str, wordlist: str = "/usr/share/wordlists/dirb/common.txt"):
    # Check if gobuster is installed
    gobuster_path = shutil.which("gobuster")
    is_installed = gobuster_path is not None
    
    cmd = f"gobuster dir -u {target} -w {wordlist} -q -t 10"
    
    if not is_installed:
        approve_message = f"Gobuster is not installed. Click 'Allow' to install and run, or choose Docker."
        # Prepend apt installation if not installed and running locally
        cmd = f"sudo apt-get update && sudo apt-get install -y gobuster && {cmd}"
    else:
        approve_message = f"Enumerate directories on {target} using Gobuster?"
        
    return {
        "command": cmd,
        "approve_message": approve_message,
        "risk": "medium (active scanning)",
        "docker": True
    }
