/**
 * Socket utility functions for handling connections and events
 * @module socketUtils
 */

const logger = require('./logger');

/**
 * Emit a status update to a specific room
 * @param {object} io - Socket.IO server instance
 * @param {string} roomId - Room ID to emit to
 * @param {string} message - Status message to send
 * @param {string} type - Type of message (info, error, success)
 */
const emitStatusUpdate = (io, roomId, message, type = 'info') => {
  logger.debug('emitStatusUpdate called with:', { io: !!io, roomId, message, type });
  
  if (!io) {
    logger.error('Socket.IO instance is null or undefined');
    return;
  }
  
  if (typeof io.to !== 'function') {
    logger.error('Socket.IO instance does not have to() function');
    logger.error('Socket.IO instance type:', typeof io);
    logger.error('Socket.IO instance keys:', Object.keys(io));
    return;
  }

  if (!roomId) {
    logger.error('Room ID is required for status update');
    return;
  }

  const payload = {
    message,
    type,
    timestamp: new Date().toISOString()
  };

  logger.debug(`Emitting status update to room ${roomId}:`, payload);
  
  // Check how many sockets are in the room (using a more compatible approach)
  try {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room) {
      logger.debug(`Room ${roomId} has ${room.size} connected clients`);
    } else {
      logger.debug(`Room ${roomId} does not exist or has no clients`);
    }
  } catch (error) {
    logger.debug('Could not check room membership:', error.message);
  }
  
  io.to(roomId).emit('statusUpdate', payload);
  logger.debug('Status update emitted successfully');
};

/**
 * Handle socket connection with proper room joining
 * @param {object} socket - Socket.IO socket instance
 * @param {object} io - Socket.IO server instance
 */
const handleSocketConnection = (socket, io) => {
  logger.info('Socket.IO client connected:', socket.id);
  const roomId = socket.handshake.query.id;
  logger.info('Room ID from client:', roomId);

  // Join room if roomId is provided
  if (roomId) {
    logger.info('Client joining room:', roomId);
    socket.join(roomId);
    
    // Log room information after joining (with error handling)
    try {
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room) {
        logger.info(`Room ${roomId} now has ${room.size} connected clients`);
        logger.debug(`Client sockets in room ${roomId}:`, Array.from(room));
      } else {
        logger.info(`Room ${roomId} was created but appears to be empty`);
      }
    } catch (error) {
      logger.error('Error checking room membership after join:', error.message);
    }
    
    // Send confirmation to client
    emitStatusUpdate(io, roomId, `Connected to download session: ${roomId}`, 'success');
    
    // Send a test message to verify room joining
    emitStatusUpdate(io, roomId, 'Status updates are now active', 'info');
  } else {
    logger.info('Client connected without room ID');
    socket.emit('statusUpdate', {
      message: 'Connected to server (no session)',
      type: 'info',
      timestamp: new Date().toISOString()
    });
  }

  // Handle disconnect with reason
  socket.on('disconnect', (reason) => {
    logger.info('Socket.IO client disconnected:', socket.id, 'Reason:', reason);
    if (roomId) {
      logger.info('Client left room:', roomId);
      // Log room information after leaving (with error handling)
      try {
        const room = io.sockets.adapter.rooms.get(roomId);
        if (room) {
          logger.info(`Room ${roomId} now has ${room.size} connected clients`);
        } else {
          logger.info(`Room ${roomId} no longer exists`);
        }
      } catch (error) {
        logger.error('Error checking room membership after leave:', error.message);
      }
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    logger.error('Socket.IO client error:', error);
  });

  // Handle ping from client
  socket.on('ping', () => {
    logger.debug('Received ping from client:', socket.id);
    // Respond with pong
    socket.emit('pong');
  });
};

/**
 * Create a robust socket connection with reconnection handling
 * @param {object} io - Socket.IO server instance
 */
const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    handleSocketConnection(socket, io);
  });
};

module.exports = {
  emitStatusUpdate,
  handleSocketConnection,
  setupSocketHandlers
};
