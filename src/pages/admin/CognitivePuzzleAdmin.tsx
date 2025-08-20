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

interface Dialogue {
  id: string;
  dialogue_key: string;
  text_content: string;
  description: string;
  category: string;
}

const CognitivePuzzleAdmin: React.FC = () => {
  const { hasRole } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [levels, setLevels] = useState<{ [scenarioId: string]: Level[] }>({});
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [activeTab, setActiveTab] = useState<'scenarios' | 'dialogues'>('scenarios');
  const [loading, setLoading] = useState(true);
  const [editingScenario, setEditingScenario] = useState<string | null>(null);
  const [editingLevel, setEditingLevel] = useState<string | null>(null);
  const [editingDialogue, setEditingDialogue] = useState<string | null>(null);
  const [newScenario, setNewScenario] = useState({
    name: '',
    description: '',
    thumbnail: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    thumbnail: ''
  });
  const [dialogueEditData, setDialogueEditData] = useState({
    text_content: '',
    description: ''
  });
  const [levelEditData, setLevelEditData] = useState({
    name: '',
    description: '',
    enable_timeline: false,
    spatial_required: 0,
    temporal_required: 0
  });
  const [levelActivities, setLevelActivities] = useState<any[]>([]);
  const [levelSpatialSlots, setLevelSpatialSlots] = useState<any[]>([]);
  const [levelTimeSlots, setLevelTimeSlots] = useState<any[]>([]);
  const [spatialSectionTitle, setSpatialSectionTitle] = useState('');
  const [spatialSectionIcon, setSpatialSectionIcon] = useState('');
  const [temporalSectionTitle, setTemporalSectionTitle] = useState('');
  const [temporalSectionIcon, setTemporalSectionIcon] = useState('');

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

  const loadDialogues = async () => {
    try {
      const { data: dialoguesData, error } = await supabase
        .from('cognitive_puzzle_dialogues')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      setDialogues(dialoguesData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des dialogues:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les dialogues',
        variant: 'destructive'
      });
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

  const startEditScenario = (scenario: Scenario) => {
    setEditingScenario(scenario.id);
    setEditFormData({
      name: scenario.name,
      description: scenario.description,
      thumbnail: scenario.thumbnail
    });
  };

  const saveScenarioEdit = async () => {
    if (!editingScenario) return;

    try {
      const { error } = await supabase
        .from('cognitive_puzzle_scenarios')
        .update({
          name: editFormData.name,
          description: editFormData.description,
          thumbnail: editFormData.thumbnail || '🎯'
        })
        .eq('id', editingScenario);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Scénario modifié avec succès'
      });

      setEditingScenario(null);
      loadScenarios();
    } catch (error) {
      console.error('Erreur lors de la modification du scénario:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le scénario',
        variant: 'destructive'
      });
    }
  };

  const startEditLevel = async (level: Level) => {
    setEditingLevel(level.id);
    setLevelEditData({
      name: level.name,
      description: level.description,
      enable_timeline: level.enable_timeline,
      spatial_required: level.spatial_required,
      temporal_required: level.temporal_required
    });

    // Charger les activités, slots spatiaux et temporels
    try {
      const [activitiesRes, spatialRes, temporalRes] = await Promise.all([
        supabase
          .from('cognitive_puzzle_activities')
          .select('*')
          .eq('level_id', level.id),
        supabase
          .from('cognitive_puzzle_spatial_slots')
          .select('*')
          .eq('level_id', level.id),
        supabase
          .from('cognitive_puzzle_time_slots')
          .select('*')
          .eq('level_id', level.id)
      ]);

      setLevelActivities(activitiesRes.data || []);
      setLevelSpatialSlots(spatialRes.data || []);
      setLevelTimeSlots(temporalRes.data || []);

      // Charger les titres existants depuis la base de données
      const { data: levelData } = await supabase
        .from('cognitive_puzzle_levels')
        .select('spatial_title, spatial_icon, temporal_title, temporal_icon')
        .eq('id', level.id)
        .single();

      if (levelData) {
        setSpatialSectionTitle(levelData.spatial_title || 'Plan du quartier');
        setSpatialSectionIcon(levelData.spatial_icon || '🏙️');
        setTemporalSectionTitle(levelData.temporal_title || 'Organiser votre temps');
        setTemporalSectionIcon(levelData.temporal_icon || '⏰');
      } else {
        // Titres par défaut si pas de données
        setSpatialSectionTitle('Plan du quartier');
        setSpatialSectionIcon('🏙️');
        setTemporalSectionTitle('Organiser votre temps');
        setTemporalSectionIcon('⏰');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du niveau:', error);
    }
  };

  const saveLevelEdit = async () => {
    if (!editingLevel) return;

    try {
      // Mise à jour du niveau avec les titres de sections
      const { error: levelError } = await supabase
        .from('cognitive_puzzle_levels')
        .update({
          ...levelEditData,
          spatial_title: spatialSectionTitle || 'Plan du quartier',
          spatial_icon: spatialSectionIcon || '🏙️',
          temporal_title: temporalSectionTitle || 'Organiser votre temps',
          temporal_icon: temporalSectionIcon || '⏰'
        })
        .eq('id', editingLevel);

      if (levelError) throw levelError;

      // Supprimer les anciennes données
      await Promise.all([
        supabase.from('cognitive_puzzle_activities').delete().eq('level_id', editingLevel),
        supabase.from('cognitive_puzzle_spatial_slots').delete().eq('level_id', editingLevel),
        supabase.from('cognitive_puzzle_time_slots').delete().eq('level_id', editingLevel)
      ]);

      // Insérer les nouvelles activités
      if (levelActivities.length > 0) {
        const { error: activitiesError } = await supabase
          .from('cognitive_puzzle_activities')
          .insert(levelActivities.map(activity => ({
            level_id: editingLevel,
            name: activity.name,
            icon: activity.icon,
            category: activity.category
          })));
        if (activitiesError) throw activitiesError;
      }

      // Insérer les nouveaux slots spatiaux
      if (levelSpatialSlots.length > 0) {
        const { error: spatialError } = await supabase
          .from('cognitive_puzzle_spatial_slots')
          .insert(levelSpatialSlots.map(slot => ({
            level_id: editingLevel,
            label: slot.label,
            icon: slot.icon,
            x_position: slot.x_position,
            y_position: slot.y_position
          })));
        if (spatialError) throw spatialError;
      }

      // Insérer les nouveaux slots temporels
      if (levelTimeSlots.length > 0) {
        const { error: temporalError } = await supabase
          .from('cognitive_puzzle_time_slots')
          .insert(levelTimeSlots.map(slot => ({
            level_id: editingLevel,
            label: slot.label,
            icon: slot.icon,
            period: slot.period
          })));
        if (temporalError) throw temporalError;
      }

      toast({
        title: 'Succès',
        description: 'Niveau modifié avec succès'
      });

      setEditingLevel(null);
      loadScenarios();
    } catch (error) {
      console.error('Erreur lors de la modification du niveau:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le niveau',
        variant: 'destructive'
      });
    }
  };

  const startEditDialogue = (dialogue: Dialogue) => {
    setEditingDialogue(dialogue.id);
    setDialogueEditData({
      text_content: dialogue.text_content,
      description: dialogue.description || ''
    });
  };

  const saveDialogueEdit = async () => {
    if (!editingDialogue) return;

    try {
      const { error } = await supabase
        .from('cognitive_puzzle_dialogues')
        .update({
          text_content: dialogueEditData.text_content,
          description: dialogueEditData.description
        })
        .eq('id', editingDialogue);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Dialogue modifié avec succès'
      });

      setEditingDialogue(null);
      loadDialogues();
    } catch (error) {
      console.error('Erreur lors de la modification du dialogue:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le dialogue',
        variant: 'destructive'
      });
    }
  };

  const cancelEdit = () => {
    setEditingScenario(null);
    setEditingLevel(null);
    setEditingDialogue(null);
    setEditFormData({ name: '', description: '', thumbnail: '' });
    setDialogueEditData({ text_content: '', description: '' });
    setLevelEditData({ 
      name: '', 
      description: '', 
      enable_timeline: false, 
      spatial_required: 0, 
      temporal_required: 0 
    });
    setLevelActivities([]);
    setLevelSpatialSlots([]);
    setLevelTimeSlots([]);
    setSpatialSectionTitle('');
    setSpatialSectionIcon('');
    setTemporalSectionTitle('');
    setTemporalSectionIcon('');
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
    loadDialogues();
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
          Gérez les scénarios, niveaux et dialogues du jeu de puzzle cognitif
        </p>
      </div>

      {/* Navigation par onglets */}
      <div className="flex space-x-1 mb-8">
        <Button
          variant={activeTab === 'scenarios' ? 'default' : 'outline'}
          onClick={() => setActiveTab('scenarios')}
          className="px-6"
        >
          Scénarios & Niveaux
        </Button>
        <Button
          variant={activeTab === 'dialogues' ? 'default' : 'outline'}
          onClick={() => setActiveTab('dialogues')}
          className="px-6"
        >
          Dialogues vocaux
        </Button>
      </div>

      {activeTab === 'scenarios' && (
        <>
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
                  {editingScenario === scenario.id ? (
                    // Mode édition
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Nom du scénario</Label>
                          <Input
                            value={editFormData.name}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Emoji/Icône</Label>
                          <Input
                            value={editFormData.thumbnail}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={editFormData.description}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveScenarioEdit} size="sm">
                          <Save className="w-4 h-4 mr-1" />
                          Sauvegarder
                        </Button>
                        <Button onClick={cancelEdit} variant="outline" size="sm">
                          <X className="w-4 h-4 mr-1" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Mode affichage
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => startEditScenario(scenario)}
                        >
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
                  )}
                </CardHeader>
                
                {levels[scenario.id] && levels[scenario.id].length > 0 && (
                  <CardContent>
                     <h4 className="font-medium mb-3">Niveaux configurés :</h4>
                     <div className="space-y-2">
                       {levels[scenario.id].map((level) => (
                         <div
                           key={level.id}
                           className="p-3 bg-muted rounded-lg"
                         >
                           {editingLevel === level.id ? (
                             // Mode édition du niveau
                              <div className="space-y-6">
                                {/* Informations générales du niveau */}
                                <div className="space-y-4">
                                  <h5 className="font-medium text-lg">Informations générales</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label>Nom du niveau</Label>
                                      <Input
                                        value={levelEditData.name}
                                        onChange={(e) => setLevelEditData(prev => ({ ...prev, name: e.target.value }))}
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`timeline-${level.id}`}
                                        checked={levelEditData.enable_timeline}
                                        onChange={(e) => setLevelEditData(prev => ({ ...prev, enable_timeline: e.target.checked }))}
                                        className="rounded"
                                      />
                                      <Label htmlFor={`timeline-${level.id}`}>Timeline activée</Label>
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Description</Label>
                                    <Textarea
                                      value={levelEditData.description}
                                      onChange={(e) => setLevelEditData(prev => ({ ...prev, description: e.target.value }))}
                                      rows={2}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Critères spatiaux requis</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={levelEditData.spatial_required}
                                        onChange={(e) => setLevelEditData(prev => ({ ...prev, spatial_required: parseInt(e.target.value) || 0 }))}
                                      />
                                    </div>
                                    <div>
                                      <Label>Critères temporels requis</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={levelEditData.temporal_required}
                                        onChange={(e) => setLevelEditData(prev => ({ ...prev, temporal_required: parseInt(e.target.value) || 0 }))}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Configuration des sections */}
                                <div className="space-y-4">
                                  <h5 className="font-medium text-lg">Configuration des sections</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Titre section spatiale</Label>
                                      <Input
                                        value={spatialSectionTitle}
                                        onChange={(e) => setSpatialSectionTitle(e.target.value)}
                                        placeholder="Ex: Pièces de la maison"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Icône section spatiale</Label>
                                      <Input
                                        value={spatialSectionIcon}
                                        onChange={(e) => setSpatialSectionIcon(e.target.value)}
                                        placeholder="🏠"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Titre section temporelle</Label>
                                      <Input
                                        value={temporalSectionTitle}
                                        onChange={(e) => setTemporalSectionTitle(e.target.value)}
                                        placeholder="Organiser votre temps"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Icône section temporelle</Label>
                                      <Input
                                        value={temporalSectionIcon}
                                        onChange={(e) => setTemporalSectionIcon(e.target.value)}
                                        placeholder="⏰"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Activités */}
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-medium text-lg">Activités ({levelActivities.length})</h5>
                                    <Button 
                                      size="sm" 
                                      onClick={() => setLevelActivities([...levelActivities, { name: '', icon: '', category: 'activity' }])}
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      Ajouter
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                                    {levelActivities.map((activity, index) => (
                                      <div key={index} className="p-3 border rounded-lg space-y-2">
                                        <div className="flex items-center justify-between">
                                          <Badge variant="outline" className="text-xs">
                                            {activity.category === 'activity' ? 'Activité' : 'Imprévu'}
                                          </Badge>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setLevelActivities(levelActivities.filter((_, i) => i !== index))}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                        <Input
                                          placeholder="Nom de l'activité"
                                          value={activity.name}
                                          onChange={(e) => {
                                            const updated = [...levelActivities];
                                            updated[index].name = e.target.value;
                                            setLevelActivities(updated);
                                          }}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                          <Input
                                            placeholder="🎯"
                                            value={activity.icon}
                                            onChange={(e) => {
                                              const updated = [...levelActivities];
                                              updated[index].icon = e.target.value;
                                              setLevelActivities(updated);
                                            }}
                                          />
                                          <select
                                            value={activity.category}
                                            onChange={(e) => {
                                              const updated = [...levelActivities];
                                              updated[index].category = e.target.value;
                                              setLevelActivities(updated);
                                            }}
                                            className="px-3 py-2 border rounded-md text-sm"
                                          >
                                            <option value="activity">Activité</option>
                                            <option value="twist">Imprévu</option>
                                          </select>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Slots spatiaux */}
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-medium text-lg">Lieux ({levelSpatialSlots.length})</h5>
                                    <Button 
                                      size="sm" 
                                      onClick={() => setLevelSpatialSlots([...levelSpatialSlots, { label: '', icon: '', x_position: 0, y_position: 0 }])}
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      Ajouter
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
                                    {levelSpatialSlots.map((slot, index) => (
                                      <div key={index} className="p-3 border rounded-lg space-y-2">
                                        <div className="flex justify-end">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setLevelSpatialSlots(levelSpatialSlots.filter((_, i) => i !== index))}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                        <Input
                                          placeholder="Nom du lieu"
                                          value={slot.label}
                                          onChange={(e) => {
                                            const updated = [...levelSpatialSlots];
                                            updated[index].label = e.target.value;
                                            setLevelSpatialSlots(updated);
                                          }}
                                        />
                                        <Input
                                          placeholder="🏠"
                                          value={slot.icon}
                                          onChange={(e) => {
                                            const updated = [...levelSpatialSlots];
                                            updated[index].icon = e.target.value;
                                            setLevelSpatialSlots(updated);
                                          }}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                          <Input
                                            placeholder="X"
                                            type="number"
                                            value={slot.x_position}
                                            onChange={(e) => {
                                              const updated = [...levelSpatialSlots];
                                              updated[index].x_position = parseInt(e.target.value) || 0;
                                              setLevelSpatialSlots(updated);
                                            }}
                                          />
                                          <Input
                                            placeholder="Y"
                                            type="number"
                                            value={slot.y_position}
                                            onChange={(e) => {
                                              const updated = [...levelSpatialSlots];
                                              updated[index].y_position = parseInt(e.target.value) || 0;
                                              setLevelSpatialSlots(updated);
                                            }}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Slots temporels */}
                                {levelEditData.enable_timeline && (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h5 className="font-medium text-lg">Moments de la journée ({levelTimeSlots.length})</h5>
                                      <Button 
                                        size="sm" 
                                        onClick={() => setLevelTimeSlots([...levelTimeSlots, { label: '', icon: '', period: 'morning' }])}
                                      >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Ajouter
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
                                      {levelTimeSlots.map((slot, index) => (
                                        <div key={index} className="p-3 border rounded-lg space-y-2">
                                          <div className="flex justify-end">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => setLevelTimeSlots(levelTimeSlots.filter((_, i) => i !== index))}
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                          <Input
                                            placeholder="Nom du moment"
                                            value={slot.label}
                                            onChange={(e) => {
                                              const updated = [...levelTimeSlots];
                                              updated[index].label = e.target.value;
                                              setLevelTimeSlots(updated);
                                            }}
                                          />
                                          <Input
                                            placeholder="🌅"
                                            value={slot.icon}
                                            onChange={(e) => {
                                              const updated = [...levelTimeSlots];
                                              updated[index].icon = e.target.value;
                                              setLevelTimeSlots(updated);
                                            }}
                                          />
                                          <select
                                            value={slot.period}
                                            onChange={(e) => {
                                              const updated = [...levelTimeSlots];
                                              updated[index].period = e.target.value;
                                              setLevelTimeSlots(updated);
                                            }}
                                            className="w-full px-3 py-2 border rounded-md text-sm"
                                          >
                                            <option value="morning">Matin</option>
                                            <option value="noon">Midi</option>
                                            <option value="afternoon">Après-midi</option>
                                            <option value="evening">Soir</option>
                                          </select>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="flex gap-2 pt-4 border-t">
                                  <Button onClick={saveLevelEdit} size="sm">
                                    <Save className="w-4 h-4 mr-1" />
                                    Sauvegarder
                                  </Button>
                                  <Button onClick={cancelEdit} variant="outline" size="sm">
                                    <X className="w-4 h-4 mr-1" />
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                           ) : (
                             // Mode affichage du niveau
                             <div className="flex items-center justify-between">
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
                                 <Button 
                                   variant="ghost" 
                                   size="sm"
                                   onClick={() => startEditLevel(level)}
                                 >
                                   <Edit2 className="w-3 h-3" />
                                 </Button>
                               </div>
                             </div>
                           )}
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
        </>
      )}

      {activeTab === 'dialogues' && (
        <div className="space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Dialogues vocaux</h2>
            <p className="text-muted-foreground">
              Personnalisez tous les messages prononcés par la voix off du jeu. 
              Utilisez {`{variable_name}`} pour insérer des variables dynamiques.
            </p>
          </div>

          {dialogues.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Aucun dialogue configuré.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {['navigation', 'validation', 'activity', 'twist', 'status'].map(category => {
                const categoryDialogues = dialogues.filter(d => d.category === category);
                if (categoryDialogues.length === 0) return null;

                const categoryTitles: Record<string, string> = {
                  navigation: 'Navigation',
                  validation: 'Validation des niveaux',
                  activity: 'Interaction avec les activités',
                  twist: 'Imprévus et défis',
                  status: 'Messages de statut'
                };

                return (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="text-lg">{categoryTitles[category]}</CardTitle>
                      <CardDescription>
                        {categoryDialogues.length} dialogue{categoryDialogues.length > 1 ? 's' : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categoryDialogues.map((dialogue) => (
                          <div key={dialogue.id} className="p-4 border rounded-lg">
                            {editingDialogue === dialogue.id ? (
                              // Mode édition
                              <div className="space-y-4">
                                <div>
                                  <Label>Clé du dialogue</Label>
                                  <Input
                                    value={dialogue.dialogue_key}
                                    disabled
                                    className="bg-muted"
                                  />
                                </div>
                                <div>
                                  <Label>Texte prononcé</Label>
                                  <Textarea
                                    value={dialogueEditData.text_content}
                                    onChange={(e) => setDialogueEditData(prev => ({ ...prev, text_content: e.target.value }))}
                                    rows={3}
                                    placeholder="Texte à prononcer..."
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Variables disponibles : {dialogue.text_content.match(/{[^}]+}/g)?.join(', ') || 'Aucune'}
                                  </p>
                                </div>
                                <div>
                                  <Label>Description (optionnel)</Label>
                                  <Input
                                    value={dialogueEditData.description}
                                    onChange={(e) => setDialogueEditData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Description du dialogue..."
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button onClick={saveDialogueEdit} size="sm">
                                    <Save className="w-4 h-4 mr-1" />
                                    Sauvegarder
                                  </Button>
                                  <Button onClick={cancelEdit} variant="outline" size="sm">
                                    <X className="w-4 h-4 mr-1" />
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // Mode affichage
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      {dialogue.dialogue_key}
                                    </Badge>
                                  </div>
                                  <p className="font-medium mb-1">{dialogue.text_content}</p>
                                  {dialogue.description && (
                                    <p className="text-sm text-muted-foreground">{dialogue.description}</p>
                                  )}
                                  {dialogue.text_content.match(/{[^}]+}/g) && (
                                    <div className="mt-2">
                                      <p className="text-xs text-muted-foreground">
                                        Variables : {dialogue.text_content.match(/{[^}]+}/g)?.join(', ')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => startEditDialogue(dialogue)}
                                >
                                  <Edit2 className="w-4 h-4 mr-1" />
                                  Modifier
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CognitivePuzzleAdmin;