import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, FileText, PlusCircle, HelpCircle, ChevronDown, ChevronRight, FormInput } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getDocuments } from '../services/document.service';
import { sendMessage, createChat } from '../services/chat.service';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const messagesEndRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const { user } = useAuth();
  const [groupedByUsers, setGroupedByUsers] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    Promise.all([fetchDocuments(), fetchCategories()]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await getDocuments(user?.role === 'admin' ? { all: true } : undefined);
      
      const processedDocs = docs.filter(doc => 
        doc.status === "processed" && doc.extractedData && Object.keys(doc.extractedData).length > 0
      );

      // First group by users with null check for uploadedBy
      const userGroups = processedDocs.reduce((acc, doc) => {
        // Skip documents with no uploader information
        if (!doc.uploadedBy) {
          return acc;
        }

        const uploaderId = doc.uploadedBy._id;
        const uploaderName = doc.uploadedBy.name || doc.uploadedBy.email || 'Unknown User';
        
        if (!acc[uploaderId]) {
          acc[uploaderId] = {
            uploaderName,
            categories: {}
          };
        }

        // Then group by form category within each user
        const category = doc.form_category || 'Other';
        if (!acc[uploaderId].categories[category]) {
          acc[uploaderId].categories[category] = [];
        }
        acc[uploaderId].categories[category].push(doc);
        
        return acc;
      }, {});

      setGroupedByUsers(userGroups);
      setDocuments(processedDocs);
    } catch (err) {
      setError("Failed to fetch documents");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data.categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
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
          selectedDocs.map(doc => `- ${doc.name || doc.originalname}`).join('\n')
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

  const handleDocumentSelect = (doc) => {
    if (currentChat) return;
    
    setSelectedDocs(prev => {
      const isSelected = prev.some(d => d._id === doc._id);
      const newSelection = isSelected 
        ? prev.filter(d => d._id !== doc._id)
        : [...prev, doc];
      
      // Log extracted data when document is selected
      if (!isSelected) {
        console.log('Selected Document Extracted Data:', doc.extractedData);
      }
      
      // Update suggested questions based on selected documents
      updateSuggestedQuestions(newSelection);
      
      return newSelection;
    });
  };

  const updateSuggestedQuestions = (selectedDocuments) => {
    const questions = new Set();
    
    selectedDocuments.forEach(doc => {
      categories.forEach(category => {
        category.documentTypes.forEach(docType => {
          if (docType.name.toLowerCase() === doc.type.toLowerCase()) {
            docType.questions?.forEach(question => {
              questions.add(question.text);
            });
          }
        });
      });
    });

    setSuggestedQuestions(Array.from(questions));
  };

  const handleQuestionClick = (question) => {
    setInput(question);
  };

  const handleNewChat = () => {
    setCurrentChat(null);
    setMessages([]);
    setSelectedDocs([]);
    setError(null);
  };

  const toggleSection = (uploaderId) => {
    setExpandedSections(prev => ({
      ...prev,
      [uploaderId]: !prev[uploaderId]
    }));
  };

  const handleCategorySelect = (category, docs) => {
    setSelectedCategory(selectedCategory === category ? null : category);
    
    // If opening a category, select all its documents
    if (selectedCategory !== category) {
      // Add all documents from this category to selectedDocs if not already selected
      const newDocs = docs.filter(doc => !selectedDocs.some(selected => selected._id === doc._id));
      
      // Log extracted data for all newly selected documents
      newDocs.forEach(doc => {
        console.log(`Extracted Data for ${doc.name || doc.originalname}:`, doc.extractedData);
      });
      
      setSelectedDocs([...selectedDocs, ...newDocs]);
    } else {
      // If closing the category, remove all its documents from selection
      setSelectedDocs(selectedDocs.filter(doc => !docs.some(catDoc => catDoc._id === doc._id)));
    }
  };

  const handleH1BFormFill = async () => {
    if (selectedDocs.length === 0) return;

    try {
      setLoading(true);
      
      const allExtractedData = selectedDocs.reduce((data, doc) => {
        if (doc.extractedData) {
          return [...data, doc.extractedData];
        }
        return data;
      }, []);

      const requestData = {
        extractedDataArray: allExtractedData
      };
      console.log('Sending request with data:', requestData);

      // Make request with blob response type
      const response = await api.post('/forms/process-extracted-data', requestData, {
        responseType: 'blob'
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'filled_form.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Show success message
      setSuccess('Form filled and downloaded successfully!');
    } catch (err) {
      console.error('Error processing form data:', err);
      setError('Failed to process form data');
    } finally {
      setLoading(false);
    }
  };

  const fillFormFields = (formFields) => {
    try {
      // Open the form in a new window or get existing window
      const formWindow = window.open('', 'h1bform');
      
      if (!formWindow) {
        throw new Error('Please allow popups and ensure the H1B form window is open');
      }

      // Wait for a short time to ensure the window is ready
      setTimeout(() => {
        // Get all input elements from the form window
        const allInputs = formWindow.document.querySelectorAll('input');
        console.log('Total inputs found in form window:', allInputs.length);

        // Log all inputs for debugging
        Array.from(allInputs).forEach((input, index) => {
          console.log(`Input ${index}:`, {
            type: input.type,
            value: input.value,
            id: input.id,
            name: input.name,
            parentElement: input.parentElement?.outerHTML
          });
        });

        // Find the name input fields
        const familyNameInput = Array.from(allInputs).find(input => {
          const parentText = input.parentElement?.textContent || '';
          return parentText.includes('Family Name') || parentText.includes('Last Name');
        });

        const givenNameInput = Array.from(allInputs).find(input => {
          const parentText = input.parentElement?.textContent || '';
          return parentText.includes('Given Name') || parentText.includes('First Name');
        });

        console.log('Found form fields:', {
          familyName: familyNameInput,
          givenName: givenNameInput
        });

        // Fill in the values if fields are found
        if (familyNameInput) {
          familyNameInput.value = formFields["Family Name (Last Name)"];
          familyNameInput.dispatchEvent(new Event('input', { bubbles: true }));
          familyNameInput.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('Filled Family Name:', formFields["Family Name (Last Name)"]);
        } else {
          console.warn('Family Name input field not found in form window');
        }

        if (givenNameInput) {
          givenNameInput.value = formFields["Given Name (First Name)"];
          givenNameInput.dispatchEvent(new Event('input', { bubbles: true }));
          givenNameInput.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('Filled Given Name:', formFields["Given Name (First Name)"]);
        } else {
          console.warn('Given Name input field not found in form window');
        }

        // Add visual feedback in the original window
        const feedbackMessage = document.createElement('div');
        feedbackMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        feedbackMessage.textContent = familyNameInput && givenNameInput 
          ? 'Form fields filled successfully!'
          : 'Some fields could not be filled. Please check the console for details.';
        document.body.appendChild(feedbackMessage);

        setTimeout(() => {
          feedbackMessage.remove();
        }, 3000);
      }, 1000); // Wait 1 second for the window to be ready

    } catch (error) {
      console.error('Error filling form fields:', error);
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorMessage.textContent = error.message || 'Error filling form fields. Please check console for details.';
      document.body.appendChild(errorMessage);

      setTimeout(() => {
        errorMessage.remove();
      }, 3000);
    }
  };

  const renderFormActions = () => {
    if (formData) {
      return (
        <div className="mt-4 space-y-2">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-sm font-medium text-green-800 mb-2">AI Extracted Information:</h3>
            <p className="text-sm text-green-700">
              Name: {formData.firstName} {formData.lastName}
            </p>
          </div>
          <button
            onClick={handleH1BFormFill}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
          >
            <FormInput className="w-4 h-4" />
            {loading ? 'Generating PDF...' : 'Download Filled Form'}
          </button>
        </div>
      );
    }
    return null;
  };

  if (loading && documents.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-full flex">
        {/* Document List Sidebar */}
        <div className="w-80 border-r bg-white flex flex-col h-screen sticky top-0">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Available Documents</h2>
                <p className="text-sm text-gray-500">Select user and category to view documents</p>
              </div>

              {/* Users List */}
              <div className="space-y-2">
                {Object.entries(groupedByUsers).map(([userId, { uploaderName, categories }]) => (
                  <div key={userId} className="border rounded-lg overflow-hidden">
                    {/* User Header with Toggle */}
                    <button
                      onClick={() => {
                        toggleSection(userId);
                        setSelectedUser(selectedUser === userId ? null : userId);
                        setSelectedCategory(null);
                      }}
                      className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h3 className="text-sm font-medium text-gray-900">
                        {uploaderName}
                        <span className="ml-2 text-xs text-gray-500">
                          ({Object.values(categories).flat().length} documents)
                        </span>
                      </h3>
                      {expandedSections[userId] ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {/* Categories for Selected User */}
                    {expandedSections[userId] && (
                      <div className="p-2 space-y-2 bg-white">
                        {Object.entries(categories).map(([category, docs]) => (
                          <div key={category} className="border rounded-lg overflow-hidden">
                            <button
                              onClick={() => handleCategorySelect(category, docs)}
                              className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50"
                            >
                              <span className="text-sm font-medium text-gray-700">
                                {category}
                                <span className="ml-2 text-xs text-gray-500">
                                  ({docs.length})
                                </span>
                              </span>
                              {selectedCategory === category ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                            </button>

                            {/* Documents for Selected Category */}
                            {selectedCategory === category && (
                              <div className="p-2 space-y-2 bg-gray-50">
                                {docs.map((doc) => (
                                  <div
                                    key={doc._id}
                                    onClick={() => handleDocumentSelect(doc)}
                                    className={`p-3 rounded-lg cursor-pointer border transition-all ${
                                      selectedDocs.some(d => d._id === doc._id)
                                        ? 'bg-primary-50 border-primary-500'
                                        : 'bg-white border-gray-200 hover:border-primary-300'
                                    } ${currentChat ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm font-medium text-gray-700 truncate">
                                        {doc.name || doc.originalname}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">
                                      Type: {doc.type || 'other'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {Object.keys(groupedByUsers).length === 0 && (
                  <div className="text-center p-4 text-gray-500 text-sm">
                    No documents available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Buttons Section */}
          {!currentChat && (
            <div className="sticky bottom-0 p-4 border-t bg-white space-y-2 shadow-md">
              {/* Process Documents Button */}
              <button
                onClick={handleH1BFormFill}
                disabled={selectedDocs.length === 0 || loading}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  selectedDocs.length === 0 || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                {loading ? 'PROCESSING...' : 'PROCESS DOCUMENTS'}
              </button>

              {/* Render Form Actions (including Fill Form button) */}
              {renderFormActions()}

              {/* Start Chat Button */}
              <button
                onClick={handleStartChat}
                disabled={selectedDocs.length === 0 || loading}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDocs.length === 0 || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  `Start Chat with ${selectedDocs.length} Document${selectedDocs.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50 relative">
          {/* New Chat Button */}
          {currentChat && (
            <button
              onClick={handleNewChat}
              className="absolute top-4 right-4 flex items-center px-3 py-2 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors z-10"
            >
              <PlusCircle className="w-4 h-4 text-primary-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">New Chat</span>
            </button>
          )}

          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {!currentChat ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select documents and start a chat to begin
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-4 mt-12">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white shadow-sm border border-gray-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Suggested Questions */}
              {suggestedQuestions.length > 0 && (
                <div className="border-t border-gray-200 bg-white p-4">
                  <div className="max-w-3xl mx-auto">
                    <div className="flex items-center mb-2">
                      <HelpCircle className="w-4 h-4 text-primary-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Suggested Questions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuestionClick(question)}
                          className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t bg-white p-4">
                <div className="max-w-3xl mx-auto">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about your selected documents..."
                      className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loading}
                      className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIChat; 