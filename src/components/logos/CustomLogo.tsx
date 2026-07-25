import React from 'react';

interface CustomLogoProps {
  size?: number;
  className?: string;
}

export const CustomLogo: React.FC<CustomLogoProps> = ({ 
  size = 40, 
  className = "" 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" /> {/* Blue */}
          <stop offset="50%" stopColor="#8B5CF6" /> {/* Purple */}
          <stop offset="100%" stopColor="#EC4899" /> {/* Pink/Magenta */}
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Network Connection Paths */}
      <g fill="url(#networkGradient)" filter="url(#glow)">
        
        {/* Top curved connection */}
        <path
          d="M 25 35 Q 35 25 50 30 Q 65 35 75 25"
          stroke="url(#networkGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Left curved connection */}
        <path
          d="M 20 45 Q 15 55 25 65 Q 35 75 30 85"
          stroke="url(#networkGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Right curved connection */}
        <path
          d="M 70 40 Q 85 50 75 65 Q 65 80 75 90"
          stroke="url(#networkGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Bottom curved connection */}
        <path
          d="M 35 75 Q 45 85 60 80 Q 75 75 80 85"
          stroke="url(#networkGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Center connecting paths */}
        <path
          d="M 40 50 Q 50 45 60 50"
          stroke="url(#networkGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Network Nodes (Circles) */}
        
        {/* Top left node */}
        <circle cx="25" cy="35" r="6" fill="url(#networkGradient)" />
        <circle cx="25" cy="35" r="2.5" fill="#1F2937" />
        
        {/* Top right node */}
        <circle cx="75" cy="25" r="6" fill="url(#networkGradient)" />
        <circle cx="75" cy="25" r="2.5" fill="#1F2937" />
        
        {/* Left node */}
        <circle cx="20" cy="45" r="6" fill="url(#networkGradient)" />
        <circle cx="20" cy="45" r="2.5" fill="#1F2937" />
        
        {/* Center node */}
        <circle cx="50" cy="50" r="7" fill="url(#networkGradient)" />
        <circle cx="50" cy="50" r="3" fill="#1F2937" />
        
        {/* Right node */}
        <circle cx="70" cy="40" r="6" fill="url(#networkGradient)" />
        <circle cx="70" cy="40" r="2.5" fill="#1F2937" />
        
        {/* Bottom left node */}
        <circle cx="30" cy="85" r="6" fill="url(#networkGradient)" />
        <circle cx="30" cy="85" r="2.5" fill="#1F2937" />
        
        {/* Bottom right node */}
        <circle cx="75" cy="90" r="5" fill="url(#networkGradient)" />
        <circle cx="75" cy="90" r="2" fill="#1F2937" />
        
        {/* Top center node */}
        <circle cx="50" cy="30" r="5" fill="url(#networkGradient)" />
        <circle cx="50" cy="30" r="2" fill="#1F2937" />
        
        {/* Additional connecting node */}
        <circle cx="80" cy="85" r="4" fill="url(#networkGradient)" />
        <circle cx="80" cy="85" r="1.5" fill="#1F2937" />
        
      </g>
    </svg>
  );
};