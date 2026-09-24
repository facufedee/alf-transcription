import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = parseInt(process.env.BACKEND_PORT || '5000', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const server = app.listen(port, () => {
  console.log(`✨ ALF Backend running on http://localhost:${port}`);
});

// WebSocket setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// WebSocket event handlers
io.on('connection', (socket) => {
  console.log(`📡 Client connected: ${socket.id}`);

  // Client subscribes to a session
  socket.on('subscribe', (data: { sessionId: string; language: string }) => {
    socket.join(`session_${data.sessionId}_${data.language}`);
    console.log(
      `👤 ${socket.id} subscribed to ${data.sessionId} (${data.language})`
    );
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
