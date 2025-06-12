
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { Intervenant } from '@/types/appointments';
import IntervenantForm from './IntervenantForm';

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

  const handleEdit = (intervenant: Intervenant) => {
    setSelectedIntervenant(intervenant);
    setShowForm(true);
  };

  const handleDelete = async (intervenantId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet intervenant ?')) {
      return;
    }

    const { error } = await supabase
      .from('intervenants')
      .delete()
      .eq('id', intervenantId);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'intervenant',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Succès',
      description: 'Intervenant supprimé avec succès',
    });

    onIntervenantUpdate();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedIntervenant(null);
  };

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
        {intervenants.map((intervenant) => (
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

      {intervenants.length === 0 && (
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
    </div>
  );
};

export default IntervenantManager;
