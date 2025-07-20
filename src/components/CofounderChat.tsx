import React, { useState } from 'react';
import { Send, Bot, User, Lightbulb, Target, Rocket, BarChart3 } from 'lucide-react';
import { sendMessageToAI, type ChatMessage } from '../api/chat';

interface ChatMessageState extends ChatMessage {
  isLoading?: boolean;
}

const CofounderChat: React.FC = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessageState[]>([
    { 
      id: 1, 
      type: 'ai', 
      content: "👋 Hey there, future founder! I'm your AI cofounder, here to help you turn your startup idea into reality. Whether you need help with validation, MVP planning, or launch strategy - I've got you covered. What's on your mind?" 
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isTyping) return;
    
    const userMessage: ChatMessageState = { 
      id: Date.now(), 
      type: 'user', 
      content: newMessage.trim() 
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    const messageToSend = newMessage.trim();
    setNewMessage('');
    setIsTyping(true);
    
    try {
      const aiResponseContent = await sendMessageToAI(messageToSend, chatMessages);
      
      const aiResponse: ChatMessageState = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponseContent
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorResponse: ChatMessageState = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'I apologize, but I encountered an error. Please check your API key configuration and try again.'
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    { icon: Lightbulb, text: "Help me validate my startup idea", color: "from-yellow-500 to-orange-500" },
    { icon: Target, text: "Create an MVP plan", color: "from-blue-500 to-cyan-500" },
    { icon: Rocket, text: "Plan my launch strategy", color: "from-purple-500 to-pink-500" },
    { icon: BarChart3, text: "Analyze my market", color: "from-green-500 to-emerald-500" },
  ];

  const handleQuickPrompt = (prompt: string) => {
    setNewMessage(prompt);
  };

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-6 rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Cofounder</h1>
            <p className="text-cyan-100">Your startup success partner</p>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      {chatMessages.length <= 1 && (
        <div className="p-6 bg-gray-50 border-b">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick start:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickPrompts.map((prompt, index) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(prompt.text)}
                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-left"
                >
                  <div className={`w-8 h-8 bg-gradient-to-r ${prompt.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{prompt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {chatMessages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600' 
                  : 'bg-gradient-to-r from-purple-500 to-indigo-600'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              
              {/* Message */}
              <div className={`px-4 py-3 rounded-2xl ${
                message.type === 'user' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-3xl">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-gray-200">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Describe your startup idea, ask for advice, or request help with validation..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              rows={3}
              autoComplete="off"
              autoFocus
            />
            <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>{newMessage.length}/1000</span>
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-3 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CofounderChat;