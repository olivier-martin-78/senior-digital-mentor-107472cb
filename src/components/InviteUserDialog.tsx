
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';

const InviteUserDialog = () => {
  const { hasRole, user, profile } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    blogAccess: false,
    wishesAccess: false,
    diaryAccess: false,
    lifeStoryAccess: false
  });

  // Vérifier si l'utilisateur a les droits
  if (!hasRole('editor') && !hasRole('admin')) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour envoyer une invitation",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Générer un token unique
      const token = crypto.randomUUID();

      // Créer l'invitation en base (le trigger créera automatiquement le groupe)
      const { error: invitationError } = await supabase
        .from('invitations')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          invited_by: user.id,
          token,
          blog_access: formData.blogAccess,
          wishes_access: formData.wishesAccess,
          diary_access: formData.diaryAccess,
          life_story_access: formData.lifeStoryAccess
        });

      if (invitationError) throw invitationError;

      // Envoyer l'email d'invitation
      const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          inviterName: profile.display_name || profile.email,
          inviterEmail: profile.email,
          accessTypes: {
            blogAccess: formData.blogAccess,
            wishesAccess: formData.wishesAccess,
            diaryAccess: formData.diaryAccess,
            lifeStoryAccess: formData.lifeStoryAccess
          }
        }
      });

      if (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email:', emailError);
        toast({
          title: "Invitation créée",
          description: `L'invitation a été créée pour ${formData.email}, mais l'email n'a pas pu être envoyé. Contactez l'administrateur.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Invitation envoyée",
          description: `Une invitation a été envoyée à ${formData.email} avec copie à contact@senior-digital-mentor.com`
        });
      }

      // Réinitialiser le formulaire
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        blogAccess: false,
        wishesAccess: false,
        diaryAccess: false,
        lifeStoryAccess: false
      });
      setIsOpen(false);

    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de l\'invitation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'envoi de l'invitation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Inviter un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter un nouvel utilisateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-medium">Accès aux sections</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="blogAccess"
                  checked={formData.blogAccess}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, blogAccess: !!checked }))}
                />
                <Label htmlFor="blogAccess">Albums (Blog)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="wishesAccess"
                  checked={formData.wishesAccess}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, wishesAccess: !!checked }))}
                />
                <Label htmlFor="wishesAccess">Souhaits</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="diaryAccess"
                  checked={formData.diaryAccess}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, diaryAccess: !!checked }))}
                />
                <Label htmlFor="diaryAccess">Journal intime</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lifeStoryAccess"
                  checked={formData.lifeStoryAccess}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, lifeStoryAccess: !!checked }))}
                />
                <Label htmlFor="lifeStoryAccess">Histoire de vie</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer l\'invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;
