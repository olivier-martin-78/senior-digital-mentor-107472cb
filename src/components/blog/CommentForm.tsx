
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Send, AlertCircle } from 'lucide-react';
import { Profile } from '@/types/supabase';
import { getInitials } from './PostHeader';
import EmojiPicker from './EmojiPicker';
import { useAuth } from '@/contexts/AuthContext';

interface CommentFormProps {
  user: any | null;
  profile: Profile | null;
  onSubmit: (content: string) => Promise<void>;
}

const CommentForm: React.FC<CommentFormProps> = ({ user, profile, onSubmit }) => {
  const { checkEmailConfirmation } = useAuth();
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      checkEmailConfirmation().then(setEmailConfirmed);
    }
  }, [user, checkEmailConfirmation]);

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

  const handleEmojiSelect = (emoji: string) => {
    setCommentContent(prev => prev + emoji);
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

  if (emailConfirmed === false) {
    return (
      <Card className="mb-8 border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-orange-800 mb-4">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">Confirmation d'email requise</p>
          </div>
          <p className="text-orange-700">
            Vous devez confirmer votre adresse email avant de pouvoir laisser des commentaires. 
            Vérifiez votre boîte de réception pour le lien de confirmation.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isSubmitDisabled = submitting || !commentContent.trim() || emailConfirmed === false;

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-4 mb-4 items-start">
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={profile?.avatar_url || undefined} alt={user?.email || 'Utilisateur'} />
          <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="flex-1 mb-2"
            rows={3}
          />
          <div className="flex justify-between items-center">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            <Button 
              type="submit" 
              disabled={isSubmitDisabled}
              className="bg-tranches-sage hover:bg-tranches-sage/90"
            >
              {submitting ? 'Envoi...' : 'Publier'}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
