export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ConversationSummary {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  messageCount: number;
}