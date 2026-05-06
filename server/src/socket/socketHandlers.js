function registerSocketHandlers(io) {
    io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);
  
      socket.on('join', (userId) => {
        const roomId = `room_${userId.toString()}`;
        socket.join(roomId);
        console.log(`User ${roomId} joined room`);
      });
  
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }
  
  module.exports = registerSocketHandlers;