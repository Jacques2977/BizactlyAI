import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { sendMessage } from '../api/chat';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatInterfaceProps {
  onClose: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "👋 Hi! I'm your AI startup coach. I'm here to help you validate ideas, plan your MVP, develop growth strategies, and navigate the startup journey. What would you like to work on today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      questions: ''
    };

    // Split content by section headers
    const summaryMatch = content.match(/\*\*📋 SUMMARY\*\*(.*?)(?=\*\*🎯|$)/s);
    const insightsMatch = content.match(/\*\*🎯 KEY INSIGHTS\*\*(.*?)(?=\*\*📊|$)/s);
    const stepsMatch = content.match(/\*\*📊 ACTIONABLE STEPS\*\*(.*?)(?=\*\*💡|$)/s);
    const tipMatch = content.match(/\*\*💡 EXPERT TIP\*\*(.*?)(?=\*\*❓|$)/s);
    const questionsMatch = content.match(/\*\*❓ FOLLOW-UP QUESTIONS\*\*(.*?)$/s);

    sections.summary = summaryMatch ? summaryMatch[1].trim() : '';
    sections.insights = insightsMatch ? insightsMatch[1].trim() : '';
    sections.steps = stepsMatch ? stepsMatch[1].trim() : '';
    sections.tip = tipMatch ? tipMatch[1].trim() : '';
    sections.questions = questionsMatch ? questionsMatch[1].trim() : '';

    return sections;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessage(inputMessage);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please make sure your OpenAI API key is configured correctly in your .env file.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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

  const renderBotMessage = (content: string) => {
    const sections = parseStructuredResponse(content);
    
    // If no structured sections found, render as regular message
    if (!sections.summary && !sections.insights && !sections.steps && !sections.tip && !sections.questions) {
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
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center space-x-3">
          <Bot className="w-8 h-8 text-white" />
          <div>
            <h3 className="text-lg font-semibold text-white">AI Startup Coach</h3>
            <p className="text-blue-100 text-sm">Your personal business advisor</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-blue-200 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white rounded-lg p-3'
                  : 'w-full'
              }`}
            >
              {message.sender === 'user' ? (
                <div className="flex items-start space-x-2">
                  <User className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <Bot className="w-6 h-6 mt-1 flex-shrink-0 text-blue-500" />
                  <div className="flex-1">
                    {renderBotMessage(message.content)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
              <Bot className="w-6 h-6 text-blue-500" />
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about idea validation, MVP planning, growth strategies..."
            className="flex-1 resize-none border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
  );
};