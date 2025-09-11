import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '',
  showText = false 
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
      {/* Logo Image */}
      <img 
        src="src/assets/images/logo.jpg"
        alt="Bizactly.AI Logo"
        className={`${imageSizes[size]} drop-shadow-lg rounded-lg`}
      />
      
      {showText && (
        <span className={`${sizeClasses[size]} font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent`}>
          Bizactly.AI
        </span>
      )}
    </div>
  );
};