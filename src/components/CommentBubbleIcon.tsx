
import React from 'react';
import { MessageCircle } from 'lucide-react';

interface CommentBubbleIconProps {
  className?: string;
}

const CommentBubbleIcon: React.FC<CommentBubbleIconProps> = ({ 
  className = "w-48 h-32 flex-shrink-0 overflow-hidden rounded-l-lg"
}) => {
  return (
    <div className={`${className} bg-blue-100 flex items-center justify-center`}>
      <MessageCircle 
        size={48} 
        className="text-blue-500"
        strokeWidth={1.5}
      />
    </div>
  );
};

export default CommentBubbleIcon;
