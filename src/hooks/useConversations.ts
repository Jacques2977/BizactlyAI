import { useState, useEffect } from 'react';
import { Conversation, ConversationSummary, ChatMessage } from '../types/conversation';
import { useAuth } from '../contexts/AuthContext';

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = () => {
    setIsLoading(true);
    
    const savedConversations = localStorage.getItem(`conversations_${user?.id}`);
    if (savedConversations) {
      try {
        const parsedConversations = JSON.parse(savedConversations);
        // Convert timestamp strings back to Date objects
        const conversationsWithDates = parsedConversations.map((conv: any) => ({
          ...conv,
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(conversationsWithDates);
      } catch (error) {
        console.error('Failed to load conversations:', error);
        setConversations([]);
      }
    }
    
    setIsLoading(false);
  };

  const saveConversations = (updatedConversations: Conversation[]) => {
    if (user) {
      localStorage.setItem(`conversations_${user.id}`, JSON.stringify(updatedConversations));
    }
  };

  const createNewConversation = (): Conversation => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [
        {
          id: '1',
          content: "👋 Hi! I'm your AI startup coach. I'm here to help you validate ideas, plan your MVP, develop growth strategies, and navigate the startup journey. What would you like to work on today?",
          sender: 'bot',
          timestamp: new Date(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user?.id || '',
    };

    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    setCurrentConversation(newConversation);
    saveConversations(updatedConversations);

    return newConversation;
  };

  const loadConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
    }
  };

  const addMessageToConversation = (conversationId: string, message: ChatMessage) => {
    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversationId) {
        const updatedConv = {
          ...conv,
          messages: [...conv.messages, message],
          updatedAt: new Date().toISOString(),
          title: conv.title === 'New Conversation' ? generateConversationTitle(message.content) : conv.title
        };
        
        return updatedConv;
      }
      return conv;
    });

    setConversations(updatedConversations);
    
    // Update current conversation immediately if it's the active one
    if (currentConversation?.id === conversationId) {
      const updatedCurrentConv = updatedConversations.find(c => c.id === conversationId);
      if (updatedCurrentConv) {
        setCurrentConversation(updatedCurrentConv);
      }
    }
    
    saveConversations(updatedConversations);
  };

  const deleteConversation = (conversationId: string) => {
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    setConversations(updatedConversations);
    saveConversations(updatedConversations);

    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
    }
  };

  const generateConversationTitle = (firstMessage: string): string => {
    // Generate a title from the first user message (max 50 chars)
    const title = firstMessage.length > 50 
      ? firstMessage.substring(0, 47) + '...' 
      : firstMessage;
    return title || 'New Conversation';
  };

  const getConversationSummaries = (): ConversationSummary[] => {
    return conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      lastMessage: conv.messages[conv.messages.length - 1]?.content || '',
      updatedAt: conv.updatedAt,
      messageCount: conv.messages.length
    }));
  };

  const getConversationContext = (conversationId: string): string => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return '';

    // Get last 10 messages for context (excluding the initial bot greeting if it exists)
    const contextMessages = conversation.messages
      .filter(msg => !(msg.sender === 'bot' && msg.content.includes("Hi! I'm your AI startup coach"))) // Filter out initial greeting
      .slice(-10) // Get last 10 messages
      .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    return contextMessages;
  };

  return {
    conversations,
    currentConversation,
    isLoading,
    createNewConversation,
    loadConversation,
    addMessageToConversation,
    deleteConversation,
    getConversationSummaries,
    getConversationContext,
    loadConversations
  };
};