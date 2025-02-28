const errorHandler = (socket, handler) => {
    return async (...args) => {
      try {
        await handler(...args);
      } catch (error) {
        console.error('Socket error:', error);
        socket.emit('error', { message: 'Internal server error' });
      }
    };
  };

module.exports = errorHandler;