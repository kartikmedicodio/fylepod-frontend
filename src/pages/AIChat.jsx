import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, FileText } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getDocuments } from '../services/document.service';
import { sendMessage, createChat } from '../services/chat.service';

const AIChat = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchDocuments = async () => {
    try {
      const docs = await getDocuments();
      // Only show processed documents with extracted data
      const processedDocs = docs.filter(doc => 
        doc.status === "processed" && doc.extractedData && Object.keys(doc.extractedData).length > 0
      );
      setDocuments(processedDocs);
    } catch (err) {
      setError("Failed to fetch documents");
      console.error(err);
    }
  };

  const handleStartChat = async () => {
    if (selectedDocs.length === 0) {
      setError("Please select at least one document");
      return;
    }

    try {
      setLoading(true);
      const chat = await createChat(selectedDocs.map(doc => doc._id));
      setCurrentChat(chat);
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm here to help you with questions about your selected documents:\n${
          selectedDocs.map(doc => `- ${doc.name} (${doc.type})`).join('\n')
        }\nWhat would you like to know?`
      }]);
      setError(null);
    } catch (err) {
      setError("Failed to start chat");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentChat || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    try {
      setLoading(true);
      const response = await sendMessage(currentChat._id, input);
      setMessages(prev => [...prev, response]);
    } catch (err) {
      setError("Failed to send message");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-full flex">
        {/* Document Selection Sidebar */}
        <div className="w-80 border-r bg-white p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
            <p className="text-sm text-gray-500">Select documents to chat about</p>
          </div>

          <div className="space-y-2">
            {documents.map(doc => (
              <div
                key={doc._id}
                onClick={() => {
                  if (!currentChat) {
                    setSelectedDocs(prev => {
                      const isSelected = prev.some(d => d._id === doc._id);
                      return isSelected 
                        ? prev.filter(d => d._id !== doc._id)
                        : [...prev, doc];
                    });
                  }
                }}
                className={`p-3 rounded-lg cursor-pointer flex items-center space-x-3 ${
                  selectedDocs.some(d => d._id === doc._id)
                    ? 'bg-primary-50 border border-primary-200'
                    : 'hover:bg-gray-50 border border-transparent'
                } ${currentChat ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FileText className="h-5 w-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-500">{doc.type}</p>
                </div>
              </div>
            ))}
          </div>

          {!currentChat && (
            <button
              onClick={handleStartChat}
              disabled={selectedDocs.length === 0 || loading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Chat
            </button>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {currentChat ? (
            <>
              {/* Messages */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-2xl rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question about your documents..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select documents and start a chat to begin
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIChat; 