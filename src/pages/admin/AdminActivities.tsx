import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useActivities } from '@/hooks/useActivities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, RefreshCw, ChevronDown } from 'lucide-react';
import { Activity } from '@/hooks/useActivities';
import ActivityThumbnailUploader from '@/components/activities/ActivityThumbnailUploader';
import ActivityEditForm from '@/components/activities/ActivityEditForm';
import ActivityCard from '@/components/activities/ActivityCard';
import SubActivitySelector from '@/components/activities/SubActivitySelector';
import { useAuth } from '@/contexts/AuthContext';
import { useCanCreateActivities } from '@/hooks/useCanCreateActivities';
import { CreateMemoryGameForm } from '@/components/admin/CreateMemoryGameForm';
import { EditMemoryGameForm } from '@/components/admin/EditMemoryGameForm';
import CreateMusicQuizForm from '@/components/admin/CreateMusicQuizForm';
import EditMusicQuizForm from '@/components/admin/EditMusicQuizForm';
import { CreateTimelineForm } from '@/components/activities/timeline/CreateTimelineForm';
import { EditTimelineForm } from '@/components/activities/timeline/EditTimelineForm';
import { TimelineData } from '@/types/timeline';
import QuizConverter from '@/components/admin/QuizConverter';
import CreateDictationForm from '@/components/admin/CreateDictationForm';
import EditDictationForm from '@/components/admin/EditDictationForm';
import { CreateSpotDifferencesForm } from '@/components/admin/CreateSpotDifferencesForm';
import { EditSpotDifferencesForm } from '@/components/admin/EditSpotDifferencesForm';

const activityTypes = [
  { value: 'meditation', label: 'Relaxation' },
  { value: 'games', label: 'Jeux cognitifs' },
  { value: 'exercises', label: 'Gym douce' },
];

const AdminActivities = () => {
  const { type } = useParams<{ type: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activities, refetch, canEditActivity } = useActivities(type || '');
  const { toast } = useToast();
  const { user } = useAuth();
  const { canCreate, loading } = useCanCreateActivities();
  const [showForm, setShowForm] = useState(false);
  const [showMemoryManager, setShowMemoryManager] = useState(false);
  const [showMusicQuizForm, setShowMusicQuizForm] = useState(false);
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [showDictationForm, setShowDictationForm] = useState(false);
  const [showSpotDifferencesForm, setShowSpotDifferencesForm] = useState(false);
  const [showQuizConverter, setShowQuizConverter] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState({
    activity_type: type || '',
    title: '',
    link: '',
    thumbnail_url: '',
    activity_date: '',
    sub_activity_tag_id: '',
    shared_globally: false,
    use_iframe: false,
    iframe_code: '',
  });

  // Vérifier si l'utilisateur peut utiliser la fonction de partage global
  const canShareGlobally = user?.email === 'olivier.martin.78000@gmail.com' && 
                          ['meditation', 'games', 'exercises'].includes(type || '');

  // Gérer le paramètre edit dans l'URL
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && activities.length > 0) {
      const activityToEdit = activities.find(activity => activity.id === editId);
      if (activityToEdit) {
        setEditingActivity(activityToEdit);
        setShowForm(false);
        // Nettoyer le paramètre edit de l'URL après avoir trouvé l'activité
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('edit');
          return newParams;
        });
      }
    }
  }, [activities, searchParams, setSearchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour créer une activité',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Préparer les données à insérer, en excluant use_iframe qui n'existe pas en base
      const { use_iframe, ...dataWithoutUseIframe } = formData;

      const dataToInsert = {
        ...dataWithoutUseIframe,
        created_by: user.id,
        activity_date: formData.activity_date || null,
        thumbnail_url: formData.thumbnail_url || null,
        sub_activity_tag_id: formData.sub_activity_tag_id || null,
        shared_globally: canShareGlobally ? formData.shared_globally : false,
        link: formData.use_iframe ? '' : formData.link,
        iframe_code: formData.use_iframe ? formData.iframe_code : null,
      };

      const { error } = await supabase
        .from('activities')
        .insert([dataToInsert]);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Activité ajoutée avec succès',
      });

      setFormData({ 
        activity_type: type || '', 
        title: '', 
        link: '', 
        thumbnail_url: '', 
        activity_date: '',
        sub_activity_tag_id: '',
        shared_globally: false,
        use_iframe: false,
        iframe_code: '',
      });
      setShowForm(false);
      refetch();
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'activité',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Activité supprimée avec succès',
      });

      refetch();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'activité',
        variant: 'destructive',
      });
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setShowForm(false);
    setShowMemoryManager(false);
    setShowMusicQuizForm(false);
    setShowTimelineForm(false);
    setShowDictationForm(false);
    setShowSpotDifferencesForm(false);
    setShowQuizConverter(false);
  };

  const handleSaveEdit = () => {
    setEditingActivity(null);
    refetch();
  };

  const handleCancelEdit = () => {
    setEditingActivity(null);
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const currentActivityType = activityTypes.find(at => at.value === type);

  // Afficher un loader pendant la vérification des permissions
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-tranches-sage" />
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Rediriger si l'utilisateur n'a pas les permissions
  if (!canCreate) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas les permissions nécessaires pour créer des activités.
          </p>
          <p className="text-sm text-gray-500">
            Contactez un administrateur ou souscrivez à un plan "Professionnel" pour obtenir cette fonctionnalité.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-20 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Administration : {currentActivityType?.label}
            </h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Formulaires
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Créer une nouvelle activité</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowForm(!showForm)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une activité
                </DropdownMenuItem>
                {type === 'games' && (
                  <>
                    <DropdownMenuItem onClick={() => setShowMemoryManager(!showMemoryManager)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer jeu des pairs
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowMusicQuizForm(!showMusicQuizForm)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer quiz
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowTimelineForm(!showTimelineForm)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer frise chronologique
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowDictationForm(!showDictationForm)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer dictée
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowSpotDifferencesForm(!showSpotDifferencesForm)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer jeu des 7 erreurs
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {showMemoryManager && type === 'games' && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Créer une série de jeu des pairs
                  <Button 
                    onClick={() => setShowMemoryManager(false)}
                    variant="outline"
                    size="sm"
                  >
                    Fermer
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CreateMemoryGameForm 
                  onSuccess={() => setShowMemoryManager(false)}
                  onCancel={() => setShowMemoryManager(false)}
                />
              </CardContent>
            </Card>
          )}

          {showMusicQuizForm && type === 'games' && (
            <div className="mb-8">
              <CreateMusicQuizForm 
                onSuccess={() => {
                  setShowMusicQuizForm(false);
                  refetch();
                }}
                onCancel={() => setShowMusicQuizForm(false)}
              />
            </div>
          )}

          {showTimelineForm && type === 'games' && (
            <div className="mb-8">
              <CreateTimelineForm 
                onSubmit={async (data: TimelineData & { subActivityTagId?: string }) => {
                  try {
                    const dataToInsert = {
                      activity_type: 'games',
                      title: data.timelineName,
                      iframe_code: JSON.stringify(data),
                      created_by: user?.id,
                      shared_globally: canShareGlobally ? data.shareGlobally : false,
                      link: '',
                      thumbnail_url: data.thumbnailUrl || null,
                      activity_date: null,
                      sub_activity_tag_id: data.subActivityTagId || null,
                    };

                    const { error } = await supabase
                      .from('activities')
                      .insert([dataToInsert]);

                    if (error) throw error;

                    toast({
                      title: 'Succès',
                      description: 'Frise chronologique créée avec succès',
                    });

                    setShowTimelineForm(false);
                    refetch();
                  } catch (error) {
                    console.error('Erreur lors de la création:', error);
                    toast({
                      title: 'Erreur',
                      description: 'Impossible de créer la frise chronologique',
                      variant: 'destructive',
                    });
                  }
                }}
                onCancel={() => setShowTimelineForm(false)}
              />
            </div>
          )}

          {showDictationForm && type === 'games' && (
            <div className="mb-8">
              <CreateDictationForm 
                onSuccess={() => {
                  setShowDictationForm(false);
                  refetch();
                }}
                onCancel={() => setShowDictationForm(false)}
              />
            </div>
          )}

          {showSpotDifferencesForm && type === 'games' && (
            <div className="mb-8">
              <CreateSpotDifferencesForm 
                onSuccess={() => {
                  setShowSpotDifferencesForm(false);
                  refetch();
                }}
                onClose={() => setShowSpotDifferencesForm(false)}
              />
            </div>
          )}

          {editingActivity && (
            <div className="mb-8">
              {(() => {
                // Vérifier le type de jeu/activité
                try {
                  const gameData = editingActivity.iframe_code ? JSON.parse(editingActivity.iframe_code) : null;
                  if (gameData?.type === 'memory_game') {
                    return (
                      <EditMemoryGameForm
                        activity={editingActivity}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                      />
                    );
                  } else if (gameData?.type === 'music_quiz') {
                    return (
                      <EditMusicQuizForm
                        activity={editingActivity}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                      />
                    );
                  } else if (gameData?.type === 'dictation') {
                    return (
                      <EditDictationForm
                        activity={editingActivity}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                      />
                    );
                  } else if (gameData?.type === 'spot_differences') {
                    return (
                      <EditSpotDifferencesForm
                        activity={editingActivity}
                        onSuccess={handleSaveEdit}
                        onClose={handleCancelEdit}
                      />
                    );
                  } else if (gameData?.timelineName) {
                    return (
                      <EditTimelineForm
                        initialData={gameData}
                        initialSubActivityTagId={editingActivity.sub_activity_tag_id}
                        onSubmit={async (data: TimelineData & { subActivityTagId?: string }) => {
                          try {
                            const { error } = await supabase
                              .from('activities')
                              .update({
                                title: data.timelineName,
                                iframe_code: JSON.stringify(data),
                                sub_activity_tag_id: data.subActivityTagId || null,
                                shared_globally: canShareGlobally ? data.shareGlobally : false,
                                thumbnail_url: data.thumbnailUrl || null,
                              })
                              .eq('id', editingActivity.id);

                            if (error) throw error;

                            toast({
                              title: 'Succès',
                              description: 'Frise chronologique modifiée avec succès',
                            });

                            handleSaveEdit();
                          } catch (error) {
                            console.error('Erreur lors de la modification:', error);
                            toast({
                              title: 'Erreur',
                              description: 'Impossible de modifier la frise chronologique',
                              variant: 'destructive',
                            });
                          }
                        }}
                        onCancel={handleCancelEdit}
                      />
                    );
                  }
                } catch (e) {
                  // Si ce n'est pas du JSON valide, utiliser le formulaire générique
                }
                
                // Formulaire générique pour les autres types d'activités
                return (
                  <ActivityEditForm
                    activity={editingActivity}
                    onSave={handleSaveEdit}
                    onCancel={handleCancelEdit}
                  />
                );
              })()}
            </div>
          )}

          {showForm && !editingActivity && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Nouvelle activité</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="activity_type">Type d'activité</Label>
                    <Select
                      value={formData.activity_type}
                      onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {activityTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <SubActivitySelector
                    activityType={formData.activity_type}
                    selectedSubTagId={formData.sub_activity_tag_id}
                    onSubTagChange={(subTagId) => setFormData({ ...formData, sub_activity_tag_id: subTagId || '' })}
                  />

                  <div>
                    <Label htmlFor="title">Titre</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Titre de l'activité"
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use_iframe"
                      checked={formData.use_iframe}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, use_iframe: checked as boolean })
                      }
                    />
                    <Label htmlFor="use_iframe" className="text-sm font-medium">
                      Utiliser un code d'intégration YouTube (iframe)
                    </Label>
                  </div>

                  {formData.use_iframe ? (
                    <div>
                      <Label htmlFor="iframe_code">Code d'intégration YouTube</Label>
                      <Input
                        id="iframe_code"
                        value={formData.iframe_code}
                        onChange={(e) => setFormData({ ...formData, iframe_code: e.target.value })}
                        placeholder='<iframe width="560" height="315" src="https://www.youtube.com/embed/..." title="YouTube video player" frameborder="0" allow="..." allowfullscreen></iframe>'
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="link">Lien (Internet ou YouTube)</Label>
                      <Input
                        id="link"
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        placeholder="https://example.com ou https://youtube.com/watch?v=..."
                        type="url"
                        required
                      />
                    </div>
                  )}

                  {!formData.use_iframe && (
                    <ActivityThumbnailUploader
                      currentThumbnail={formData.thumbnail_url}
                      onThumbnailChange={(url) => setFormData({ ...formData, thumbnail_url: url || '' })}
                    />
                  )}

                  <div>
                    <Label htmlFor="activity_date">Date de l'activité (optionnel)</Label>
                    <Input
                      id="activity_date"
                      value={formData.activity_date}
                      onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                      type="date"
                    />
                  </div>

                  {canShareGlobally && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="shared_globally"
                        checked={formData.shared_globally}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, shared_globally: checked as boolean })
                        }
                      />
                      <Label htmlFor="shared_globally" className="text-sm font-medium">
                        Partager avec tout le monde
                      </Label>
                      <p className="text-xs text-gray-500 ml-2">
                        Cette activité sera visible par tous les utilisateurs connectés
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit">Ajouter</Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {!editingActivity && !showForm && !showMemoryManager && !showMusicQuizForm && !showTimelineForm && !showDictationForm && !showSpotDifferencesForm && !showQuizConverter && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((activity) => {
                const isYouTube = isYouTubeUrl(activity.link);
                const videoId = isYouTube ? getYouTubeVideoId(activity.link) : null;

                return (
                  <div key={activity.id} className="relative group">
                    <ActivityCard
                      title={activity.title}
                      link={activity.link}
                      isYouTube={isYouTube}
                      videoId={videoId || undefined}
                      thumbnailUrl={activity.thumbnail_url}
                      activityDate={activity.activity_date}
                      showEditButton={canEditActivity(activity)}
                      onEdit={() => handleEditActivity(activity)}
                      subActivityName={activity.activity_sub_tags?.name}
                      iframeCode={activity.iframe_code}
                      audioUrl={activity.audio_url}
                      activityId={activity.id}
                      activity={activity}
                    />
                    {activity.shared_globally && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded z-10">
                        Partagé
                      </div>
                    )}
                    {canEditActivity(activity) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(activity.id)}
                        className="absolute top-2 right-12 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!editingActivity && activities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucune activité pour le moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminActivities;
