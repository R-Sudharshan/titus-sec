// Express + plugin-style agent backend
const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const cors = require('cors');
const tasks = require('./state/approval-tasks');

// Load tool plugins
let toolPlugins = [];
const agentsDir = path.join(__dirname, 'agents');
for (const fname of fs.readdirSync(agentsDir)) {
  if (fname.endsWith('.js')) {
    const plugin = require('./agents/' + fname);
    toolPlugins.push(plugin);
  }
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/api/tools', (req, res) => {
  res.json(toolPlugins.map(t => t.metadata));
});

app.post('/api/task/request', (req,res) => {
  const { plugin, tool_name, parameters } = req.body;
  const tool = toolPlugins.find(t => t.metadata.name === tool_name);
  if (!tool) return res.status(404).json({error: 'Tool not found'});
  const info = tool.runTool(parameters);
  const task = tasks.createTask({
    plugin,
    tool_name,
    command: info.command,
    message: info.approveMessage,
    parameters,
    risk: info.risk,
    docker: info.docker || false,
  });
  res.json(task);
});

app.post('/api/task/approve', async (req,res) => {
  const { id, allow } = req.body;
  const task = tasks.tasks[id];
  if (!task) return res.status(404).json({error: 'Task not found'});
  if (allow) {
    tasks.updateTaskStatus(id, tasks.Status.ALLOWED);
    // fake execution
    tasks.updateTaskStatus(id, tasks.Status.RUNNING);
    setTimeout(() => {
      tasks.updateTaskStatus(id, tasks.Status.COMPLETED, 'Simulated run, real exec pending...');
    }, 2000);
  } else {
    tasks.updateTaskStatus(id, tasks.Status.DENIED);
  }
  res.json(tasks.tasks[id]);
});

app.get('/api/task/list', (req,res) => {
  res.json(Object.values(tasks.tasks));
});

// HTTP + WebSocket event server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/api/events' });

wss.on('connection', function connection(ws) {
  const listener = (event) => { try { ws.send(JSON.stringify(event)); } catch {} };
  tasks.registerListener(listener);
  ws.on('close', () => tasks.unregisterListener(listener));
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log('MCP Security Express agent server listening on', PORT);
});
