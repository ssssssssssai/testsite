const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Store connected users
const users = {};

// Store active user pairs (one-on-one chats)
const activeChats = {};

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Store the user's socket ID
  users[socket.id] = socket;

  // Find another available user to pair with for chat
  const availableUser = Object.keys(users).find(id => id !== socket.id && !activeChats[id]);

  if (availableUser) {
    // Pair the users for chat
    activeChats[socket.id] = availableUser;
    activeChats[availableUser] = socket.id;

    // Notify both users that they are paired for chat
    socket.emit('chat paired', availableUser);
    users[availableUser].emit('chat paired', socket.id);
  } else {
    // Notify the user that no available users are found
    socket.emit('no available users');
  }

  // Listen for chat messages from the client
  socket.on('chat message', (message) => {
    const pairedUser = activeChats[socket.id];
    if (pairedUser) {
      // Emit the message to the paired user
      users[pairedUser].emit('chat message', message);
    }
  });

  // Listen for skip requests from the client
  socket.on('skip', () => {
    const pairedUser = activeChats[socket.id];
    if (pairedUser) {
      // Notify both users that the chat is ending
      socket.emit('chat ended');
      users[pairedUser].emit('chat ended');

      // Remove both users from active chats
      delete activeChats[socket.id];
      delete activeChats[pairedUser];

      // Find another available user to pair with for chat
      const newAvailableUser = Object.keys(users).find(id => id !== socket.id && !activeChats[id]);

      if (newAvailableUser) {
        // Pair the users for chat with a new stranger
        activeChats[socket.id] = newAvailableUser;
        activeChats[newAvailableUser] = socket.id;

        // Notify both users that they are paired for chat with a new stranger
        socket.emit('stranger connected', newAvailableUser);
        users[newAvailableUser].emit('stranger connected', socket.id);
      } else {
        // Notify the user that no available users are found
        socket.emit('no available users');
      }
    }
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete users[socket.id];

    // Check if the disconnected user was part of an active chat
    const pairedUser = activeChats[socket.id];
    if (pairedUser) {
      // Notify the paired user that the chat has ended
      users[pairedUser].emit('chat ended');
      delete activeChats[socket.id];
      delete activeChats[pairedUser];
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
