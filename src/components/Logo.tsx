import React from 'react';
import { CustomLogo } from './logos/CustomLogo';

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
      {/* Custom SVG Logo */}
      <CustomLogo 
        size={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
        className="drop-shadow-lg"
      />
      
      {showText && (
        <span className={`${sizeClasses[size]} font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent`}>
          BizactlyAI
        </span>
      )}
    </div>
  );
};