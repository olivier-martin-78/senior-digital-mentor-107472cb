import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Edit, Trash2, Save, Play, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import ActivityModal from '@/components/admin/ActivityModal';
import SpatialSlotModal from '@/components/admin/SpatialSlotModal';
import TimeSlotModal from '@/components/admin/TimeSlotModal';
import DeleteConfirmDialog from '@/components/admin/DeleteConfirmDialog';

// Sortable Spatial Slot Component
interface SortableSpatialSlotProps {
  slot: SpatialSlot;
  onEdit: (modal: { isOpen: boolean; spatialSlot?: SpatialSlot | null }) => void;
  onDelete: (dialog: { isOpen: boolean; type: 'spatial'; item: SpatialSlot; loading: boolean }) => void;
}

function SortableSpatialSlot({ slot, onEdit, onDelete }: SortableSpatialSlotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-muted rounded-lg transition-all ${
        isDragging ? 'ring-2 ring-primary z-10' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-background rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-2xl">{slot.icon}</span>
        <div>
          <p className="font-medium">{slot.label}</p>
          <p className="text-xs text-muted-foreground">
            Position: ({slot.x_position}, {slot.y_position})
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onEdit({ isOpen: true, spatialSlot: slot })}
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onDelete({
            isOpen: true,
            type: 'spatial',
            item: slot,
            loading: false
          })}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  levels: Level[];
}

interface Level {
  id: string;
  level_number: number;
  name: string;
  description: string;
  enable_timeline: boolean;
  spatial_required: number;
  temporal_required: number;
  spatial_title: string;
  temporal_title: string;
  spatial_icon: string;
  temporal_icon: string;
  activities: Activity[];
  spatialSlots: SpatialSlot[];
  timeSlots: TimeSlot[];
}

interface Activity {
  id: string;
  name: string;
  icon: string;
  category: string;
}

interface SpatialSlot {
  id: string;
  label: string;
  icon: string;
  x_position: number;
  y_position: number;
  display_order: number;
}

interface TimeSlot {
  id: string;
  label: string;
  icon: string;
  period: string;
}

interface GameSettings {
  id: string;
  error_threshold: number;
  object_reduction: number;
  default_accessibility_mode: boolean;
  default_voice_enabled: boolean;
}

export default function ObjectAssemblyAdmin() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('scenarios');
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Modal states
  const [activityModal, setActivityModal] = useState<{
    isOpen: boolean;
    activity?: Activity | null;
  }>({ isOpen: false, activity: null });
  
  const [spatialSlotModal, setSpatialSlotModal] = useState<{
    isOpen: boolean;
    spatialSlot?: SpatialSlot | null;
  }>({ isOpen: false, spatialSlot: null });
  
  const [timeSlotModal, setTimeSlotModal] = useState<{
    isOpen: boolean;
    timeSlot?: TimeSlot | null;
  }>({ isOpen: false, timeSlot: null });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'activity' | 'spatial' | 'temporal' | null;
    item: any;
    loading: boolean;
  }>({ isOpen: false, type: null, item: null, loading: false });

  useEffect(() => {
    loadData();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    try {
      setSettingsLoading(true);
      const { error } = await supabase
        .from('game_settings')
        .update({
          error_threshold: settings.error_threshold,
          object_reduction: settings.object_reduction,
          default_accessibility_mode: settings.default_accessibility_mode,
          default_voice_enabled: settings.default_voice_enabled,
        })
        .eq('id', settings.id);

      if (error) throw error;
      
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch scenarios created for Object Assembly
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('cognitive_puzzle_scenarios')
        .select('*')
        .in('name', [
          'Routine Cuisine', 
          'Organisation Chambre', 
          'Relaxation Salon', 
          'Hygiène Salle de bain', 
          'Entretien Jardin'
        ])
        .order('created_at');

      if (scenariosError) throw scenariosError;

      // Load levels and related data for each scenario
      const scenariosWithData = await Promise.all(
        scenariosData.map(async (scenario) => {
          const { data: levelsData, error: levelsError } = await supabase
            .from('cognitive_puzzle_levels')
            .select('*')
            .eq('scenario_id', scenario.id)
            .order('level_number');

          if (levelsError) throw levelsError;

          const levelsWithData = await Promise.all(
            levelsData.map(async (level) => {
              const [activitiesResult, spatialSlotsResult, timeSlotsResult] = await Promise.all([
                supabase
                  .from('cognitive_puzzle_activities')
                  .select('*')
                  .eq('level_id', level.id),
                supabase
                  .from('cognitive_puzzle_spatial_slots')
                  .select('*')
                  .eq('level_id', level.id)
                  .order('display_order', { ascending: true }),
                supabase
                  .from('cognitive_puzzle_time_slots')
                  .select('*')
                  .eq('level_id', level.id)
              ]);

              return {
                ...level,
                activities: activitiesResult.data || [],
                spatialSlots: spatialSlotsResult.data || [],
                timeSlots: timeSlotsResult.data || [],
              };
            })
          );

          return {
            ...scenario,
            levels: levelsWithData,
          };
        })
      );

      setScenarios(scenariosWithData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop functionality
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !selectedLevelData) {
      return;
    }

    const oldIndex = selectedLevelData.spatialSlots.findIndex(slot => slot.id === active.id);
    const newIndex = selectedLevelData.spatialSlots.findIndex(slot => slot.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Update local state immediately for UI responsiveness
    const newSpatialSlots = arrayMove(selectedLevelData.spatialSlots, oldIndex, newIndex);
    
    // Update scenarios state
    setScenarios(prevScenarios => 
      prevScenarios.map(scenario => 
        scenario.id === selectedScenario
          ? {
              ...scenario,
              levels: scenario.levels.map(level =>
                level.id === selectedLevel
                  ? { ...level, spatialSlots: newSpatialSlots }
                  : level
              )
            }
          : scenario
      )
    );

    // Save new order to database
    try {
      const updates = newSpatialSlots.map((slot, index) => ({
        id: slot.id,
        display_order: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('cognitive_puzzle_spatial_slots')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success('Ordre des zones mis à jour');
    } catch (error) {
      console.error('Error updating display order:', error);
      toast.error('Erreur lors de la mise à jour de l\'ordre');
      // Reload data to restore original order
      loadData();
    }
  };

  const sortBySpatialCoordinates = async () => {
    if (!selectedLevelData) return;

    try {
      // Sort by y_position first, then x_position
      const sortedSlots = [...selectedLevelData.spatialSlots].sort((a, b) => {
        if (a.y_position !== b.y_position) {
          return a.y_position - b.y_position;
        }
        return a.x_position - b.x_position;
      });

      // Update display_order in database
      const updates = sortedSlots.map((slot, index) => ({
        id: slot.id,
        display_order: index
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('cognitive_puzzle_spatial_slots')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success('Zones triées par coordonnées spatiales');
      loadData(); // Reload to reflect new order
    } catch (error) {
      console.error('Error sorting by coordinates:', error);
      toast.error('Erreur lors du tri par coordonnées');
    }
  };

  // Helper functions
  const handleDeleteItem = async () => {
    if (!deleteDialog.item || !deleteDialog.type) return;

    setDeleteDialog(prev => ({ ...prev, loading: true }));

    try {
      let error: any = null;
      let itemName = '';

      switch (deleteDialog.type) {
        case 'activity':
          ({ error } = await supabase
            .from('cognitive_puzzle_activities')
            .delete()
            .eq('id', deleteDialog.item.id));
          itemName = deleteDialog.item.name;
          break;
        case 'spatial':
          ({ error } = await supabase
            .from('cognitive_puzzle_spatial_slots')
            .delete()
            .eq('id', deleteDialog.item.id));
          itemName = deleteDialog.item.label;
          break;
        case 'temporal':
          ({ error } = await supabase
            .from('cognitive_puzzle_time_slots')
            .delete()
            .eq('id', deleteDialog.item.id));
          itemName = deleteDialog.item.label;
          break;
      }

      if (error) throw error;

      toast.success(`${itemName} supprimé avec succès`);
      await loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteDialog({ isOpen: false, type: null, item: null, loading: false });
    }
  };

  const selectedScenarioData = scenarios.find(s => s.id === selectedScenario);
  const selectedLevelData = selectedScenarioData?.levels.find(l => l.id === selectedLevel);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement de l'administration Object Assembly...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/cognitive-puzzle')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'administration
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Administration Object Assembly</h1>
            <p className="text-muted-foreground">
              Configuration du jeu "Assemblage d'Objets dans l'Espace et le Temps"
            </p>
          </div>
        </div>
        
        <Button onClick={() => navigate('/activities/games/object-assembly')} className="gap-2">
          <Play className="h-4 w-4" />
          Tester le jeu
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scenarios">Scénarios</TabsTrigger>
          <TabsTrigger value="levels">Niveaux</TabsTrigger>
          <TabsTrigger value="objects">Objets & Zones</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarios.map((scenario) => (
              <Card 
                key={scenario.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedScenario === scenario.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedScenario(scenario.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                    <Badge variant="secondary">
                      {scenario.levels.length} niveaux
                    </Badge>
                  </div>
                  <CardDescription>{scenario.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {scenario.levels.map((level) => (
                        <Badge key={level.id} variant="outline" className="text-xs">
                          N{level.level_number}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedScenario(scenario.id);
                          setActiveTab('levels');
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/activities/games/object-assembly?scenario=${scenario.id}`);
                        }}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Tester
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Levels Tab */}
        <TabsContent value="levels" className="space-y-6">
          {selectedScenarioData ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  Niveaux - {selectedScenarioData.name}
                </h3>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau niveau
                </Button>
              </div>
              
              <div className="grid gap-4">
                {selectedScenarioData.levels.map((level) => (
                  <Card 
                    key={level.id}
                    className={`cursor-pointer transition-all ${
                      selectedLevel === level.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      setSelectedLevel(level.id);
                      setActiveTab('objects');
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Niveau {level.level_number}: {level.name}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge variant={level.enable_timeline ? "default" : "secondary"}>
                            {level.enable_timeline ? 'Spatial + Temporel' : 'Spatial uniquement'}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>{level.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Objets:</span>
                          <p className="text-muted-foreground">{level.activities.length}</p>
                        </div>
                        <div>
                          <span className="font-medium">Zones spatiales:</span>
                          <p className="text-muted-foreground">{level.spatialSlots.length}</p>
                        </div>
                        <div>
                          <span className="font-medium">Étapes temporelles:</span>
                          <p className="text-muted-foreground">{level.timeSlots.length}</p>
                        </div>
                        <div>
                          <span className="font-medium">Requis:</span>
                          <p className="text-muted-foreground">
                            {level.spatial_required}S / {level.temporal_required}T
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Sélectionnez un scénario pour voir ses niveaux</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Objects & Zones Tab */}
        <TabsContent value="objects" className="space-y-6">
          {selectedLevelData ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  Configuration - {selectedLevelData.name}
                </h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setActivityModal({ isOpen: true, activity: null })}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter objet
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setSpatialSlotModal({ isOpen: true, spatialSlot: null })}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter zone
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Objects */}
                <Card>
                  <CardHeader>
                    <CardTitle>Objets à placer ({selectedLevelData.activities.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedLevelData.activities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{activity.icon}</span>
                          <div>
                            <p className="font-medium">{activity.name}</p>
                            <p className="text-xs text-muted-foreground">{activity.category}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setActivityModal({ isOpen: true, activity })}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setDeleteDialog({
                              isOpen: true,
                              type: 'activity',
                              item: activity,
                              loading: false
                            })}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Spatial Zones */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Zones spatiales ({selectedLevelData.spatialSlots.length})</CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={sortBySpatialCoordinates}
                          className="gap-2"
                        >
                          <ArrowUp className="h-3 w-3" />
                          Trier par coordonnées
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Glissez-déposez pour réorganiser l'ordre d'affichage dans l'administration (les coordonnées X,Y contrôlent toujours la position dans le jeu)
                    </p>
                  </CardHeader>
                  <CardContent>
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext 
                        items={selectedLevelData.spatialSlots.map(slot => slot.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {selectedLevelData.spatialSlots.map((slot) => (
                            <SortableSpatialSlot key={slot.id} slot={slot} onEdit={setSpatialSlotModal} onDelete={setDeleteDialog} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              {selectedLevelData.enable_timeline && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Étapes temporelles ({selectedLevelData.timeSlots.length})</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                        onClick={() => setTimeSlotModal({ isOpen: true, timeSlot: null })}
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter étape
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      {selectedLevelData.timeSlots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{slot.icon}</span>
                            <div>
                              <p className="font-medium">{slot.label}</p>
                              <p className="text-xs text-muted-foreground capitalize">{slot.period}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setTimeSlotModal({ isOpen: true, timeSlot: slot })}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setDeleteDialog({
                                isOpen: true,
                                type: 'temporal',
                                item: slot,
                                loading: false
                              })}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Sélectionnez un niveau pour configurer ses objets et zones</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres globaux du jeu</CardTitle>
              <CardDescription>
                Configuration générale pour Object Assembly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <h4 className="font-medium">Adaptation automatique</h4>
                   <div className="space-y-2">
                     <Label>Seuil d'erreurs pour adaptation</Label>
                     <Input 
                       type="number" 
                       min="1"
                       max="10"
                       value={settings?.error_threshold || 3}
                       onChange={(e) => setSettings(prev => prev ? { ...prev, error_threshold: parseInt(e.target.value) || 3 } : null)}
                     />
                     <p className="text-xs text-muted-foreground">
                       Après ce nombre d'erreurs, le mode adapté se déclenche automatiquement
                     </p>
                   </div>
                   <div className="space-y-2">
                     <Label>Réduction d'objets en mode adapté</Label>
                     <Select 
                       value={settings?.object_reduction?.toString() || "2"}
                       onValueChange={(value) => setSettings(prev => prev ? { ...prev, object_reduction: parseInt(value) } : null)}
                     >
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="1">-1 objet</SelectItem>
                         <SelectItem value="2">-2 objets</SelectItem>
                         <SelectItem value="3">-3 objets</SelectItem>
                         <SelectItem value="4">-4 objets</SelectItem>
                       </SelectContent>
                     </Select>
                     <p className="text-xs text-muted-foreground">
                       Nombre d'objets retirés automatiquement en mode adapté
                     </p>
                   </div>
                 </div>

                 <div className="space-y-4">
                   <h4 className="font-medium">Accessibilité</h4>
                    <div className="flex items-center justify-between">
                      <Label>Mode accessibilité par défaut</Label>
                      <input 
                        type="checkbox" 
                        checked={settings?.default_accessibility_mode ?? false}
                        onChange={(e) => setSettings(prev => prev ? { ...prev, default_accessibility_mode: e.target.checked } : null)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Synthèse vocale activée par défaut</Label>
                      <input 
                        type="checkbox" 
                        checked={settings?.default_voice_enabled ?? true}
                        onChange={(e) => setSettings(prev => prev ? { ...prev, default_voice_enabled: e.target.checked } : null)}
                      />
                    </div>
                 </div>
              </div>

               <div className="pt-4 border-t">
                 <Button 
                   onClick={saveSettings}
                   disabled={settingsLoading || !settings}
                   className="gap-2"
                 >
                   <Save className="h-4 w-4" />
                   {settingsLoading ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
                 </Button>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedLevel && (
        <>
          <ActivityModal
            isOpen={activityModal.isOpen}
            onClose={() => setActivityModal({ isOpen: false, activity: null })}
            onSave={loadData}
            levelId={selectedLevel}
            activity={activityModal.activity}
          />
          
          <SpatialSlotModal
            isOpen={spatialSlotModal.isOpen}
            onClose={() => setSpatialSlotModal({ isOpen: false, spatialSlot: null })}
            onSave={loadData}
            levelId={selectedLevel}
            spatialSlot={spatialSlotModal.spatialSlot}
          />
          
          <TimeSlotModal
            isOpen={timeSlotModal.isOpen}
            onClose={() => setTimeSlotModal({ isOpen: false, timeSlot: null })}
            onSave={loadData}
            levelId={selectedLevel}
            timeSlot={timeSlotModal.timeSlot}
          />
        </>
      )}

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, type: null, item: null, loading: false })}
        onConfirm={handleDeleteItem}
        loading={deleteDialog.loading}
        title={`Supprimer ${
          deleteDialog.type === 'activity' ? "l'objet" : 
          deleteDialog.type === 'spatial' ? 'la zone spatiale' : 
          "l'étape temporelle"
        }`}
        description={`Êtes-vous sûr de vouloir supprimer ${
          deleteDialog.type === 'activity' ? `l'objet "${deleteDialog.item?.name}"` : 
          deleteDialog.type === 'spatial' ? `la zone "${deleteDialog.item?.label}"` : 
          `l'étape "${deleteDialog.item?.label}"`
        } ? Cette action est irréversible.`}
      />
    </div>
  );
}