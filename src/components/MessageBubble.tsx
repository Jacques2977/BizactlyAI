import React from "react";
import { useState, useEffect } from "react";
import { Bot, User } from "lucide-react";
import { ChatMessage } from "../types/conversation";

interface MessageBubbleProps {
  message: ChatMessage;
  renderBotMessage: (content: string) => React.ReactNode;
  isStreaming?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, renderBotMessage, isStreaming = false }) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (message.sender === "bot" && isStreaming) {
      setIsTyping(true);
      setDisplayedContent("");
      
      let currentIndex = 0;
      const content = message.content;
      
      const streamInterval = setInterval(() => {
        if (currentIndex < content.length) {
          setDisplayedContent(content.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(streamInterval);
        }
      }, 20); // Adjust speed here (lower = faster)
      
      return () => clearInterval(streamInterval);
    } else {
      setDisplayedContent(message.content);
      setIsTyping(false);
    }
  }, [message.content, isStreaming, message.sender]);

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
          <div className="relative">
            {renderBotMessage(displayedContent)}
            {isTyping && (
              <div className="inline-flex items-center ml-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};