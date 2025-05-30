
import React from 'react';
import { MessageCircle } from 'lucide-react';

interface CommentBubbleIconProps {
  className?: string;
}

const CommentBubbleIcon: React.FC<CommentBubbleIconProps> = ({ 
  className = "w-48 h-32 flex-shrink-0 overflow-hidden rounded-l-lg"
}) => {
  return (
    <div className={`${className} bg-orange-100 flex items-center justify-center`}>
      <MessageCircle 
        size={48} 
        className="text-orange-500"
        strokeWidth={1.5}
      />
    </div>
  );
};

export default CommentBubbleIcon;
