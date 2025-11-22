
import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
  iconColor?: string;
  total?: number; // Added for progress display
  subtitle?: string; // Added for additional information
}

const StatsCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon,
  iconColor = 'bg-blue-500',
  total,
  subtitle
}: StatsCardProps) => {
  // Calculate percentage for progress bar if total is provided
  const percentage = total && typeof value === 'number' ? Math.round((value / total) * 100) : null;
  
  return (
    <div className="stats-card bg-white rounded-lg border p-4 shadow-sm">
      <div className="flex items-center space-x-3">
        {Icon && (
          <div className={cn("p-2 rounded-md", iconColor)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="flex items-end space-x-1">
            <p className="text-2xl font-medium text-gray-900">{value}</p>
            {total !== undefined && (
              <span className="text-sm text-gray-500 pb-1">
                of {total}
              </span>
            )}
            {change !== undefined && (
              <span className={cn(
                "text-xs pb-1 flex items-center",
                change >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(change)}%
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          
          {/* Display progress bar if we have total and value */}
          {percentage !== null && (
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-100 rounded-full">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
