import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '',
  showText = true 
}) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Option 1: Custom Image Logo (uncomment and add your logo URL) */}
      {/* <img 
        src="/path-to-your-logo.png" 
        alt="BizactlyAI Logo"
        className={iconSizes[size]}
      /> */}
      
      {/* Option 2: Text-based Logo */}
      <div className={`${iconSizes[size]} bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center`}>
        <span className="text-white font-bold text-sm">B</span>
      </div>
      
      {showText && (
        <span className={`${sizeClasses[size]} font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent`}>
          BizactlyAI
        </span>
      )}
    </div>
  );
};