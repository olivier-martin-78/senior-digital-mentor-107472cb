
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Gamepad2 } from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import { useActivitySubTags } from '@/hooks/useActivitySubTags';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ActivityCard from '@/components/activities/ActivityCard';
import ActivityThumbnailUploader from '@/components/activities/ActivityThumbnailUploader';
import SubActivitySelector from '@/components/activities/SubActivitySelector';
import ActivityEditForm from '@/components/activities/ActivityEditForm';
import { Activity } from '@/hooks/useActivities';

const activityTypes = [
  { value: 'meditation', label: 'Relaxation' },
  { value: 'games', label: 'Jeux' },
  { value: 'exercises', label: 'Gym douce' },
];

const ActivityPage = () => {
  const { type } = useParams<{ type: string }>();
  const { activities, loading, refetch, canEditActivity } = useActivities(type || '');
  const { subTags } = useActivitySubTags(type || '');
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  
  const [selectedSubTag, setSelectedSubTag] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  
  const [formData, setFormData] = useState({
    activity_type: type || '',
    title: '',
    link: '',
    iframe_code: '',
    use_iframe: false,
    thumbnail_url: '',
    activity_date: '',
    sub_activity_tag_id: '',
    shared_globally: false,
  });

  const currentActivityType = activityTypes.find(at => at.value === type);
  const canShareGlobally = user?.email === 'olivier.martin.78000@gmail.com' && 
                          ['meditation', 'games', 'exercises'].includes(type || '');

  const filteredActivities = selectedSubTag 
    ? activities.filter(activity => activity.sub_activity_tag_id === selectedSubTag)
    : activities;

  // Jeux intégrés pour la section jeux
  const getIntegratedGames = () => {
    if (type !== 'games') return [];
    
    return [
      <Card key="opposites" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
        <Link to="/activities/opposites" className="block">
          <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
            <div className="text-center text-white">
              <Gamepad2 className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-bold">Jeu des Contraires</h3>
            </div>
          </div>
          <CardHeader>
            <CardTitle className="text-lg">Jeu des Contraires</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Associez les mots contraires entre eux. Plusieurs niveaux de difficulté disponibles.
            </p>
          </CardContent>
        </Link>
      </Card>,
      
      <Card key="sudoku" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
        <Link to="/activities/sudoku" className="block">
          <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <div className="text-center text-white">
              <Gamepad2 className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-bold">Sudoku</h3>
            </div>
          </div>
          <CardHeader>
            <CardTitle className="text-lg">Sudoku</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Jeu de logique classique avec 5 niveaux de difficulté. Remplissez la grille 9x9 avec les chiffres de 1 à 9.
            </p>
          </CardContent>
        </Link>
      </Card>,
      
      <Card key="crossword" className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
        <Link to="/activities/crossword" className="block">
          <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
            <div className="text-center text-white">
              <Gamepad2 className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-bold">Mots Croisés Fléchés</h3>
            </div>
          </div>
          <CardHeader>
            <CardTitle className="text-lg">Mots Croisés Fléchés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Remplissez la grille en suivant les définitions et les flèches. 5 niveaux de difficulté disponibles.
            </p>
          </CardContent>
        </Link>
      </Card>
    ];
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
        iframe_code: '',
        use_iframe: false,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="pt-20 px-4">
          <div className="container mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="h-64 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-20 px-4">
        <div className="container mx-auto">
          <Link 
            to="/activities/activities" 
            className="inline-flex items-center text-tranches-dustyblue hover:text-tranches-dustyblue/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux activités
          </Link>

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {currentActivityType?.label}
            </h1>
            {(hasRole('admin') || type === 'meditation' || type === 'exercises' || type === 'games') && (
              <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter une activité
              </Button>
            )}
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
                      <Textarea
                        id="iframe_code"
                        value={formData.iframe_code}
                        onChange={(e) => setFormData({ ...formData, iframe_code: e.target.value })}
                        placeholder='<iframe width="560" height="315" src="https://www.youtube.com/embed/..." title="YouTube video player" frameborder="0" allow="..." allowfullscreen></iframe>'
                        rows={4}
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

          <div className="mb-6">
            <Label htmlFor="sub-tag-filter">Filtrer par sous-activité</Label>
            <Select
              value={selectedSubTag || 'all'}
              onValueChange={(value) => setSelectedSubTag(value === 'all' ? '' : value)}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Toutes les sous-activités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sous-activités</SelectItem>
                {subTags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Ajouter les jeux intégrés en premier dans la section Jeux */}
            {getIntegratedGames()}
            
            {filteredActivities.map((activity) => {
              const isYouTube = isYouTubeUrl(activity.link);
              const videoId = isYouTube ? getYouTubeVideoId(activity.link) : null;
              const canEdit = canEditActivity(activity);

              return (
                <div key={activity.id} className="relative group">
                  <ActivityCard
                    title={activity.title}
                    link={activity.link}
                    isYouTube={isYouTube}
                    videoId={videoId || undefined}
                    thumbnailUrl={activity.thumbnail_url}
                    activityDate={activity.activity_date}
                    showEditButton={canEdit}
                    onEdit={() => handleEditActivity(activity)}
                    subActivityName={activity.activity_sub_tags?.name}
                    iframeCode={activity.iframe_code}
                  />
                  {activity.shared_globally && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded z-10">
                      Partagé
                    </div>
                  )}
                  {canEdit && (
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

          {filteredActivities.length === 0 && type !== 'games' && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {selectedSubTag 
                  ? "Aucune activité trouvée pour cette sous-activité."
                  : "Aucune activité pour le moment."
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
