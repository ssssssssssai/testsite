// Initialize Socket.IO
const socket = io();

// Function to append messages to the chat box
function appendMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.innerText = message;
  document.getElementById('messages').appendChild(messageElement);
}

// Function to send a chat message
function sendMessage() {
  const message = document.getElementById('message-input').value;
  appendMessage(`You: ${message}`);
  socket.emit('chat message', message);
  document.getElementById('message-input').value = '';
}

// Event listener for receiving chat messages from the server
socket.on('chat message', (message) => {
  appendMessage(`Stranger: ${message}`);
});

// Event listener for receiving chat pairing notifications
socket.on('chat paired', (strangerId) => {
  appendMessage('You are now connected to a new stranger.');
});

// Event listener for receiving chat ended notifications
socket.on('chat ended', () => {
  appendMessage('The chat has ended. Press "Skip" to connect to a new stranger.');
});

// Event listener for receiving stranger connected notifications after skip
socket.on('stranger connected', (strangerId) => {
  appendMessage('You are now connected to a new stranger.');
});

// Event listener for receiving no available users notifications
socket.on('no available users', () => {
  appendMessage('No available users to connect to. Please try again later.');
});

// Event listener for the send button
document.getElementById('send-button').addEventListener('click', () => {
  sendMessage();
});

// Event listener for the skip button
document.getElementById('skip-button').addEventListener('click', () => {
  socket.emit('skip');
});
