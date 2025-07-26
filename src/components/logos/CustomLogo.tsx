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
        <radialGradient id="outerGradient" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#06B6D4" /> {/* Cyan */}
          <stop offset="100%" stopColor="#4338CA" /> {/* Deep Indigo */}
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Outer Circle with Gradient */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="url(#outerGradient)"
        filter="url(#glow)"
      />

      {/* Inner Target Ring */}
      <circle
        cx="50"
        cy="50"
        r="28"
        fill="none"
        stroke="white"
        strokeWidth="2"
        opacity="0.9"
      />

      {/* Lightbulb Shape */}
      <g transform="translate(50, 50)">
        {/* Bulb Top (Circular) */}
        <circle
          cx="0"
          cy="-8"
          r="12"
          fill="white"
          opacity="0.95"
        />
        
        {/* Bulb Neck */}
        <rect
          x="-6"
          y="2"
          width="12"
          height="8"
          rx="2"
          fill="white"
          opacity="0.95"
        />
        
        {/* Bulb Base */}
        <rect
          x="-8"
          y="10"
          width="16"
          height="4"
          rx="2"
          fill="white"
          opacity="0.8"
        />

        {/* Inner Filament Lines */}
        <g opacity="0.6">
          <path
            d="M -6 -8 Q 0 -4 6 -8"
            stroke="#4338CA"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M -4 -12 Q 0 -8 4 -12"
            stroke="#4338CA"
            strokeWidth="1"
            fill="none"
          />
        </g>

        {/* AI Circuit/Signal Lines */}
        <g opacity="0.7" stroke="white" strokeWidth="1.5" fill="none">
          {/* Top signals */}
          <line x1="0" y1="-22" x2="0" y2="-26" />
          <line x1="8" y1="-18" x2="11" y2="-21" />
          <line x1="-8" y1="-18" x2="-11" y2="-21" />
          
          {/* Side signals */}
          <line x1="18" y1="-8" x2="22" y2="-8" />
          <line x1="-18" y1="-8" x2="-22" y2="-8" />
          
          {/* Bottom signals */}
          <line x1="12" y1="4" x2="15" y2="7" />
          <line x1="-12" y1="4" x2="-15" y2="7" />
        </g>

        {/* Signal Dots */}
        <g fill="white" opacity="0.8">
          <circle cx="0" cy="-28" r="1" />
          <circle cx="13" cy="-23" r="1" />
          <circle cx="-13" cy="-23" r="1" />
          <circle cx="24" cy="-8" r="1" />
          <circle cx="-24" cy="-8" r="1" />
          <circle cx="17" cy="9" r="1" />
          <circle cx="-17" cy="9" r="1" />
        </g>
      </g>
    </svg>
  );
};