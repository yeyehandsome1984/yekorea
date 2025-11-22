
import React from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartRevisionLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  backgroundImage?: string;
}

const SmartRevisionLogo = ({ 
  size = 'md', 
  showText = true, 
  backgroundImage 
}: SmartRevisionLogoProps) => {
  // Size mapping
  const sizeMap = {
    sm: {
      container: 'h-8 w-8',
      primaryIcon: 'h-4 w-4',
      secondaryIcon: 'h-3 w-3',
      text: 'text-sm'
    },
    md: {
      container: 'h-10 w-10',
      primaryIcon: 'h-5 w-5',
      secondaryIcon: 'h-4 w-4',
      text: 'text-base'
    },
    lg: {
      container: 'h-14 w-14',
      primaryIcon: 'h-8 w-8',
      secondaryIcon: 'h-5 w-5',
      text: 'text-lg'
    }
  };

  const backgroundStyle = backgroundImage 
    ? { 
        backgroundImage: `url(${backgroundImage})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      } 
    : {};

  return (
    <div className="flex items-center space-x-2">
      <div 
        className={cn(
          `relative flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 ${sizeMap[size].container}`,
          backgroundImage ? 'overflow-hidden' : ''
        )}
        style={backgroundStyle}
      >
        <Brain className={`text-white ${sizeMap[size].primaryIcon}`} />
        <div className="absolute -top-1 -right-1">
          <div className="bg-amber-400 rounded-full p-0.5">
            <Sparkles className={`text-white ${sizeMap[size].secondaryIcon}`} />
          </div>
        </div>
      </div>
      
      {showText && (
        <span className={`font-semibold text-gray-800 ${sizeMap[size].text}`}>Smart Revision</span>
      )}
    </div>
  );
};

export default SmartRevisionLogo;
