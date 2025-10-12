import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Menu, MessageSquare } from 'lucide-react';
import { sendMessage } from '../api/chat';
import { useConversations } from '../hooks/useConversations';
import { ConversationSidebar } from './ConversationSidebar';
import { MessageBubble } from './MessageBubble';
import { ChatMessage } from '../types/conversation';
import { generateLeanCanvasPDF, generateMVPPlanPDF, generateCanvasFromChatData, generateMVPFromChatData } from '../utils/pdfGenerator';

interface ChatInterfaceProps {
  onClose: () => void;
  onFeatureUse?: () => boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose, onFeatureUse }) => {
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
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showPDFOptions, setShowPDFOptions] = useState(false);

  // Initialize with a new conversation if none exists
  useEffect(() => {
    if (!currentConversation) {
      createNewConversation();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

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

  const handleGeneratePDF = async (type: 'canvas' | 'mvp') => {
    if (!currentConversation) return;
    
    try {
      const chatHistory = currentConversation.messages
        .map(msg => `${msg.sender}: ${msg.content}`)
        .join('\n\n');
      
      const productName = extractProductName(chatHistory);
      
      if (type === 'canvas') {
        const canvasData = generateCanvasFromChatData(chatHistory, productName);
        await generateLeanCanvasPDF(canvasData);
        
        // Add confirmation message
        const confirmMessage: ChatMessage = {
          id: Date.now().toString(),
          content: "✅ **Lean Canvas PDF Generated Successfully!**\n\nYour professional Lean Canvas has been downloaded. You can now:\n- Share it with potential investors\n- Use it for team alignment\n- Reference it during development\n- Update it as your startup evolves\n\nWould you like to work on any specific section further or move on to MVP planning?",
          sender: 'bot',
          timestamp: new Date(),
        };
        addMessageToConversation(currentConversation.id, confirmMessage);
      } else {
        const mvpData = generateMVPFromChatData(chatHistory, productName);
        await generateMVPPlanPDF(mvpData);
        
        // Add confirmation message
        const confirmMessage: ChatMessage = {
          id: Date.now().toString(),
          content: "✅ **MVP Plan PDF Generated Successfully!**\n\nYour comprehensive MVP development plan has been downloaded. It includes:\n- Feature breakdown by priority\n- Development timeline\n- Strategic recommendations\n- Resource requirements\n\nReady to start building? Let's discuss your next steps or dive deeper into any specific area!",
          sender: 'bot',
          timestamp: new Date(),
        };
        addMessageToConversation(currentConversation.id, confirmMessage);
      }
      
      setShowPDFOptions(false);
    } catch (error) {
      console.error('PDF generation error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: "❌ Sorry, there was an error generating the PDF. Please try again or let me know if you need help with any specific section of your business plan.",
        sender: 'bot',
        timestamp: new Date(),
      };
      addMessageToConversation(currentConversation.id, errorMessage);
    }
  };

  const extractProductName = (chatHistory: string): string => {
    const nameRegex = /(?:product|startup|business|company|app|platform|service)[:\s]*([^\\n]{1,50})/i;
    const match = chatHistory.match(nameRegex);
    return match ? match[1].trim() : 'My Startup';
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    if (!currentConversation) return;
    
    // Temporarily remove usage limits for testing
    console.log('Sending message - usage limits disabled for testing');

    const currentInput = inputMessage;
    setInputMessage('');

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: currentInput,
      sender: 'user',
      timestamp: new Date(),
    };

    console.log('Sending user message:', userMessage);
    // Add user message to conversation
    addMessageToConversation(currentConversation.id, userMessage);

    setIsLoading(true);

    try {
      // Get conversation context for continuity
      const context = getConversationContext(currentConversation.id);
      const messageWithContext = context 
        ? `Previous conversation context:\n${context}\n\nCurrent message: ${currentInput}`
        : currentInput;
      
      console.log('Calling AI with context:', messageWithContext);
      const response = await sendMessage(messageWithContext);
      console.log('AI response received:', response);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'bot',
        timestamp: new Date(),
      };

      // Start streaming effect
      setStreamingMessageId(botMessage.id);

      console.log('Adding bot message:', botMessage);
      // Add bot message to conversation
      addMessageToConversation(currentConversation.id, botMessage);
      
      // Stop streaming after message is fully displayed
      setTimeout(() => {
        setStreamingMessageId(null);
        
        // Check if AI mentioned PDF generation
        if (response.toLowerCase().includes('generate a professional pdf') || 
            response.toLowerCase().includes('create a pdf') ||
            response.toLowerCase().includes('download') && (response.toLowerCase().includes('canvas') || response.toLowerCase().includes('mvp'))) {
          setShowPDFOptions(true);
        }
      }, response.length * 20 + 500); // Match streaming speed + buffer
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure your OpenAI API key is configured correctly in your .env file.`,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      console.log('Adding error message:', errorMessage);
      // Add error message to conversation
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
          {currentConversation.messages.map((message) => (
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
          {/* PDF Generation Options */}
          {showPDFOptions && (
            <div className="mb-4 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold flex items-center">
                  📄 Generate Professional PDF
                </h4>
                <button
                  onClick={() => setShowPDFOptions(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-blue-200 text-sm mb-3">
                I can create a professional PDF document from our conversation:
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleGeneratePDF('canvas')}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                >
                  📋 Lean Canvas PDF
                </button>
                <button
                  onClick={() => handleGeneratePDF('mvp')}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm"
                >
                  🚀 MVP Plan PDF
                </button>
              </div>
            </div>
          )}
          
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