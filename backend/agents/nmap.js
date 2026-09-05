// Example nmap plugin
module.exports = {
  metadata: {
    name: 'nmap',
    category: 'network',
    description: 'Port/network service scanner (example)',
    requires_approval: true,
    docker_supported: true,
    risk: 'low-medium (port scan)'
  },
  runTool(options = {}) {
    const target = options.target || 'scanme.nmap.org';
    const cmd = `nmap -F ${target}`;
    return {
      command: cmd,
      approveMessage: `Run nmap scan on ${target} with options -F?`,
      risk: 'low-medium (port scan)',
      docker: true
    }
  }
}
