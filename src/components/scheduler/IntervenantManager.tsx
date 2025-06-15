
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Users, Share2 } from 'lucide-react';
import { Intervenant } from '@/types/appointments';
import IntervenantForm from './IntervenantForm';
import IntervenantSharingDialog from './IntervenantSharingDialog';

interface IntervenantManagerProps {
  intervenants: Intervenant[];
  onIntervenantUpdate: () => void;
}

const IntervenantManager: React.FC<IntervenantManagerProps> = ({
  intervenants,
  onIntervenantUpdate,
}) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedIntervenant, setSelectedIntervenant] = useState<Intervenant | null>(null);
  const [showSharingDialog, setShowSharingDialog] = useState(false);
  const [intervenantToShare, setIntervenantToShare] = useState<Intervenant | null>(null);

  console.log('🔍 INTERVENANT_MANAGER - Intervenants reçus:', intervenants.length);
  console.log('🔍 INTERVENANT_MANAGER - Utilisateur connecté:', user?.id);

  const handleEdit = (intervenant: Intervenant) => {
    console.log('🔍 INTERVENANT_MANAGER - Édition intervenant:', intervenant.id, 'créé par:', intervenant.created_by);
    setSelectedIntervenant(intervenant);
    setShowForm(true);
  };

  const handleShare = (intervenant: Intervenant) => {
    setIntervenantToShare(intervenant);
    setShowSharingDialog(true);
  };

  const handleDelete = async (intervenantId: string) => {
    const intervenantToDelete = intervenants.find(i => i.id === intervenantId);
    console.log('🔍 INTERVENANT_MANAGER - Suppression intervenant:', intervenantId, 'créé par:', intervenantToDelete?.created_by);

    try {
      // Vérifier si l'intervenant peut être supprimé
      const { data: canDelete, error: checkError } = await supabase.rpc('can_delete_intervenant', {
        intervenant_id_param: intervenantId
      });

      if (checkError) throw checkError;

      if (!canDelete) {
        toast({
          title: 'Suppression impossible',
          description: 'Cet intervenant est assigné à des rendez-vous et ne peut pas être supprimé.',
          variant: 'destructive'
        });
        return;
      }

      if (!confirm('Êtes-vous sûr de vouloir supprimer cet intervenant ?')) {
        return;
      }

      // Vérifier que l'utilisateur a le droit de supprimer cet intervenant
      if (intervenantToDelete && intervenantToDelete.created_by !== user?.id) {
        toast({
          title: 'Erreur',
          description: 'Vous ne pouvez supprimer que les intervenants que vous avez créés',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('intervenants')
        .delete()
        .eq('id', intervenantId)
        .eq('created_by', user?.id); // Double vérification côté requête

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Intervenant supprimé avec succès',
      });

      onIntervenantUpdate();
    } catch (error: any) {
      console.error('🔍 INTERVENANT_MANAGER - Erreur suppression:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de supprimer l'intervenant: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedIntervenant(null);
  };

  // Filtrer les intervenants pour ne montrer que ceux créés par l'utilisateur connecté
  const userIntervenants = intervenants.filter(intervenant => 
    intervenant.created_by === user?.id
  );

  console.log('🔍 INTERVENANT_MANAGER - Intervenants filtrés pour l\'utilisateur:', userIntervenants.length);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-tranches-charcoal">Gestion des Intervenants</h2>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvel intervenant
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userIntervenants.map((intervenant) => (
          <Card key={intervenant.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                {intervenant.first_name} {intervenant.last_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {intervenant.speciality && (
                <p className="text-sm text-gray-600">
                  <strong>Spécialité:</strong> {intervenant.speciality}
                </p>
              )}
              {intervenant.email && (
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {intervenant.email}
                </p>
              )}
              {intervenant.phone && (
                <p className="text-sm text-gray-600">
                  <strong>Téléphone:</strong> {intervenant.phone}
                </p>
              )}
              <div className="flex items-center gap-2 pt-2">
                <div className={`w-2 h-2 rounded-full ${intervenant.active ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">{intervenant.active ? 'Actif' : 'Inactif'}</span>
              </div>
              <div className="flex gap-2 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare(intervenant)}
                  title="Partager l'intervenant"
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Partager
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(intervenant)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(intervenant.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {userIntervenants.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun intervenant</h3>
            <p className="text-gray-500 mb-4">Commencez par ajouter votre premier intervenant.</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un intervenant
            </Button>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <IntervenantForm
          intervenant={selectedIntervenant}
          onSave={() => {
            onIntervenantUpdate();
            handleFormClose();
          }}
          onCancel={handleFormClose}
        />
      )}

      <IntervenantSharingDialog
        intervenant={intervenantToShare}
        open={showSharingDialog}
        onOpenChange={setShowSharingDialog}
        onSuccess={onIntervenantUpdate}
      />
    </div>
  );
};

export default IntervenantManager;
