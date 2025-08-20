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
import { ArrowLeft, Plus, Edit, Trash2, Save, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
}

interface TimeSlot {
  id: string;
  label: string;
  icon: string;
  period: string;
}

export default function ObjectAssemblyAdmin() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
                  .eq('level_id', level.id),
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

      <Tabs defaultValue="scenarios" className="space-y-6">
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
                      <Button variant="outline" size="sm" className="flex-1">
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
                    onClick={() => setSelectedLevel(level.id)}
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
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter objet
                  </Button>
                  <Button variant="outline" className="gap-2">
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
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
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
                    <CardTitle>Zones spatiales ({selectedLevelData.spatialSlots.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedLevelData.spatialSlots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{slot.icon}</span>
                          <div>
                            <p className="font-medium">{slot.label}</p>
                            <p className="text-xs text-muted-foreground">
                              Position: ({slot.x_position}, {slot.y_position})
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              {selectedLevelData.enable_timeline && (
                <Card>
                  <CardHeader>
                    <CardTitle>Étapes temporelles ({selectedLevelData.timeSlots.length})</CardTitle>
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
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
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
                    <Input type="number" defaultValue="3" />
                  </div>
                  <div className="space-y-2">
                    <Label>Réduction d'objets en mode adapté</Label>
                    <Select defaultValue="2">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">-1 objet</SelectItem>
                        <SelectItem value="2">-2 objets</SelectItem>
                        <SelectItem value="3">-3 objets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Accessibilité</h4>
                  <div className="flex items-center justify-between">
                    <Label>Mode accessibilité par défaut</Label>
                    <input type="checkbox" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Synthèse vocale activée</Label>
                    <input type="checkbox" defaultChecked />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  Sauvegarder les paramètres
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}