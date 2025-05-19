
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { Profile } from '@/types/supabase';
import { getInitials } from './PostHeader';

interface CommentFormProps {
  user: any | null;
  profile: Profile | null;
  onSubmit: (content: string) => Promise<void>;
}

const CommentForm: React.FC<CommentFormProps> = ({ user, profile, onSubmit }) => {
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(commentContent);
      setCommentContent('');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card className="mb-8">
        <CardContent className="pt-6">
          <p className="text-center text-gray-600 mb-4">
            Vous devez être connecté pour laisser un commentaire.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link to="/auth">Se connecter</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-4 mb-4 items-start">
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={profile?.avatar_url || undefined} alt={user?.email || 'Utilisateur'} />
          <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
        </Avatar>
        <Textarea
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          placeholder="Ajouter un commentaire..."
          className="flex-1"
          rows={3}
        />
      </div>
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={submitting || !commentContent.trim()}
          className="bg-tranches-sage hover:bg-tranches-sage/90"
        >
          {submitting ? 'Envoi...' : 'Publier'}
          <Send className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default CommentForm;
