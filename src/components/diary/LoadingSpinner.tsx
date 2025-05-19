
import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  className = "my-10", 
  size = "md",
  color = "border-tranches-sage"
}) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-4",
    lg: "h-12 w-12 border-4"
  };
  
  return (
    <div className={`flex justify-center ${className}`}>
      <div className={`animate-spin ${sizeClasses[size]} ${color} border-t-transparent rounded-full`}></div>
    </div>
  );
};

export default LoadingSpinner;
