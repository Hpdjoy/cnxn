const WebSocket = require("ws");
const http = require("http");

// Load environment variables from .env file
require('dotenv').config();

// Configuration
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*']; // Allow all origins in development

let clients = [];

// Create HTTP server
const server = http.createServer((req, res) => {
  // Set CORS headers
  const origin = req.headers.origin;

  if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint for AWS
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      clients: clients.length,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Default response
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket Signaling Server Running\n');
});

// Create WebSocket server
const wss = new WebSocket.Server({
  server,
  // Verify origin for WebSocket connections
  verifyClient: (info) => {
    if (ALLOWED_ORIGINS.includes('*')) {
      return true;
    }

    const origin = info.origin || info.req.headers.origin;
    return ALLOWED_ORIGINS.includes(origin);
  }
});

wss.on("connection", (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`New client connected from ${clientIp}. Total clients: ${clients.length + 1}`);

  clients.push(ws);

  ws.on("message", (message) => {
    // Send message to all other clients
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", () => {
    clients = clients.filter((client) => client !== ws);
    console.log(`Client disconnected. Total clients: ${clients.length}`);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Signaling server running on port ${PORT}`);
  console.log(`WebSocket: ws://0.0.0.0:${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
