
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import ActivityCard from '@/components/activities/ActivityCard';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Plus, Settings } from 'lucide-react';
import ActivityThumbnailUploader from '@/components/activities/ActivityThumbnailUploader';
import SubActivitySelector from '@/components/activities/SubActivitySelector';
import ActivityEditForm from '@/components/activities/ActivityEditForm';
import { Activity } from '@/hooks/useActivities';

const activityTitles: Record<string, string> = {
  meditation: 'Relaxation',
  games: 'Jeux',
  exercises: 'Gym douce',
};

const activityTypes = [
  { value: 'meditation', label: 'Relaxation' },
  { value: 'games', label: 'Jeux' },
  { value: 'exercises', label: 'Gym douce' },
];

const ActivityPage = () => {
  const { type } = useParams<{ type: string }>();
  const { hasRole, user } = useAuth();
  const { activities, loading, refetch, canEditActivity } = useActivities(type || '');
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState({
    activity_type: type || '',
    title: '',
    link: '',
    thumbnail_url: '',
    activity_date: '',
    sub_activity_tag_id: '',
    shared_globally: false,
  });

  // Réinitialiser le formulaire quand le type change
  useEffect(() => {
    console.log('🔄 Type d\'activité changé:', type);
    setFormData(prev => ({
      ...prev,
      activity_type: type || '',
    }));
    setShowForm(false);
    setEditingActivity(null);
  }, [type]);

  const isReader = hasRole('reader');

  // Vérifier si l'utilisateur peut utiliser la fonction de partage global
  const canShareGlobally = user?.email === 'olivier.martin.78000@gmail.com' && 
                          ['meditation', 'games', 'exercises'].includes(type || '');

  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

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
      const dataToInsert = {
        ...formData,
        created_by: user.id,
        activity_date: formData.activity_date || null,
        thumbnail_url: formData.thumbnail_url || null,
        sub_activity_tag_id: formData.sub_activity_tag_id || null,
        shared_globally: canShareGlobally ? formData.shared_globally : false,
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

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setShowForm(false);
  };

  const handleSaveEdit = () => {
    setEditingActivity(null);
    refetch();
  };

  const handleCancelEdit = () => {
    setEditingActivity(null);
  };

  console.log('🎯 ActivityPage - État actuel:', {
    type,
    activitiesCount: activities.length,
    loading,
    user: user?.id,
    isReader,
    canShareGlobally
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-20 px-4">
          <div className="container mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="text-lg">Chargement...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="pt-20 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {activityTitles[type || ''] || 'Activités'}
            </h1>
            <div className="flex gap-2">
              {hasRole('admin') && (
                <Button asChild>
                  <Link to={`/admin/activities/${type}`} className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Gérer les activités
                  </Link>
                </Button>
              )}
              {!isReader && (
                <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter une activité
                </Button>
              )}
            </div>
          </div>

          {editingActivity && (
            <div className="mb-8">
              <ActivityEditForm
                activity={editingActivity}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
              />
            </div>
          )}

          {showForm && !editingActivity && !isReader && (
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

                  <ActivityThumbnailUploader
                    currentThumbnail={formData.thumbnail_url}
                    onThumbnailChange={(url) => setFormData({ ...formData, thumbnail_url: url || '' })}
                  />

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

          {activities.length === 0 && !showForm ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                Aucune activité disponible pour le moment.
              </p>
              {!isReader && (
                <Button onClick={() => setShowForm(true)}>
                  Ajouter la première activité
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((activity) => {
                const isYouTube = isYouTubeUrl(activity.link);
                const videoId = isYouTube ? getYouTubeVideoId(activity.link) : null;

                return (
                  <div key={activity.id} className="relative">
                    <ActivityCard
                      title={activity.title}
                      link={activity.link}
                      isYouTube={isYouTube}
                      videoId={videoId || undefined}
                      thumbnailUrl={activity.thumbnail_url}
                      activityDate={activity.activity_date}
                      subActivityName={activity.activity_sub_tags?.name}
                      showEditButton={canEditActivity(activity)}
                      onEdit={() => handleEditActivity(activity)}
                    />
                    {activity.shared_globally && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded z-10">
                        Partagé
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
