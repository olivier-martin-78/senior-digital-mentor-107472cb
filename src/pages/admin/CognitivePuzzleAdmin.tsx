import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Scenario {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  created_at: string;
  levels_count: number;
}

interface Level {
  id: string;
  scenario_id: string;
  level_number: number;
  name: string;
  description: string;
  enable_timeline: boolean;
  spatial_required: number;
  temporal_required: number;
}

const CognitivePuzzleAdmin: React.FC = () => {
  const { hasRole } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [levels, setLevels] = useState<{ [scenarioId: string]: Level[] }>({});
  const [loading, setLoading] = useState(true);
  const [editingScenario, setEditingScenario] = useState<string | null>(null);
  const [newScenario, setNewScenario] = useState({
    name: '',
    description: '',
    thumbnail: ''
  });

  // Vérifier les permissions admin
  if (!hasRole('admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  const loadScenarios = async () => {
    try {
      setLoading(true);
      
      // Charger les scénarios avec le nombre de niveaux
      const { data: scenariosData, error } = await supabase
        .from('cognitive_puzzle_scenarios')
        .select(`
          *,
          cognitive_puzzle_levels(count)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedScenarios = scenariosData?.map(scenario => ({
        ...scenario,
        levels_count: scenario.cognitive_puzzle_levels?.[0]?.count || 0
      })) || [];

      setScenarios(formattedScenarios);

      // Charger les niveaux pour chaque scénario
      const levelsData: { [scenarioId: string]: Level[] } = {};
      
      for (const scenario of scenariosData || []) {
        const { data: scenarioLevels } = await supabase
          .from('cognitive_puzzle_levels')
          .select('*')
          .eq('scenario_id', scenario.id)
          .order('level_number');
        
        levelsData[scenario.id] = scenarioLevels || [];
      }
      
      setLevels(levelsData);
    } catch (error) {
      console.error('Erreur lors du chargement des scénarios:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les scénarios',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createScenario = async () => {
    if (!newScenario.name || !newScenario.description) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('cognitive_puzzle_scenarios')
        .insert({
          name: newScenario.name,
          description: newScenario.description,
          thumbnail: newScenario.thumbnail || '🎯'
        });

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Scénario créé avec succès'
      });

      setNewScenario({ name: '', description: '', thumbnail: '' });
      loadScenarios();
    } catch (error) {
      console.error('Erreur lors de la création du scénario:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le scénario',
        variant: 'destructive'
      });
    }
  };

  const deleteScenario = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce scénario ? Cette action supprimera également tous les niveaux associés.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cognitive_puzzle_scenarios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Scénario supprimé avec succès'
      });

      loadScenarios();
    } catch (error) {
      console.error('Erreur lors de la suppression du scénario:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le scénario',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    loadScenarios();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Chargement des scénarios...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Administration - Puzzles Cognitifs
        </h1>
        <p className="text-muted-foreground">
          Gérez les scénarios et niveaux du jeu de puzzle cognitif
        </p>
      </div>

      {/* Formulaire de création de scénario */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Créer un nouveau scénario
          </CardTitle>
          <CardDescription>
            Ajoutez un nouveau scénario de puzzle cognitif
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="name">Nom du scénario *</Label>
              <Input
                id="name"
                value={newScenario.name}
                onChange={(e) => setNewScenario(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Journée à la maison"
              />
            </div>
            <div>
              <Label htmlFor="thumbnail">Emoji/Icône</Label>
              <Input
                id="thumbnail"
                value={newScenario.thumbnail}
                onChange={(e) => setNewScenario(prev => ({ ...prev, thumbnail: e.target.value }))}
                placeholder="🏠"
              />
            </div>
          </div>
          <div className="mb-4">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={newScenario.description}
              onChange={(e) => setNewScenario(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Organisez votre journée à domicile avec soin..."
              rows={3}
            />
          </div>
          <Button onClick={createScenario} className="w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Créer le scénario
          </Button>
        </CardContent>
      </Card>

      {/* Liste des scénarios */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Scénarios existants</h2>
        
        {scenarios.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Aucun scénario créé pour le moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {scenarios.map((scenario) => (
              <Card key={scenario.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{scenario.thumbnail}</div>
                      <div>
                        <CardTitle className="text-xl">{scenario.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {scenario.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {levels[scenario.id]?.length || 0} niveaux
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteScenario(scenario.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {levels[scenario.id] && levels[scenario.id].length > 0 && (
                  <CardContent>
                    <h4 className="font-medium mb-3">Niveaux configurés :</h4>
                    <div className="space-y-2">
                      {levels[scenario.id].map((level) => (
                        <div
                          key={level.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              Niveau {level.level_number}: {level.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {level.description}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                Spatial: {level.spatial_required}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                Temporel: {level.temporal_required}
                              </Badge>
                              {level.enable_timeline && (
                                <Badge variant="secondary" className="text-xs">
                                  Timeline activée
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CognitivePuzzleAdmin;