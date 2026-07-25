import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X, CheckCircle, Code, Palette, Rocket } from 'lucide-react';
import { sendProjectMessage } from '../services/aiService';
import { ProjectMessage } from '../types/project';
import { feedbackProcessorService } from '../services/feedbackProcessorService';
import { contextService } from '../services/contextService';

interface ProjectCreationChatProps {
  onClose: () => void;
  onProjectCreated?: (projectData: any) => void;
}

export const ProjectCreationChat: React.FC<ProjectCreationChatProps> = ({ onClose, onProjectCreated }) => {
  const [messages, setMessages] = useState<ProjectMessage[]>([
    {
      id: '1',
      content: `Hello! I'm your AI project assistant. I'll help you bring your project idea to life!

**🎯 Let's Start Simple**

What kind of project would you like to create?

**💭 Examples:**
- Web application (dashboard, SaaS, portfolio)
- Mobile app (iOS, Android, cross-platform)
- E-commerce store
- Landing page
- API or backend service
- Something else?

Tell me about your project idea, and I'll guide you through the process step by step!`,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [projectContext, setProjectContext] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractProjectData = (aiResponse: string) => {
    try {
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      }
    } catch (error) {
      console.error('Failed to extract project data:', error);
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ProjectMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get feedback context to inject learned insights
      const recentFeedback = await feedbackProcessorService.getFeedbackHistory(undefined, 20);
      const feedbackContext = feedbackProcessorService.buildFeedbackContext(recentFeedback);

      // Get business context
      const businessContext = await contextService.getBusinessContext();
      const businessContextStr = contextService.buildContextSummary(businessContext);

      const response = await sendProjectMessage(
        inputMessage,
        projectContext,
        undefined,
        businessContextStr,
        feedbackContext
      );

      const projectData = extractProjectData(response);
      if (projectData) {
        setProjectContext(projectData);
      }

      const aiMessage: ProjectMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Process and save feedback insights
      (async () => {
        try {
          const businessContext = await contextService.getBusinessContext();
          await feedbackProcessorService.processAndSaveInsights(
            response,
            businessContext,
            undefined
          );
        } catch (error) {
          console.error('Error processing feedback:', error);
        }
      })();

      if (projectData && onProjectCreated) {
        onProjectCreated(projectData);
      }
    } catch (error) {
      const errorMessage: ProjectMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please make sure your OpenAI API key is configured correctly.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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

  const renderMessage = (message: ProjectMessage) => {
    const isUser = message.sender === 'user';

    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex items-start space-x-3 max-w-3xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-blue-600' : 'bg-gradient-to-r from-purple-600 to-pink-600'
          }`}>
            {isUser ? <User className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
          </div>

          <div className={`rounded-lg p-4 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-100 border border-gray-700'
          }`}>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        </div>
      </div>
    );
  };

  const progressSteps = [
    { icon: Rocket, label: 'Project Type', completed: !!projectContext.category },
    { icon: Code, label: 'Tech Stack', completed: !!projectContext.techStack },
    { icon: Palette, label: 'Design', completed: !!projectContext.designPreferences },
    { icon: CheckCircle, label: 'Complete', completed: !!projectContext.title && !!projectContext.techStack },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Project Creator</h2>
              <p className="text-sm text-white/80">Let's build something amazing together</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {progressSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-white/20 text-white/60'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-white/80 mt-1">{step.label}</span>
                </div>
                {index < progressSteps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded transition-colors ${
                    step.completed ? 'bg-green-500' : 'bg-white/20'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(renderMessage)}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-3 bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
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
        <div className="flex space-x-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your project idea or answer the questions..."
            className="flex-1 resize-none bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span className="font-medium">Send</span>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
