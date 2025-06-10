import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import { useActivities } from '@/hooks/useActivities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus } from 'lucide-react';
import { Activity } from '@/hooks/useActivities';
import ActivityThumbnailUploader from '@/components/activities/ActivityThumbnailUploader';
import ActivityEditForm from '@/components/activities/ActivityEditForm';
import ActivityCard from '@/components/activities/ActivityCard';
import SubActivitySelector from '@/components/activities/SubActivitySelector';
import { useAuth } from '@/contexts/AuthContext';

const activityTypes = [
  { value: 'meditation', label: 'Méditation' },
  { value: 'games', label: 'Jeux' },
  { value: 'gratitude', label: 'Gratitude' },
  { value: 'connection', label: 'Connexion' },
  { value: 'exercises', label: 'Exercices' },
  { value: 'compassion', label: 'Compassion' },
  { value: 'reading', label: 'Lecture' },
  { value: 'writing', label: 'Écriture' },
];

const AdminActivities = () => {
  const { type } = useParams<{ type: string }>();
  const { activities, refetch } = useActivities(type || '');
  const { toast } = useToast();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState({
    activity_type: type || '',
    title: '',
    link: '',
    thumbnail_url: '',
    activity_date: '',
    sub_activity_tag_id: '',
  });

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
      <Header />
      <div className="pt-20 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des activités - {currentActivityType?.label}
            </h1>
            <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une activité
            </Button>
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
                <div key={activity.id} className="relative">
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
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(activity.id)}
                    className="absolute top-2 left-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
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
