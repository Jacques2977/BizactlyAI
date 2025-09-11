import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const imageSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Network Logo SVG */}
      <div className={`${imageSizes[size]} flex-shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
          
          {/* Main curved connection paths */}
          <path
            d="M20 30 Q35 15 50 25 Q65 35 80 20"
            stroke="url(#logoGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          
          <path
            d="M15 50 Q25 35 40 45 Q55 55 70 40"
            stroke="url(#logoGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          
          <path
            d="M25 70 Q40 55 55 65 Q70 75 85 60"
            stroke="url(#logoGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Connecting nodes */}
          <circle cx="20" cy="30" r="8" fill="url(#logoGradient)" />
          <circle cx="20" cy="30" r="3" fill="#1F2937" />
          
          <circle cx="50" cy="25" r="8" fill="url(#logoGradient)" />
          <circle cx="50" cy="25" r="3" fill="#1F2937" />
          
          <circle cx="80" cy="20" r="8" fill="url(#logoGradient)" />
          <circle cx="80" cy="20" r="3" fill="#1F2937" />
          
          <circle cx="15" cy="50" r="8" fill="url(#logoGradient)" />
          <circle cx="15" cy="50" r="3" fill="#1F2937" />
          
          <circle cx="40" cy="45" r="8" fill="url(#logoGradient)" />
          <circle cx="40" cy="45" r="3" fill="#1F2937" />
          
          <circle cx="70" cy="40" r="8" fill="url(#logoGradient)" />
          <circle cx="70" cy="40" r="3" fill="#1F2937" />
          
          <circle cx="25" cy="70" r="8" fill="url(#logoGradient)" />
          <circle cx="25" cy="70" r="3" fill="#1F2937" />
          
          <circle cx="55" cy="65" r="8" fill="url(#logoGradient)" />
          <circle cx="55" cy="65" r="3" fill="#1F2937" />
          
          <circle cx="85" cy="60" r="8" fill="url(#logoGradient)" />
          <circle cx="85" cy="60" r="3" fill="#1F2937" />
        </svg>
      </div>
      
      {/* Company Name */}
      <span className={`${sizeClasses[size]} font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent`}>
        Bizactly.AI
      </span>
    </div>
  );
};