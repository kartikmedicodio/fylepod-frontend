import { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider, Paper, TextField, Button, CircularProgress, Grid, Avatar, Chip, Tabs, Tab } from '@mui/material';
import { Send as SendIcon, Person as PersonIcon, Folder as FolderIcon } from '@mui/icons-material';
import api from '../utils/api';
import { format } from 'date-fns';

const AiQueries = () => {
  // State for data
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState({
    clients: false,
    cases: false,
    chats: false,
    sending: false
  });

  // Fetch initial data
  useEffect(() => {
    fetchClients();
  }, []);

  // Fetch cases when client is selected
  useEffect(() => {
    if (selectedClient) {
      fetchCases(selectedClient._id);
    } else {
      setCases([]);
      setSelectedCase(null);
      setChats([]);
      setSelectedChat(null);
    }
  }, [selectedClient]);

  // Fetch chats when case is selected
  useEffect(() => {
    if (selectedCase) {
      fetchChats(selectedCase._id);
    } else {
      setChats([]);
      setSelectedChat(null);
    }
  }, [selectedCase]);

  // Data fetching functions
  const fetchClients = async () => {
    setLoading(prev => ({ ...prev, clients: true }));
    try {
      const response = await api.get('/auth/users');
      setClients(response.data.data.users);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(prev => ({ ...prev, clients: false }));
    }
  };

  const fetchCases = async (userId) => {
    setLoading(prev => ({ ...prev, cases: true }));
    try {
      const response = await api.get(`/management/user/${userId}`);
      setCases(response.data.data.entries);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(prev => ({ ...prev, cases: false }));
    }
  };

  const fetchChats = async (managementId) => {
    setLoading(prev => ({ ...prev, chats: true }));
    try {
      const response = await api.get(`/chat/management/${managementId}`);
      setChats(response.data.data.chats || []);
      // Select the most recent chat by default
      if (response.data.data.chats?.length > 0) {
        setSelectedChat(response.data.data.chats[0]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(prev => ({ ...prev, chats: false }));
    }
  };

  // Handle sending message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedCase) return;
    
    setLoading(prev => ({ ...prev, sending: true }));
    try {
      const response = await api.post(`/chat/${selectedCase._id}/messages`, {
        message: newMessage
      });
      // Refresh chats after sending message
      fetchChats(selectedCase._id);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', p: 2, gap: 2 }}>
      {/* Clients Column */}
      <Paper sx={{ width: '25%', overflow: 'auto' }}>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6">Clients</Typography>
        </Box>
        <Divider />
        {loading.clients ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {clients.map((client) => (
              <ListItem 
                key={client._id} 
                button 
                selected={selectedClient?._id === client._id}
                onClick={() => setSelectedClient(client)}
              >
                <Avatar sx={{ mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <ListItemText 
                  primary={client.name} 
                  secondary={client.email} 
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Cases Column */}
      <Paper sx={{ width: '25%', overflow: 'auto' }}>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6">Cases</Typography>
        </Box>
        <Divider />
        {loading.cases ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : selectedClient ? (
          <List>
            {cases.map((caseItem) => (
              <ListItem 
                key={caseItem._id} 
                button 
                selected={selectedCase?._id === caseItem._id}
                onClick={() => setSelectedCase(caseItem)}
              >
                <Avatar sx={{ mr: 2 }}>
                  <FolderIcon />
                </Avatar>
                <ListItemText 
                  primary={caseItem.categoryName} 
                  secondary={
                    <Box>
                      <Typography variant="body2" component="span">
                        Status: {caseItem.categoryStatus}
                      </Typography>
                      {caseItem.deadline && (
                        <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                          Deadline: {format(new Date(caseItem.deadline), 'MMM dd, yyyy')}
                        </Typography>
                      )}
                    </Box>
                  } 
                />
                <Chip 
                  label={caseItem.categoryStatus} 
                  color={
                    caseItem.categoryStatus === 'completed' ? 'success' : 
                    caseItem.categoryStatus === 'pending' ? 'warning' : 'info'
                  }
                  size="small"
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Select a client to view their cases
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Chat Column */}
      <Paper sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6">
            {selectedCase ? `Chat: ${selectedCase.categoryName}` : 'Chat'}
          </Typography>
        </Box>
        <Divider />
        
        {/* Chat Selection Tabs */}
        {selectedCase && chats.length > 0 && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={selectedChat?._id || ''} 
              onChange={(e, newValue) => {
                const chat = chats.find(c => c._id === newValue);
                setSelectedChat(chat);
              }}
              variant="scrollable"
              scrollButtons="auto"
            >
              {chats.map((chat) => (
                <Tab 
                  key={chat._id}
                  label={format(new Date(chat.createdAt), 'MMM dd, HH:mm')}
                  value={chat._id}
                />
              ))}
            </Tabs>
          </Box>
        )}
        
        {/* Chat Messages */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {loading.chats ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : selectedCase ? (
            selectedChat?.messages?.length > 0 ? (
              selectedChat.messages.map((message, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2
                  }}
                >
                  <Paper 
                    sx={{ 
                      p: 2, 
                      maxWidth: '70%',
                      bgcolor: message.role === 'user' ? 'primary.light' : 'grey.100',
                      color: message.role === 'user' ? 'white' : 'text.primary'
                    }}
                  >
                    <Typography variant="body1">
                      {message.content}
                    </Typography>
                  </Paper>
                </Box>
              ))
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No messages yet. Start a conversation!
                </Typography>
              </Box>
            )
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Select a case to view the chat
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Message Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Grid container spacing={1}>
            <Grid item xs>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!selectedCase || loading.sending}
              />
            </Grid>
            <Grid item>
              <Button 
                variant="contained" 
                color="primary" 
                endIcon={<SendIcon />}
                onClick={sendMessage}
                disabled={!newMessage.trim() || !selectedCase || loading.sending}
              >
                {loading.sending ? <CircularProgress size={24} /> : 'Send'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default AiQueries;
