
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  gradient?: string;
  isExternal?: boolean;
  onHover?: () => void;
  openInSamePage?: boolean; // New prop to control whether to open in same page
}

const FeatureCard = ({
  title,
  description,
  icon: Icon,
  to,
  gradient = 'gradient-purple',
  isExternal = false,
  onHover,
  openInSamePage = false // Default to false to maintain backward compatibility
}: FeatureCardProps) => {
  const handleMouseEnter = () => {
    if (onHover) {
      onHover();
    }
  };

  const CardContent = () => (
    <div className="feature-card bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow-sm transition-all duration-300 hover:shadow-md active:scale-[0.98] text-center flex flex-col items-center justify-center gap-2 sm:gap-3 touch-target">
      <div className={cn('p-2 sm:p-3 rounded-full transition-all duration-300 group-hover:scale-110', gradient)}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white transition-all duration-300 group-hover:stroke-[2.5]" strokeWidth={2} />
      </div>
      <h3 className="font-medium text-sm sm:text-base md:text-lg text-gray-900 transition-colors duration-300 group-hover:text-primary leading-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{description}</p>
    </div>
  );

  // External link that should open in the same page
  if (isExternal && openInSamePage) {
    return (
      <a href={to} className="group" onMouseEnter={handleMouseEnter}>
        <CardContent />
      </a>
    );
  }
  
  // External link that should open in a new tab
  if (isExternal) {
    return (
      <a href={to} className="group" target="_blank" rel="noopener noreferrer" onMouseEnter={handleMouseEnter}>
        <CardContent />
      </a>
    );
  }
  
  // Internal link (uses react-router)
  return (
    <Link to={to} className="group" onMouseEnter={handleMouseEnter}>
      <CardContent />
    </Link>
  );
};

export default FeatureCard;
