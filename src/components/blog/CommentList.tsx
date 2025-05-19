
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { CommentWithAuthor } from '@/types/supabase';
import { formatDate, getInitials } from './PostHeader';

interface CommentListProps {
  comments: CommentWithAuthor[];
  currentUserId?: string;
  isAdmin: boolean;
  onDelete: (commentId: string) => void;
}

const CommentList: React.FC<CommentListProps> = ({ comments, currentUserId, isAdmin, onDelete }) => {
  if (comments.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        Aucun commentaire pour le moment. Soyez le premier à commenter!
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map(comment => (
        <div key={comment.id} className="flex gap-4">
          <Avatar className="h-8 w-8 mt-1">
            <AvatarImage src={comment.profiles?.avatar_url || undefined} alt={comment.profiles?.display_name || 'Utilisateur'} />
            <AvatarFallback>{getInitials(comment.profiles?.display_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-tranches-charcoal">
                  {comment.profiles?.display_name || 'Utilisateur'}
                </h4>
                <p className="text-sm text-gray-500">{formatDate(comment.created_at)}</p>
              </div>
              {(currentUserId === comment.author_id || isAdmin) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(comment.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="mt-2 text-gray-700">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentList;
