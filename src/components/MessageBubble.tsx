import React from "react";
import { Bot, User } from "lucide-react";
import { ChatMessage } from "../types/conversation";

interface MessageBubbleProps {
  message: ChatMessage;
  renderBotMessage: (content: string) => React.ReactNode;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, renderBotMessage }) => {
  if (message.sender === "user") {
    return (
      <div className="flex justify-end">
        <div className="flex items-end space-x-2 max-w-[80%]">
          <div className="bg-blue-500 text-white rounded-lg px-3 py-2 whitespace-pre-wrap">
            {message.content}
          </div>
          <User className="w-5 h-5 text-blue-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex items-start space-x-3 max-w-[90%]">
        <Bot className="w-6 h-6 mt-1 flex-shrink-0 text-blue-500" />
        <div className="flex-1">
          {renderBotMessage(message.content)}
        </div>
      </div>
    </div>
  );
};