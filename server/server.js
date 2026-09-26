// server.js - Entry point for the Gecko backend server.
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
const logger = require('./src/utils/logger');
const { startNewsletterScheduler } = require('./src/jobs/newsletterJob');

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
const registerSocketHandlers = require('./src/socket/socketHandlers');

registerSocketHandlers(io);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server running');
  startNewsletterScheduler();
});
