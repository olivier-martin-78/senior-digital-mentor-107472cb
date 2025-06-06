
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Caregiver } from '@/types/appointments';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import CaregiverForm from './CaregiverForm';

interface CaregiverManagerProps {
  clientId: string;
}

const CaregiverManager: React.FC<CaregiverManagerProps> = ({ clientId }) => {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);

  useEffect(() => {
    loadCaregivers();
  }, [clientId]);

  const loadCaregivers = async () => {
    try {
      const { data, error } = await supabase
        .from('caregivers')
        .select('*')
        .eq('client_id', clientId)
        .order('last_name', { ascending: true });

      if (error) throw error;
      setCaregivers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des proches aidants:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les proches aidants',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCaregiverSave = () => {
    loadCaregivers();
    setShowForm(false);
    setSelectedCaregiver(null);
  };

  const handleEditCaregiver = (caregiver: Caregiver) => {
    setSelectedCaregiver(caregiver);
    setShowForm(true);
  };

  const handleDeleteCaregiver = async (caregiverId: string) => {
    const { error } = await supabase
      .from('caregivers')
      .delete()
      .eq('id', caregiverId);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le proche aidant',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Succès',
      description: 'Proche aidant supprimé avec succès',
    });

    loadCaregivers();
  };

  if (loading) {
    return <div>Chargement des proches aidants...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Proches aidants</h3>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>

      {caregivers.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucun proche aidant enregistré</p>
      ) : (
        <div className="space-y-2">
          {caregivers.map(caregiver => (
            <div key={caregiver.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <div className="font-medium">
                  {caregiver.first_name} {caregiver.last_name}
                </div>
                <div className="text-gray-600">
                  {caregiver.relationship_type}
                </div>
                {caregiver.phone && (
                  <div className="text-gray-600">Tél: {caregiver.phone}</div>
                )}
                {caregiver.email && (
                  <div className="text-gray-600">Email: {caregiver.email}</div>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditCaregiver(caregiver)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteCaregiver(caregiver.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <CaregiverForm
          clientId={clientId}
          caregiver={selectedCaregiver}
          onSave={handleCaregiverSave}
          onCancel={() => {
            setShowForm(false);
            setSelectedCaregiver(null);
          }}
        />
      )}
    </div>
  );
};

export default CaregiverManager;
