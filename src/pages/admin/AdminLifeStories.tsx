import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Loader2, Pencil, Trash2, ChevronLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface LifeStoryAdmin {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  chapter_count: number;
  question_count: number;
  answered_count: number;
  user_email?: string;
  user_display_name?: string;
}

const AdminLifeStories = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<LifeStoryAdmin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<LifeStoryAdmin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!hasRole('admin')) {
      navigate('/unauthorized');
      return;
    }
    
    loadLifeStories();
  }, [hasRole, navigate]);

  const loadLifeStories = async () => {
    try {
      setLoading(true);
      
      // Récupérer toutes les histoires de vie avec les informations des utilisateurs
      const { data, error } = await supabase
        .from('life_stories')
        .select(`
          id,
          user_id,
          title,
          created_at,
          updated_at,
          chapters,
          profiles!life_stories_user_id_fkey (
            email,
            display_name
          )
        `);

      if (error) {
        console.error('Erreur Supabase:', error);
        throw new Error(`Erreur Supabase: ${error.message} (code: ${error.code})`);
      }

      if (data) {
        // Traitement des données pour calculer les statistiques de chaque histoire
        const formattedStories = data.map((story: any) => {
          const chapters = story.chapters || [];
          
          let totalQuestions = 0;
          let answeredQuestions = 0;
          
          // Compter le nombre total de questions et de réponses
          chapters.forEach((chapter: any) => {
            if (chapter.questions && Array.isArray(chapter.questions)) {
              totalQuestions += chapter.questions.length;
              answeredQuestions += chapter.questions.filter((q: any) => 
                q.answer && q.answer.trim() !== ''
              ).length;
            }
          });
          
          return {
            id: story.id,
            user_id: story.user_id,
            title: story.title,
            created_at: story.created_at,
            updated_at: story.updated_at,
            chapter_count: chapters.length,
            question_count: totalQuestions,
            answered_count: answeredQuestions,
            user_email: story.profiles?.email || 'Non disponible',
            user_display_name: story.profiles?.display_name || 'Utilisateur inconnu'
          };
        });
        
        setStories(formattedStories);
      } else {
        throw new Error('Aucune donnée reçue de l\'API');
      }
    } catch (error: any) {
      console.error('Erreur complète:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de charger les histoires de vie : ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteClick = (story: LifeStoryAdmin) => {
    setStoryToDelete(story);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!storyToDelete) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('life_stories')
        .delete()
        .eq('id', storyToDelete.id);
      
      if (error) throw error;
      
      setStories(prev => prev.filter(story => story.id !== storyToDelete.id));
      
      toast({
        title: 'Histoire supprimée',
        description: `L'histoire "${storyToDelete.title}" a été supprimée avec succès`,
      });
      
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Impossible de supprimer l'histoire : ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrer les histoires selon le terme de recherche
  const filteredStories = stories.filter(story => 
    story.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    story.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.user_display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8 flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mr-auto"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-3xl font-serif text-tranches-charcoal">
            Administration des histoires de vie
          </h1>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">
              Total : {stories.length} histoires de vie
            </p>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center my-10">
            <Loader2 className="h-12 w-12 animate-spin text-tranches-sage" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead className="text-center">Chapitres</TableHead>
                    <TableHead className="text-center">Questions répondues</TableHead>
                    <TableHead>Dernière modification</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStories.length > 0 ? (
                    filteredStories.map((story) => (
                      <TableRow key={story.id}>
                        <TableCell className="font-medium">{story.title}</TableCell>
                        <TableCell>
                          {story.user_display_name || story.user_email || 'Utilisateur inconnu'}
                        </TableCell>
                        <TableCell className="text-center">{story.chapter_count}</TableCell>
                        <TableCell className="text-center">
                          {story.answered_count} / {story.question_count}
                          {story.question_count > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({Math.round((story.answered_count / story.question_count) * 100)}%)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {story.updated_at 
                            ? format(new Date(story.updated_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })
                            : 'Non disponible'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link to={`/admin/life-stories/${story.id}`}>
                              <Pencil className="h-4 w-4 mr-1" />
                              Éditer
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteClick(story)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {searchTerm 
                          ? 'Aucune histoire ne correspond à votre recherche' 
                          : 'Aucune histoire de vie n\'a été trouvée'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Dialog de confirmation de suppression */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent>
                <Dialog
