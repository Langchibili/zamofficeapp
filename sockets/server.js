// sockets/server.js
const { createServer } = require("http");
const { Server } = require("socket.io");

let clienturls, environment;

// Environment configuration
environment = 'local';
// environment = 'live';
// environment = 'test';

if (environment === 'local') {
  clienturls = [
    'http://localhost:8080',
    'http://localhost:1330',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
} else if (environment === 'live') {
  clienturls = ['https://zamoffice.app', 'http://zamoffice.app'];
} else if (environment === 'test') {
  clienturls = ['https://test.zamoffice.app', 'http://test.zamoffice.app'];
} else {
  clienturls = ['https://zamoffice.app', 'http://zamoffice.app'];
}

const httpServer = createServer();
const allowedOrigins = clienturls;
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins
  }
});

// Connection tracking
const connections = {
  clients: new Map(), // clientId -> socket.id
  companies: new Map(), // companyId -> socket.id
  agents: new Map(), // agentId -> socket.id
  sockets: new Map() // socket.id -> { type, id }
};

// Helper: Get socket by entity
function getSocketByEntity(type, entityId) {
  const map = type === 'client' ? connections.clients : 
              type === 'company' ? connections.companies : 
              connections.agents;
  const socketId = map.get(entityId);
  return socketId ? io.sockets.sockets.get(socketId) : null;
}

// Helper: Broadcast to room with fallback
function emitToRoom(room, event, data) {
  io.to(room).emit(event, data);
  console.log(`[Socket] Emitted '${event}' to room '${room}'`);
}

io.on("connection", (socket) => {
  console.log(`[Socket] New connection: ${socket.id}`);

  // ==================== CONNECTION MANAGEMENT ====================

  // Client joins
  socket.on('client:join', (data) => {
    const { clientId } = data;
    if (!clientId) return;

    // Store connection
    connections.clients.set(clientId, socket.id);
    connections.sockets.set(socket.id, { type: 'client', id: clientId });

    // Join personal room
    socket.join(`client:${clientId}`);
    
    console.log(`[Socket] Client ${clientId} joined (socket: ${socket.id})`);
    
    // Acknowledge connection
    socket.emit('client:connected', { clientId, socketId: socket.id });
  });

  // Company joins
  socket.on('company:join', (data) => {
    const { companyId } = data;
    if (!companyId) return;

    connections.companies.set(companyId, socket.id);
    connections.sockets.set(socket.id, { type: 'company', id: companyId });

    socket.join(`company:${companyId}`);
    
    console.log(`[Socket] Company ${companyId} joined (socket: ${socket.id})`);
    
    socket.emit('company:connected', { companyId, socketId: socket.id });
  });

  // Agent joins
  socket.on('agent:join', (data) => {
    const { agentId } = data;
    if (!agentId) return;

    connections.agents.set(agentId, socket.id);
    connections.sockets.set(socket.id, { type: 'agent', id: agentId });

    socket.join(`agent:${agentId}`);
    
    console.log(`[Socket] Agent ${agentId} joined (socket: ${socket.id})`);
    
    socket.emit('agent:connected', { agentId, socketId: socket.id });
  });

  // ==================== QUEUE MANAGEMENT ====================

  // Client watches a company queue
  socket.on('queue:watch', (data) => {
    const { companyId } = data;
    if (!companyId) return;

    socket.join(`queue:${companyId}`);
    console.log(`[Socket] ${socket.id} watching queue:${companyId}`);
  });

  // Client stops watching a company queue
  socket.on('queue:unwatch', (data) => {
    const { companyId } = data;
    if (!companyId) return;

    socket.leave(`queue:${companyId}`);
    console.log(`[Socket] ${socket.id} stopped watching queue:${companyId}`);
  });

  // From Strapi: Queue updated
  socket.on('queue:updated', (data) => {
    const { companyId, queue } = data;
    emitToRoom(`queue:${companyId}`, 'queue:updated', queue);
  });

  // From Strapi: Client position changed
  socket.on('queue:position', (data) => {
    const { clientId, position, companyId } = data;
    emitToRoom(`client:${clientId}`, 'queue:position', { position, companyId });
  });

  // From Strapi: Client bound to company
  socket.on('queue:bound', (data) => {
    const { clientId, companyId } = data;
    emitToRoom(`client:${clientId}`, 'queue:bound', { companyId });
    emitToRoom(`company:${companyId}`, 'queue:client-bound', { clientId });
  });

  // ==================== PRINT STATUS UPDATES ====================

  // From Strapi: Print created
  socket.on('print:created', (data) => {
    const { printId, clientId, companyId } = data;
    emitToRoom(`client:${clientId}`, 'print:created', data);
    emitToRoom(`company:${companyId}`, 'print:created', data);
  });

  // From Strapi: Print queued
  socket.on('print:queued', (data) => {
    const { printId, clientId, companyId } = data;
    emitToRoom(`client:${clientId}`, 'print:queued', data);
    emitToRoom(`company:${companyId}`, 'print:queued', data);
  });

  // From Strapi: Print scheduled
  socket.on('print:scheduled', (data) => {
    const { printId, clientId, companyId, scheduledTime } = data;
    emitToRoom(`client:${clientId}`, 'print:scheduled', data);
    emitToRoom(`company:${companyId}`, 'print:scheduled', data);
  });

  // From Strapi: Print started
  socket.on('print:printing', (data) => {
    const { printId, clientId, companyId } = data;
    emitToRoom(`client:${clientId}`, 'print:printing', data);
    emitToRoom(`company:${companyId}`, 'print:printing', data);
  });

  // From Strapi: Print completed
  socket.on('print:completed', (data) => {
    const { printId, clientId, companyId } = data;
    emitToRoom(`client:${clientId}`, 'print:completed', data);
    emitToRoom(`company:${companyId}`, 'print:completed', data);
  });

  // From Strapi: Print canceled
  socket.on('print:canceled', (data) => {
    const { printId, clientId, companyId, reason } = data;
    emitToRoom(`client:${clientId}`, 'print:canceled', data);
    emitToRoom(`company:${companyId}`, 'print:canceled', data);
  });

  // ==================== COMPANY UPDATES ====================

  // Company status update (online/offline)
  socket.on('company:status-update', (data) => {
    const { companyId, status } = data;
    // Broadcast to all watchers of this company's queue
    emitToRoom(`queue:${companyId}`, 'company:status-changed', { companyId, status });
  });

  // From Strapi: Float balance low warning
  socket.on('company:float-low', (data) => {
    const { companyId, balance, threshold } = data;
    emitToRoom(`company:${companyId}`, 'company:float-low', { balance, threshold });
  });

  // From Strapi: Float depleted
  socket.on('company:float-depleted', (data) => {
    const { companyId } = data;
    emitToRoom(`company:${companyId}`, 'company:float-depleted', data);
    // Broadcast to queue watchers
    emitToRoom(`queue:${companyId}`, 'company:unavailable', { companyId, reason: 'float_depleted' });
  });

  // From Strapi: Float topped up
  socket.on('company:float-topped-up', (data) => {
    const { companyId, newBalance } = data;
    emitToRoom(`company:${companyId}`, 'company:float-topped-up', { newBalance });
  });

  // ==================== CLIENT UPDATES ====================

  // Client location update
  socket.on('client:location-update', (data) => {
    const { clientId, location } = data;
    console.log(`[Socket] Client ${clientId} location updated:`, location);
    // Could broadcast to relevant companies if needed
  });

  // From Strapi: Order ready for pickup
  socket.on('client:order-ready', (data) => {
    const { clientId, printId } = data;
    emitToRoom(`client:${clientId}`, 'client:order-ready', data);
  });

  // ==================== AGENT UPDATES ====================

  // From Strapi: Commission earned
  socket.on('agent:commission-earned', (data) => {
    const { agentId, amount, printId, companyId } = data;
    emitToRoom(`agent:${agentId}`, 'agent:commission-earned', data);
  });

  // From Strapi: New company referred
  socket.on('agent:company-referred', (data) => {
    const { agentId, companyId } = data;
    emitToRoom(`agent:${agentId}`, 'agent:company-referred', data);
  });

  // ==================== LEGACY CHAT (kept for backward compatibility) ====================

  socket.on('msgfor', (data) => {
    io.emit('msgfor' + data.uid, data);
  });

  // ==================== DISCONNECTION ====================

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    
    // Clean up connection tracking
    const entityInfo = connections.sockets.get(socket.id);
    if (entityInfo) {
      const { type, id } = entityInfo;
      if (type === 'client') connections.clients.delete(id);
      else if (type === 'company') connections.companies.delete(id);
      else if (type === 'agent') connections.agents.delete(id);
      
      connections.sockets.delete(socket.id);
      console.log(`[Socket] Cleaned up ${type} ${id}`);
    }
  });

  // ==================== HEARTBEAT / PING ====================

  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
});

// Health check endpoint (optional, can be accessed via HTTP)
httpServer.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      connections: {
        clients: connections.clients.size,
        companies: connections.companies.size,
        agents: connections.agents.size,
        total: connections.sockets.size
      },
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
  console.log(`[Socket Server] Listening on port ${PORT}`);
  console.log(`[Socket Server] Environment: ${environment}`);
  console.log(`[Socket Server] Allowed origins:`, allowedOrigins);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Socket Server] SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('[Socket Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Socket Server] SIGINT received, closing server...');
  httpServer.close(() => {
    console.log('[Socket Server] Server closed');
    process.exit(0);
  });
});