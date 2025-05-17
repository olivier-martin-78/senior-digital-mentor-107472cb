
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithAuthor } from '@/types/supabase';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, profile, isLoading, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userPosts, setUserPosts] = useState<PostWithAuthor[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }

    if (profile) {
      setDisplayName(profile.display_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [user, profile, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserPosts();
    }
  }, [user]);

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          profiles:author_id(*)
        `)
        .eq('author_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUserPosts(data as PostWithAuthor[]);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user?.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-media')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('blog-media')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast({
        title: "Avatar uploadé",
        description: "Votre avatar a été téléchargé. N'oubliez pas d'enregistrer les modifications."
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du téléchargement de l'avatar.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          avatar_url: avatarUrl
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès."
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour du profil.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) {
      return user?.email?.substring(0, 2).toUpperCase() || '??';
    }
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif text-tranches-charcoal mb-6">Mon Profil</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Informations</TabsTrigger>
            <TabsTrigger value="posts">Mes Articles</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informations du profil</CardTitle>
                <CardDescription>
                  Mettez à jour vos informations personnelles et votre avatar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                      <AvatarFallback className="text-2xl">{getInitials(displayName)}</AvatarFallback>
                    </Avatar>
                    
                    <Label htmlFor="avatar" className="cursor-pointer text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors">
                      {uploading ? 'Téléchargement...' : 'Changer l\'avatar'}
                      <input 
                        id="avatar" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={uploadAvatar}
                        disabled={uploading}
                      />
                    </Label>
                  </div>
                  
                  <div className="w-full space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        value={user?.email || ''} 
                        disabled 
                      />
                      <p className="text-xs text-gray-500">L'email ne peut pas être modifié.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Nom d'affichage</Label>
                      <Input 
                        id="displayName" 
                        value={displayName} 
                        onChange={e => setDisplayName(e.target.value)} 
                        placeholder="Votre nom public"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Rôle</Label>
                      <div>
                        {hasRole('admin') && <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">Administrateur</span>}
                        {hasRole('editor') && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Éditeur</span>}
                        {hasRole('reader') && <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">Lecteur</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={updateProfile}
                  disabled={saving}
                  className="bg-tranches-sage hover:bg-tranches-sage/90"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Mes Articles</CardTitle>
                <CardDescription>
                  Gérez les articles que vous avez créés.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPosts ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Vous n'avez pas encore créé d'articles.</p>
                    {(hasRole('admin') || hasRole('editor')) && (
                      <Button asChild className="bg-tranches-sage hover:bg-tranches-sage/90">
                        <Link to="/blog/new">Créer un article</Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userPosts.map(post => (
                      <div key={post.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium">
                              <Link to={`/blog/${post.id}`} className="hover:text-tranches-sage transition-colors">
                                {post.title}
                              </Link>
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(post.created_at).toLocaleDateString('fr-FR')}
                              {!post.published && ' • Brouillon'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link to={`/blog/edit/${post.id}`}>Modifier</Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link to={`/blog/${post.id}`}>Voir</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              {(hasRole('admin') || hasRole('editor')) && userPosts.length > 0 && (
                <CardFooter className="justify-center">
                  <Button asChild variant="outline">
                    <Link to="/blog/new">Créer un nouvel article</Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
