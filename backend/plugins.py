import importlib
import pkgutil
import os
from pluggy import PluginManager, HookspecMarker, HookimplMarker

hookspec = HookspecMarker("mcp_ide")
hookimpl = HookimplMarker("mcp_ide")

PLUGIN_FOLDER = os.path.join(os.path.dirname(__file__), '../plugins')
PLUGIN_NAMESPACE = 'mcp_ide'

class PluginSpec:
    @hookspec
    def mcp_metadata(self) -> dict:
        """Tool/plugin metadata for MCP discovery."""

pm = PluginManager(PLUGIN_NAMESPACE)
pm.add_hookspecs(PluginSpec)

# Dynamic load all plugins recursively from plugins/ subfolders
def load_plugins():
    plugin_abs_dir = os.path.abspath(PLUGIN_FOLDER)
    for info in pkgutil.walk_packages([plugin_abs_dir], prefix="plugins."):
        if not info.ispkg:
            module = importlib.import_module(info.name)
            pm.register(module, info.name)

load_plugins()

MCP_PLUGINS = pm.get_plugins()
MCP_METADATA = [p.mcp_metadata() for p in MCP_PLUGINS if hasattr(p, 'mcp_metadata')]
