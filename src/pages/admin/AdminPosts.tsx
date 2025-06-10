import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithAuthor, AlbumWithAuthor, BlogCategory } from '@/types/supabase';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Eye, Folder, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const AdminPosts = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [albums, setAlbums] = useState<AlbumWithAuthor[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingAlbum, setEditingAlbum] = useState<AlbumWithAuthor | null>(null);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [isAlbumDialogOpen, setIsAlbumDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdmin = hasRole('admin');
  const isEditor = hasRole('editor');

  useEffect(() => {
    if (!hasRole('admin') && !hasRole('editor')) {
      navigate('/unauthorized');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (activeTab === "posts") {
          const { data, error } = await supabase
            .from('blog_posts')
            .select(`
              *,
              profiles:author_id(*)
            `)
            .order('created_at', { ascending: false });

          if (error) {
            throw error;
          }

          setPosts(data as PostWithAuthor[]);
        } 
        else if (activeTab === "albums") {
          const { data, error } = await supabase
            .from('blog_albums')
            .select(`
              *,
              profiles:author_id(*)
            `)
            .order('name', { ascending: true });

          if (error) {
            throw error;
          }

          setAlbums(data as AlbumWithAuthor[]);
        } 
        else if (activeTab === "categories") {
          const { data, error } = await supabase
            .from('blog_categories')
            .select('*')
            .order('name', { ascending: true });

          if (error) {
            throw error;
          }

          setCategories(data as BlogCategory[]);
        }
      } catch (error: any) {
        console.error(`Error fetching ${activeTab}:`, error);
        toast({
          title: "Erreur",
          description: error.message || `Une erreur est survenue lors du chargement des ${activeTab}.`,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hasRole, navigate, toast, activeTab]);

  const canDeletePost = (post: PostWithAuthor) => {
    return isAdmin || (isEditor && post.author_id === user?.id);
  };

  const canDeleteAlbum = (album: AlbumWithAuthor) => {
    return isAdmin || (isEditor && album.author_id === user?.id);
  };

  const canDeleteCategory = () => {
    return isAdmin; // Seuls les admins peuvent supprimer les catégories
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        throw error;
      }

      setPosts(posts.filter(post => post.id !== postId));
      toast({
        title: "Article supprimé",
        description: "L'article a été supprimé avec succès."
      });
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression de l'article.",
        variant: "destructive"
      });
    }
  };

  const handleAlbumSubmit = async () => {
    try {
      if (!newAlbumName.trim()) {
        toast({
          title: "Nom requis",
          description: "Veuillez spécifier un nom pour l'album.",
          variant: "destructive"
        });
        return;
      }

      if (editingAlbum) {
        // Update existing album
        const { data, error } = await supabase
          .from('blog_albums')
          .update({
            name: newAlbumName.trim(),
            description: newAlbumDescription.trim() || null
          })
          .eq('id', editingAlbum.id)
          .select(`*, profiles:author_id(*)`)
          .single();

        if (error) {
          if (error.code === '23505') {
            toast({
              title: "Nom déjà utilisé",
              description: "Un album avec ce nom existe déjà.",
              variant: "destructive"
            });
            return;
          }
          throw error;
        }

        setAlbums(albums.map(album => 
          album.id === data.id ? data as AlbumWithAuthor : album
        ));

        toast({
          title: "Album mis à jour",
          description: "L'album a été mis à jour avec succès."
        });
      } else {
        // Create new album
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) {
          throw new Error("Utilisateur non authentifié");
        }
        
        // Create new album
        const { data, error } = await supabase
          .from('blog_albums')
          .insert({
            name: newAlbumName.trim(),
            description: newAlbumDescription.trim() || null,
            author_id: userId
          })
          .select(`*, profiles:author_id(*)`)
          .single();

        if (error) {
          if (error.code === '23505') {
            toast({
              title: "Nom déjà utilisé",
              description: "Un album avec ce nom existe déjà.",
              variant: "destructive"
            });
            return;
          }
          throw error;
        }

        setAlbums([...albums, data as AlbumWithAuthor]);

        toast({
          title: "Album créé",
          description: "L'album a été créé avec succès."
        });
      }

      // Reset form
      setNewAlbumName('');
      setNewAlbumDescription('');
      setEditingAlbum(null);
      setIsAlbumDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving album:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'enregistrement de l'album.",
        variant: "destructive"
      });
    }
  };

  const deleteAlbum = async (albumId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet album ? Cette action est irréversible.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_albums')
        .delete()
        .eq('id', albumId);

      if (error) {
        throw error;
      }

      setAlbums(albums.filter(album => album.id !== albumId));
      toast({
        title: "Album supprimé",
        description: "L'album a été supprimé avec succès."
      });
    } catch (error: any) {
      console.error('Error deleting album:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression de l'album.",
        variant: "destructive"
      });
    }
  };

  const handleCategorySubmit = async () => {
    try {
      if (!newCategoryName.trim()) {
        toast({
          title: "Nom requis",
          description: "Veuillez spécifier un nom pour la catégorie.",
          variant: "destructive"
        });
        return;
      }

      if (editingCategory) {
        // Update existing category
        const { data, error } = await supabase
          .from('blog_categories')
          .update({
            name: newCategoryName.trim()
          })
          .eq('id', editingCategory.id)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            toast({
              title: "Nom déjà utilisé",
              description: "Une catégorie avec ce nom existe déjà.",
              variant: "destructive"
            });
            return;
          }
          throw error;
        }

        setCategories(categories.map(category => 
          category.id === data.id ? data : category
        ));

        toast({
          title: "Catégorie mise à jour",
          description: "La catégorie a été mise à jour avec succès."
        });
      } else {
        // Create new category - Ajout du created_by requis
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) {
          throw new Error("Utilisateur non authentifié");
        }

        const { data, error } = await supabase
          .from('blog_categories')
          .insert({
            name: newCategoryName.trim(),
            created_by: userId
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            toast({
              title: "Nom déjà utilisé",
              description: "Une catégorie avec ce nom existe déjà.",
              variant: "destructive"
            });
            return;
          }
          throw error;
        }

        setCategories([...categories, data]);

        toast({
          title: "Catégorie créée",
          description: "La catégorie a été créée avec succès."
        });
      }

      // Reset form
      setNewCategoryName('');
      setEditingCategory(null);
      setIsCategoryDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'enregistrement de la catégorie.",
        variant: "destructive"
      });
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        throw error;
      }

      setCategories(categories.filter(category => category.id !== categoryId));
      toast({
        title: "Catégorie supprimée",
        description: "La catégorie a été supprimée avec succès."
      });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression de la catégorie.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy à HH:mm', { locale: fr });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal">Gestion des Albums</h1>
          {activeTab === "posts" && (
            <Button asChild className="bg-tranches-sage hover:bg-tranches-sage/90">
              <Link to="/blog/new">
                <PlusCircle className="mr-2 h-5 w-5" />
                Nouvel article
              </Link>
            </Button>
          )}
          {activeTab === "albums" && (
            <Dialog open={isAlbumDialogOpen} onOpenChange={setIsAlbumDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-tranches-sage hover:bg-tranches-sage/90">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Nouvel album
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingAlbum ? "Modifier l'album" : "Nouvel album"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="album-name">Nom</Label>
                    <Input 
                      id="album-name" 
                      value={newAlbumName} 
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      placeholder="Nom de l'album"
                    />
                  </div>
                  <div>
                    <Label htmlFor="album-description">Description (optionnelle)</Label>
                    <Textarea 
                      id="album-description" 
                      value={newAlbumDescription} 
                      onChange={(e) => setNewAlbumDescription(e.target.value)}
                      placeholder="Description de l'album"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAlbumDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAlbumSubmit} className="bg-tranches-sage hover:bg-tranches-sage/90">
                    {editingAlbum ? "Mettre à jour" : "Créer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {activeTab === "categories" && isAdmin && (
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-tranches-sage hover:bg-tranches-sage/90">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Nouvelle catégorie
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
                  </DialogTitle>
                </DialogHeader>
                <div>
                  <Label htmlFor="category-name">Nom</Label>
                  <Input 
                    id="category-name" 
                    value={newCategoryName} 
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nom de la catégorie"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCategorySubmit} className="bg-tranches-sage hover:bg-tranches-sage/90">
                    {editingCategory ? "Mettre à jour" : "Créer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="posts" className="flex items-center">Articles</TabsTrigger>
            <TabsTrigger value="albums" className="flex items-center"><Folder className="mr-1 h-4 w-4" />Albums</TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center"><Tag className="mr-1 h-4 w-4" />Catégories</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Auteur</TableHead>
                      <TableHead>Date de création</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          Aucun article trouvé. Créez votre premier article !
                        </TableCell>
                      </TableRow>
                    ) : (
                      posts.map(post => (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">
                            {post.title}
                          </TableCell>
                          <TableCell>
                            {post.profiles?.display_name || post.profiles?.email || 'Utilisateur inconnu'}
                          </TableCell>
                          <TableCell>{formatDate(post.created_at)}</TableCell>
                          <TableCell>
                            <span className={`px-3 py-1 rounded-full text-xs ${
                              post.published 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {post.published ? 'Publié' : 'Brouillon'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button asChild variant="ghost" size="sm">
                              <Link to={`/blog/${post.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                              <Link to={`/blog/edit/${post.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            {canDeletePost(post) && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deletePost(post.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="albums">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Créé par</TableHead>
                      <TableHead>Date de création</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {albums.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          Aucun album trouvé. Créez votre premier album !
                        </TableCell>
                      </TableRow>
                    ) : (
                      albums.map(album => (
                        <TableRow key={album.id}>
                          <TableCell className="font-medium">
                            {album.name}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {album.description || '—'}
                          </TableCell>
                          <TableCell>
                            {album.profiles?.display_name || album.profiles?.email || 'Utilisateur inconnu'}
                          </TableCell>
                          <TableCell>{formatDate(album.created_at)}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setEditingAlbum(album);
                                setNewAlbumName(album.name);
                                setNewAlbumDescription(album.description || '');
                                setIsAlbumDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {canDeleteAlbum(album) && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteAlbum(album.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Date de création</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                          Aucune catégorie trouvée. Créez votre première catégorie !
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map(category => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">
                            <Badge>
                              {category.name}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(category.created_at)}</TableCell>
                          <TableCell className="text-right space-x-2">
                            {isAdmin && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  setEditingCategory(category);
                                  setNewCategoryName(category.name);
                                  setIsCategoryDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteCategory() && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteCategory(category.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPosts;
