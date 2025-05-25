
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface BlogHeaderProps {
  canCreatePosts: boolean;
}

const BlogHeader: React.FC<BlogHeaderProps> = ({ canCreatePosts }) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-serif text-tranches-charcoal">Albums</h1>
      {canCreatePosts && (
        <Button asChild className="bg-tranches-sage hover:bg-tranches-sage/90">
          <Link to="/blog/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            Nouvel article
          </Link>
        </Button>
      )}
    </div>
  );
};

export default BlogHeader;
