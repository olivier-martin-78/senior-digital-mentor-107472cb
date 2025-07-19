import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useActivities } from '@/hooks/useActivities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus } from 'lucide-react';
import { Activity } from '@/hooks/useActivities';
import ActivityThumbnailUploader from '@/components/activities/ActivityThumbnailUploader';
import ActivityEditForm from '@/components/activities/ActivityEditForm';
import ActivityCard from '@/components/activities/ActivityCard';
import SubActivitySelector from '@/components/activities/SubActivitySelector';
import { useAuth } from '@/contexts/AuthContext';
import { CreateMemoryGameForm } from '@/components/admin/CreateMemoryGameForm';
import { EditMemoryGameForm } from '@/components/admin/EditMemoryGameForm';
import CreateMusicQuizForm from '@/components/admin/CreateMusicQuizForm';
import EditMusicQuizForm from '@/components/admin/EditMusicQuizForm';


const activityTypes = [
  { value: 'meditation', label: 'Relaxation' },
  { value: 'games', label: 'Jeux' },
  { value: 'exercises', label: 'Gym douce' },
];

const AdminActivities = () => {
  const { type } = useParams<{ type: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activities, refetch } = useActivities(type || '');
  const { toast } = useToast();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showMemoryManager, setShowMemoryManager] = useState(false);
  const [showMusicQuizForm, setShowMusicQuizForm] = useState(false);
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
    setShowMemoryManager(false); // Fermer le gestionnaire Memory si ouvert
    setShowMusicQuizForm(false); // Fermer le formulaire quiz musical si ouvert
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

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-20 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des activités - {currentActivityType?.label}
            </h1>
            <div className="flex gap-2">
              {type === 'games' && (
                <>
                  <Button 
                    onClick={() => setShowMemoryManager(!showMemoryManager)} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Gérer les jeux de Memory
                  </Button>
                  <Button 
                    onClick={() => setShowMusicQuizForm(!showMusicQuizForm)} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nouveau quiz musical
                  </Button>
                </>
              )}
              <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter une activité
              </Button>
            </div>
          </div>

          {showMemoryManager && type === 'games' && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Créer une série de cartes Memory
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
                    showEditButton={true}
                    onEdit={() => handleEditActivity(activity)}
                    subActivityName={activity.activity_sub_tags?.name}
                    iframeCode={activity.iframe_code}
                  />
                  {activity.shared_globally && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded z-10">
                      Partagé
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(activity.id)}
                    className="absolute top-2 right-12 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          {activities.length === 0 && (
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
