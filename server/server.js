// server.js — Entry point for the Zoar backend server.
// Responsibilities:
//   1. Load environment variables from .env
//   2. Connect to MongoDB via db.js
//   3. Create an HTTP server from the Express app
//   4. Attach Socket.io to the HTTP server for real-time features
//   5. Start listening on the configured port

require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./src/config/db');
const app = require('./src/app');

// Connect to MongoDB Atlas
connectDB();

// Wraping express app in a native HTTP server so Socket.io can share the same port
const server = http.createServer(app);

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

// Allowing the expense controller to emit events
app.set('io', io);

// Socket.io connection handler
// Each new browser tab / device that connects gets a unique socket.id
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
