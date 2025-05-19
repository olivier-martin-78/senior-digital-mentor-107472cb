
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface EntrySectionProps {
  title: string;
  content?: string | null;
  tags?: string[] | null;
  className?: string;
}

const EntrySection: React.FC<EntrySectionProps> = ({ 
  title, 
  content, 
  tags,
  className = ''
}) => {
  if (!content && (!tags || tags.length === 0)) return null;
  
  return (
    <section className={className}>
      <h2 className="text-xl font-medium mb-2">{title}</h2>
      
      {content && <p className="whitespace-pre-line">{content}</p>}
      
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <Badge key={idx} variant={title === "Tags" ? "outline" : "secondary"}>{tag}</Badge>
          ))}
        </div>
      )}
    </section>
  );
};

export default EntrySection;
