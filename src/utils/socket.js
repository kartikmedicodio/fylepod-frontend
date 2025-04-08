import { io } from 'socket.io-client';


const API_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5001';

console.log('Original API_URL:', API_URL);

// Properly parse the URL to ensure WebSocket connections work correctly
const parseSocketURL = (url) => {
  try {
    console.log('Parsing URL:', url);
    
    // Hardcoded fix for production URL
    if (url === 'https://api-dev.relayzen.com/api' || 
        url === 'https://api-dev.relayzen.com' ||
        url.includes('api-dev.relayzen.com')) {
      console.log('Using hardcoded production hostname');
      return 'api-dev.relayzen.com';
    }
    
    // For local development or other environments
    if (url.includes('localhost')) {
      console.log('Using localhost hostname');
      return 'localhost:5001';
    }
    
    // Manual hostname extraction as a fallback
    let hostname = url.replace('https://', '').replace('http://', '');
    
    // Remove any paths
    const slashIndex = hostname.indexOf('/');
    if (slashIndex !== -1) {
      hostname = hostname.substring(0, slashIndex);
    }
    
    console.log('Manually extracted hostname:', hostname);
    return hostname;
  } catch (error) {
    console.error('Error parsing socket URL:', error);
    // Last resort fallback
    return 'api-dev.relayzen.com';
  }
};

const SOCKET_URL = parseSocketURL(API_URL);
console.log('Final Socket URL:', SOCKET_URL);

// Singleton socket instance
let socket = null;

// Keep track of rooms we've joined
let joinedRooms = [];

// Keep track of the token to handle authentication updates
let currentToken = null;

// Initialize socket connection
export const initializeSocket = (token) => {
  // If token has changed, disconnect existing socket
  if (socket && currentToken && token !== currentToken) {
    console.log('Auth token changed, reconnecting socket with new token');
    socket.disconnect();
    socket = null;
  }
  
  // Update the current token
  currentToken = token;
  
  // If socket already exists and is connected, return it
  if (socket) {
    if (socket.connected) {
      console.log('Reusing existing socket connection:', socket.id);
      return socket;
    } else {
      console.log('Socket exists but disconnected, reconnecting...');
      socket.connect();
      return socket;
    }
  }

  // Create new socket connection with correct namespace configuration
  console.log('Creating new socket connection with token to:', `${SOCKET_URL}/documents`);
  
  let socketConfig = {
    auth: { token },
    transports: ['websocket', 'polling'], // Add polling as fallback
    autoConnect: true,
    path: '/socket.io',
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000
  };
  
  // Production environment connection
  if (SOCKET_URL === 'api-dev.relayzen.com') {
    console.log('Using production socket configuration');
    socket = io('https://api-dev.relayzen.com/documents', {
      ...socketConfig,
      path: '/socket.io'
    });
  } else {
    // Local or other environment connection
    socket = io(`${SOCKET_URL}/documents`, socketConfig);
  }

  // Setup event listeners
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    
    // When socket reconnects, rejoin all rooms
    if (joinedRooms.length > 0) {
      console.log(`Rejoining ${joinedRooms.length} rooms after connection`);
      joinedRooms.forEach(room => {
        socket.emit('join-document-room', { documentId: room });
      });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    
    // If the server disconnected us, try to reconnect
    if (reason === 'io server disconnect') {
      console.log('Server disconnected the socket, attempting to reconnect...');
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

// Get the socket instance
export const getSocket = () => socket;

// Connect to a specific document room
export const joinDocumentRoom = (documentId) => {
  if (!socket) {
    console.error('Socket not initialized. Cannot join room.');
    return;
  }
  
  if (!socket.connected) {
    console.warn('Socket not connected. Room will be joined when connection is established.');
    // Still add to joined rooms so we can join when connected
  }
  
  // Don't add duplicate rooms
  if (!joinedRooms.includes(documentId)) {
    joinedRooms.push(documentId);
    console.log(`Added document room ${documentId} to join queue. Total rooms: ${joinedRooms.length}`);
  }
  
  if (socket.connected) {
    socket.emit('join-document-room', { documentId });
    console.log(`Joined document room: ${documentId}`);
  }
};

// Handle socket reconnection
export const handleReconnect = () => {
  if (!socket) return;
  
  // Setup reconnection handling
  socket.on('reconnect', (attemptNumber) => {
    console.log(`Socket reconnected after ${attemptNumber} attempts, rejoining rooms...`);
    
    // Rejoin all rooms
    joinedRooms.forEach(room => {
      socket.emit('join-document-room', { documentId: room });
      console.log(`Rejoined document room: ${room}`);
    });
  });
};

// Disconnect socket - only use this when the app is shutting down or logging out
export const disconnectSocket = () => {
  if (socket) {
    console.log('Manually disconnecting socket and clearing room state');
    socket.disconnect();
    joinedRooms = []; // Clear joined rooms on disconnect
    socket = null;
    currentToken = null;
  }
};

export default {
  initializeSocket,
  getSocket,
  joinDocumentRoom,
  handleReconnect,
  disconnectSocket
}; 
