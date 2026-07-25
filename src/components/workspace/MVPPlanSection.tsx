import React, { useState } from 'react';
import { Send, Sparkles, CheckCircle } from 'lucide-react';
import { Project } from '../../types/project';
import { chatWithAI } from '../../services/aiService';

interface MVPPlanSectionProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function MVPPlanSection({ project, onUpdate }: MVPPlanSectionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Let's plan your MVP for "${project.title}". I'll help you prioritize features, define tech stack, and create a development roadmap. What are the core features your users need?`
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
      const context = `Project: ${project.title}\nDescription: ${project.description}\nValue Proposition: ${project.value_proposition}\nMVP Features: ${JSON.stringify(project.mvp_features_list || [])}\nTech Stack: ${JSON.stringify(project.tech_stack || {})}\n\nYou are helping plan an MVP. Focus on feature prioritization, tech stack recommendations, and development timeline.`;

      const response = await chatWithAI(userMessage, context, 3000);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);

      onUpdate({
        ai_suggestions: {
          ...project.ai_suggestions,
          mvp_plan: response
        }
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

  const handleMarkComplete = () => {
    onUpdate({
      milestones_completed: {
        ...project.milestones_completed,
        mvp_plan: {
          completed: true,
          completedAt: new Date().toISOString()
        }
      },
      current_milestone: 'launch',
      progress_percentage: Math.min((project.progress_percentage || 0) + 16, 100)
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">MVP Plan</h2>
              <p className="text-gray-300">Plan your minimum viable product</p>
            </div>
            {!project.milestones_completed?.mvp_plan?.completed && (
              <button
                onClick={handleMarkComplete}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Complete</span>
              </button>
            )}
          </div>
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
              placeholder="Ask about feature prioritization, tech stack, or timeline..."
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
