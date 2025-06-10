
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';

const InviteUserDialog = () => {
  const { hasRole, user, profile } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasExistingGroup, setHasExistingGroup] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  // Vérifier si l'utilisateur a les droits (non-reader)
  if (hasRole('reader')) {
    return null;
  }

  // Vérifier si l'utilisateur a déjà un groupe d'invitation
  useEffect(() => {
    const checkExistingGroup = async () => {
      if (!user) return;

      try {
        const { data: existingGroup, error } = await supabase
          .from('invitation_groups')
          .select('id')
          .eq('created_by', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Erreur vérification groupe existant:', error);
          return;
        }

        setHasExistingGroup(!!existingGroup);
      } catch (error) {
        console.error('Erreur lors de la vérification du groupe existant:', error);
      }
    };

    checkExistingGroup();
  }, [user]);

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      // Vérifier dans la table profiles (qui reflète auth.users)
      const { data: existingProfile, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email.trim())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur lors de la vérification de l\'email:', error);
        throw error;
      }

      return !!existingProfile;
    } catch (error: any) {
      console.error('Erreur lors de la vérification de l\'email:', error);
      throw error;
    }
  };

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
    console.log('=== DEBUT ENVOI INVITATION ===');
    console.log('Données du formulaire:', formData);

    try {
      // Vérifier si l'email existe déjà
      const emailExists = await checkEmailExists(formData.email);
      
      if (emailExists) {
        toast({
          title: "Email déjà utilisé",
          description: `Un compte existe déjà avec l'adresse email ${formData.email}. Cette adresse email peut se connecter directement et est déjà membre d'un autre cercle familial ou amical. Elle ne peut appartenir à plus d'un cercle à la fois.`,
          variant: "destructive"
        });
        return;
      }

      // Récupérer ou créer le groupe d'invitation (limité à un seul)
      let { data: existingGroup, error: groupError } = await supabase
        .from('invitation_groups')
        .select('id')
        .eq('created_by', user.id)
        .maybeSingle();

      if (groupError && groupError.code !== 'PGRST116') {
        throw groupError;
      }

      let groupId: string;

      if (!existingGroup) {
        // Créer un nouveau groupe (seulement si aucun n'existe)
        const groupName = `Invités de ${profile.display_name || profile.email}`;
        const { data: newGroup, error: createGroupError } = await supabase
          .from('invitation_groups')
          .insert({
            name: groupName,
            created_by: user.id
          })
          .select('id')
          .single();

        if (createGroupError) throw createGroupError;
        groupId = newGroup.id;
        console.log('✅ Nouveau groupe créé:', groupId);
        setHasExistingGroup(true);
      } else {
        groupId = existingGroup.id;
        console.log('✅ Groupe existant utilisé:', groupId);
      }

      // Vérifier si l'invitation existe déjà
      const { data: existingInvitation, error: checkError } = await supabase
        .from('group_invitation')
        .select('id, status')
        .eq('email', formData.email)
        .eq('group_id', groupId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingInvitation) {
        toast({
          title: "Invitation existante",
          description: `Une invitation existe déjà pour ${formData.email} avec le statut: ${existingInvitation.status}`,
          variant: "destructive"
        });
        return;
      }

      // Créer l'entrée dans group_invitation
      const { error: groupInvitationError } = await supabase
        .from('group_invitation')
        .insert({
          inviter_id: user.id,
          email: formData.email,
          group_id: groupId,
          status: 'pending'
        });

      if (groupInvitationError) throw groupInvitationError;
      console.log('✅ Entrée group_invitation créée');

      // Générer un token unique pour l'invitation classique (pour compatibilité)
      const token = crypto.randomUUID();

      // Créer l'invitation classique (pour l'email) - SANS ACCÈS SPÉCIFIQUES
      const { error: invitationError } = await supabase
        .from('invitations')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          invited_by: user.id,
          token,
          group_id: groupId
          // Plus de champs *_access car l'accès est automatique via le groupe
        });

      if (invitationError) throw invitationError;
      console.log('✅ Invitation classique créée');

      // Préparer les données pour l'email
      const emailData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        inviterName: profile.display_name || profile.email,
        inviterEmail: profile.email
        // Plus d'accessTypes car l'accès est automatique
      };

      console.log('📧 Envoi de l\'email d\'invitation...');

      // Envoyer l'email d'invitation
      const { data: emailResponse, error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: emailData
      });

      console.log('Réponse email:', { data: emailResponse, error: emailError });

      if (emailError) {
        console.error('⚠️ Erreur email:', emailError);
        toast({
          title: "Invitation créée",
          description: `L'invitation a été créée pour ${formData.email}, mais l'email n'a pas pu être envoyé.`,
          variant: "destructive"
        });
      } else {
        console.log('✅ Email envoyé avec succès');
        toast({
          title: "Invitation envoyée",
          description: `Une invitation a été envoyée à ${formData.email}. Cette personne aura accès en lecture à tout votre contenu une fois inscrite.`
        });
      }

      // Réinitialiser le formulaire
      setFormData({
        firstName: '',
        lastName: '',
        email: ''
      });
      setIsOpen(false);

    } catch (error: any) {
      console.error('❌ Erreur lors de l\'envoi de l\'invitation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'envoi de l'invitation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      console.log('=== FIN ENVOI INVITATION ===');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Inviter une personne
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter un nouvel utilisateur</DialogTitle>
        </DialogHeader>
        
        {hasExistingGroup && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> Cette invitation sera ajoutée à votre groupe d'invitation existant.
            </p>
          </div>
        )}
        
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

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Accès automatique :</strong> Cette personne aura accès en lecture à tout votre contenu 
              (blog, journal, histoire de vie, souhaits) une fois son compte créé.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Vérification...' : 'Envoyer l\'invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;
