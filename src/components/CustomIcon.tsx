import React from 'react';

interface CustomIconProps {
  className?: string;
}

export const CustomIcon: React.FC<CustomIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      
      {/* Connected nodes network icon */}
      {/* Top node */}
      <circle cx="70" cy="25" r="8" fill="url(#iconGradient)" />
      
      {/* Left node */}
      <circle cx="25" cy="45" r="8" fill="url(#iconGradient)" />
      
      {/* Center node */}
      <circle cx="50" cy="55" r="8" fill="url(#iconGradient)" />
      
      {/* Right node */}
      <circle cx="75" cy="45" r="8" fill="url(#iconGradient)" />
      
      {/* Bottom node */}
      <circle cx="50" cy="80" r="8" fill="url(#iconGradient)" />
      
      {/* Connecting lines */}
      <path 
        d="M 62 30 Q 55 35 45 50" 
        stroke="url(#iconGradient)" 
        strokeWidth="6" 
        strokeLinecap="round"
        fill="none"
      />
      
      <path 
        d="M 33 45 Q 40 50 42 55" 
        stroke="url(#iconGradient)" 
        strokeWidth="6" 
        strokeLinecap="round"
        fill="none"
      />
      
      <path 
        d="M 67 45 Q 60 50 58 55" 
        stroke="url(#iconGradient)" 
        strokeWidth="6" 
        strokeLinecap="round"
        fill="none"
      />
      
      <path 
        d="M 50 63 L 50 72" 
        stroke="url(#iconGradient)" 
        strokeWidth="6" 
        strokeLinecap="round"
        fill="none"
      />
      
      <path 
        d="M 70 33 Q 65 40 60 42" 
        stroke="url(#iconGradient)" 
        strokeWidth="6" 
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};