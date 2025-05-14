const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const bodyParser = require('body-parser');

// Initialize Express app and HTTP server
const app = express();
// Add before your routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });
const server = http.createServer(app);

// Create WebSocket server attached to the HTTP server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

// Middleware for parsing JSON
app.use(bodyParser.json());

// WebSocket connection handler
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('New client connected. Total clients:', clients.size);

  ws.on('message', function (message) {
    console.log("Received message from client: "+ message);
  })

  // Handle client disconnection
  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Remaining clients:', clients.size);
  });

  // Optional: Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Admin endpoint to trigger data broadcast
app.post('/broadcast', (req, res) => {
  const data = req.body;
  
  if (!data) {
    return res.status(400).json({ error: 'No data provided' });
  }

  // Broadcast to all connected clients
  broadcast(data);
  res.json({ message: 'Data broadcasted successfully', data });
});


// Broadcast function
function broadcast(data) {
  const payload = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Start server
const PORT = process.env.PORT || 1234;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
});