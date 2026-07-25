import React, { useState } from 'react';
import { Send, Sparkles, CheckCircle } from 'lucide-react';
import { Project } from '../../types/project';
import { chatWithAI } from '../../services/aiService';

interface LaunchStrategySectionProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function LaunchStrategySection({ project, onUpdate }: LaunchStrategySectionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Let's create a launch strategy for "${project.title}". I'll help you with pre-launch, launch day, and post-launch activities. What's your launch timeline?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const context = `Project: ${project.title}\nDescription: ${project.description}\nTarget Users: ${JSON.stringify(project.target_users)}\nLaunch Roadmap: ${JSON.stringify(project.launch_roadmap || {})}\n\nYou are helping create a go-to-market launch strategy. Include pre-launch, launch, and post-launch tactics with specific channels and timelines.`;

      const response = await chatWithAI(userMessage, context, 3000);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);

      onUpdate({
        launch_strategy_data: {
          lastUpdate: new Date().toISOString(),
          strategy: response
        },
        progress_percentage: Math.min((project.progress_percentage || 0) + 16, 100)
      });
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">Launch Strategy</h2>
          <p className="text-gray-300">Create your go-to-market plan</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-blue-400">AI Advisor</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about launch channels, timing, or tactics..."
              className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
