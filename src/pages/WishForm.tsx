import { useState } from 'react';
import { supabase } from '@/integrations/supabase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const WishForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Vous devez être connecté pour soumettre un souhait.',
        });
        navigate('/auth');
        return;
      }

      console.log('WishForm - Submitting data:', { ...formData, user_id: user.id });

      const { error } = await supabase
        .from('wish_posts')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            user_id: user.id,
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        console.error('WishForm - Supabase error:', error);
        throw error;
      }

      toast({
        title: 'Succès',
        description: 'Votre souhait a été envoyé avec succès !',
      });
      navigate('/wishes');
    } catch (error: any) {
      console.error('WishForm - Submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message.includes('permission denied')
          ? 'Vous n\'avez pas la permission d\'enregistrer un souhait.'
          : 'Une erreur est survenue lors de l\'enregistrement de votre souhait : ' + (error.message || 'Erreur inconnue'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Exprimez votre souhait</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Titre
          </label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium">
            Catégorie
          </label>
          <Input
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Envoi en cours...' : 'Envoyer mon souhait'}
        </Button>
      </form>
    </div>
  );
};

export default WishForm;
