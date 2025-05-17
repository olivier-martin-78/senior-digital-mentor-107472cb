
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithAuthor } from '@/types/supabase';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PlusCircle } from 'lucide-react';

const Blog = () => {
  const { user, hasRole } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Si l'utilisateur est admin ou éditeur, récupérer tous les posts
        // Sinon, récupérer uniquement les posts publiés
        const { data, error } = await supabase
          .from('blog_posts')
          .select(`
            *,
            profiles:author_id(*)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching posts:', error);
          return;
        }

        setPosts(data as PostWithAuthor[]);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user]);

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif text-tranches-charcoal">Blog</h1>
          {(hasRole('admin') || hasRole('editor')) && (
            <Button asChild className="bg-tranches-sage hover:bg-tranches-sage/90">
              <Link to="/blog/new">
                <PlusCircle className="mr-2 h-5 w-5" />
                Nouvel article
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-serif text-tranches-charcoal mb-4">Aucun article</h2>
            <p className="text-gray-600">Les articles apparaîtront ici une fois publiés.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.filter(post => post.published || (user && post.author_id === user.id)).map(post => (
              <Card key={post.id} className={`overflow-hidden ${!post.published ? 'border-orange-300' : ''}`}>
                <CardHeader>
                  <CardTitle>
                    <Link to={`/blog/${post.id}`} className="hover:text-tranches-sage transition-colors">
                      {post.title}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {post.profiles?.display_name || 'Utilisateur'} • {formatDate(post.created_at)}
                    {!post.published && ' • Brouillon'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-gray-600">
                    {post.content.substring(0, 150)}...
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline">
                    <Link to={`/blog/${post.id}`}>Lire la suite</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
