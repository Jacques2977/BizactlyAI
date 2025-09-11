import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Menu, MessageSquare } from 'lucide-react';
import { sendMessage } from '../api/chat';
import { useConversations } from '../hooks/useConversations';
import { ConversationSidebar } from './ConversationSidebar';
import { MessageBubble } from './MessageBubble';
import { ChatMessage } from '../types/conversation';

interface ChatInterfaceProps {
  onClose: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose }) => {
  const {
    currentConversation,
    createNewConversation,
    loadConversation,
    addMessageToConversation,
    deleteConversation,
    getConversationSummaries,
    getConversationContext
  } = useConversations();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a new conversation if none exists
  useEffect(() => {
    if (!currentConversation) {
      createNewConversation();
    }
  }, []);

  // Update local messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      setMessages(currentConversation.messages);
    }
  }, [currentConversation]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const parseStructuredResponse = (content: string) => {
    const sections = {
      summary: '',
      insights: '',
      steps: '',
      tip: '',
      questions: '',
      progress: ''
    };

    // Split content by section headers
    const summaryMatch = content.match(/\*\*📋 SUMMARY\*\*(.*?)(?=\*\*🎯|$)/s);
    const insightsMatch = content.match(/\*\*🎯 KEY INSIGHTS\*\*(.*?)(?=\*\*📊|$)/s);
    const stepsMatch = content.match(/\*\*📊 ACTIONABLE STEPS\*\*(.*?)(?=\*\*💡|🚀|$)/s);
    const tipMatch = content.match(/\*\*💡 EXPERT TIP\*\*(.*?)(?=\*\*❓|🚀|$)/s);
    const questionsMatch = content.match(/\*\*❓ FOLLOW-UP QUESTIONS\*\*(.*?)(?=\*\*🚀|$)/s);
    const progressMatch = content.match(/\*\*🚀 PROGRESS TRACKER\*\*(.*?)$/s);

    sections.summary = summaryMatch ? summaryMatch[1].trim() : '';
    sections.insights = insightsMatch ? insightsMatch[1].trim() : '';
    sections.steps = stepsMatch ? stepsMatch[1].trim() : '';
    sections.tip = tipMatch ? tipMatch[1].trim() : '';
    sections.questions = questionsMatch ? questionsMatch[1].trim() : '';
    sections.progress = progressMatch ? progressMatch[1].trim() : '';

    return sections;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    if (!currentConversation) return;

    const currentInput = inputMessage;
    setInputMessage('');

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: currentInput,
      sender: 'user',
      timestamp: new Date(),
    };

    // Add user message to local state immediately for instant UI update
    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to conversation storage
    addMessageToConversation(currentConversation.id, userMessage);

    setIsLoading(true);

    try {
      // Get conversation context for continuity
      const context = getConversationContext(currentConversation.id);
      const messageWithContext = context 
        ? `Previous conversation context:\n${context}\n\nCurrent message: ${currentInput}`
        : currentInput;
      
      const response = await sendMessage(messageWithContext);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'bot',
        timestamp: new Date(),
      };

      // Start streaming effect
      setStreamingMessageId(botMessage.id);

      // Add bot message to local state immediately
      setMessages(prev => [...prev, botMessage]);
      
      // Save bot message to conversation storage
      addMessageToConversation(currentConversation.id, botMessage);
      
      // Stop streaming after message is fully displayed
      setTimeout(() => {
        setStreamingMessageId(null);
      }, response.length * 20 + 500); // Match streaming speed + buffer
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please make sure your OpenAI API key is configured correctly in your .env file.',
        sender: 'bot',
        timestamp: new Date(),
      };
      
      // Add error message to local state immediately
      setMessages(prev => [...prev, errorMessage]);
      
      // Save error message to conversation storage
      addMessageToConversation(currentConversation.id, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    createNewConversation();
    setIsSidebarOpen(false);
  };

  const handleSelectConversation = (conversationId: string) => {
    loadConversation(conversationId);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = (conversationId: string) => {
    deleteConversation(conversationId);
    // If we deleted the current conversation, create a new one
    if (currentConversation?.id === conversationId) {
      createNewConversation();
    }
  };

  const renderBotMessage = (content: string) => {
    const sections = parseStructuredResponse(content);
    
    // If no structured sections found, render as regular message
    if (!sections.summary && !sections.insights && !sections.steps && !sections.tip && !sections.questions && !sections.progress) {
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="whitespace-pre-wrap text-gray-800">{content}</div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sections.summary && (
          <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-lg">📋</span>
              <h4 className="font-semibold text-blue-800 ml-2">Summary</h4>
            </div>
            <div className="text-blue-700 whitespace-pre-wrap">{sections.summary}</div>
          </div>
        )}

        {sections.insights && (
          <div className="bg-purple-50 border-l-4 border-purple-400 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-lg">🎯</span>
              <h4 className="font-semibold text-purple-800 ml-2">Key Insights</h4>
            </div>
            <div className="text-purple-700 whitespace-pre-wrap">{sections.insights}</div>
          </div>
        )}

        {sections.steps && (
          <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-lg">📊</span>
              <h4 className="font-semibold text-green-800 ml-2">Actionable Steps</h4>
            </div>
            <div className="text-green-700 whitespace-pre-wrap">{sections.steps}</div>
          </div>
        )}

        {sections.tip && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-lg">💡</span>
              <h4 className="font-semibold text-yellow-800 ml-2">Expert Tip</h4>
            </div>
            <div className="text-yellow-700 whitespace-pre-wrap">{sections.tip}</div>
          </div>
        )}

        {sections.questions && (
          <div className="bg-indigo-50 border-l-4 border-indigo-400 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-lg">❓</span>
              <h4 className="font-semibold text-indigo-800 ml-2">Follow-up Questions</h4>
            </div>
            <div className="text-indigo-700 whitespace-pre-wrap">{sections.questions}</div>
          </div>
        )}

        {sections.progress && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-400 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-lg">🚀</span>
              <h4 className="font-semibold text-orange-800 ml-2">Progress Tracker</h4>
            </div>
            <div className="text-orange-700 whitespace-pre-wrap">{sections.progress}</div>
          </div>
        )}
      </div>
    );
  };

  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-900">
      {/* Sidebar */}
      <ConversationSidebar
        conversations={getConversationSummaries()}
        currentConversationId={currentConversation.id}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white hover:text-blue-200 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Bot className="w-8 h-8 text-white" />
          <div>
            <h3 className="text-lg font-semibold text-white">AI Startup Coach</h3>
            <p className="text-blue-100 text-sm">Your personal business advisor</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            renderBotMessage={renderBotMessage}
            isStreaming={message.sender === 'bot' && streamingMessageId === message.id}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-3 bg-gray-800 rounded-lg p-4">
              <Bot className="w-6 h-6 text-blue-500" />
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-gray-300">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about idea validation, MVP planning, growth strategies..."
            className="flex-1 resize-none bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};