import React from 'react';

interface CustomIconProps {
  className?: string;
}

export const CustomIcon: React.FC<CustomIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
      </defs>
      
      {/* Black background */}
      <rect width="400" height="400" fill="#000000" rx="20" />
      
      {/* Connected nodes network */}
      {/* Top node */}
      <circle cx="200" cy="80" r="25" fill="url(#nodeGradient)" />
      <circle cx="200" cy="80" r="12" fill="#000000" />
      
      {/* Left node */}
      <circle cx="120" cy="180" r="25" fill="url(#nodeGradient)" />
      <circle cx="120" cy="180" r="12" fill="#000000" />
      
      {/* Right node */}
      <circle cx="280" cy="180" r="25" fill="url(#nodeGradient)" />
      <circle cx="280" cy="180" r="12" fill="#000000" />
      
      {/* Bottom left node */}
      <circle cx="150" cy="280" r="25" fill="url(#nodeGradient)" />
      <circle cx="150" cy="280" r="12" fill="#000000" />
      
      {/* Bottom right node */}
      <circle cx="250" cy="280" r="25" fill="url(#nodeGradient)" />
      <circle cx="250" cy="280" r="12" fill="#000000" />
      
      {/* Connecting paths */}
      <path
        d="M 200 105 Q 160 140 120 155"
        stroke="url(#nodeGradient)"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      
      <path
        d="M 200 105 Q 240 140 280 155"
        stroke="url(#nodeGradient)"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      
      <path
        d="M 120 205 Q 135 240 150 255"
        stroke="url(#nodeGradient)"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      
      <path
        d="M 280 205 Q 265 240 250 255"
        stroke="url(#nodeGradient)"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      
      <path
        d="M 175 280 Q 200 270 225 280"
        stroke="url(#nodeGradient)"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
};