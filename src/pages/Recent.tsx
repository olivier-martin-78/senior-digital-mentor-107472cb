
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, MessageCircle, FileText, Heart, BookOpen, PenTool } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RecentActivity {
  id: string;
  type: 'blog_post' | 'wish_post' | 'diary_entry' | 'life_story' | 'comment';
  title: string;
  content: string;
  author_name: string;
  created_at: string;
  url: string;
  post_title?: string; // Pour les commentaires
}

const Recent = () => {
  const { session } = useAuth();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetchRecentActivities();
  }, [session]);

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      
      // Récupérer les articles de blog
      const { data: blogPosts } = await supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          content,
          created_at,
          profiles!inner(display_name, email)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les souhaits
      const { data: wishPosts } = await supabase
        .from('wish_posts')
        .select(`
          id,
          title,
          content,
          created_at,
          profiles!inner(display_name, email)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les entrées de journal
      const { data: diaryEntries } = await supabase
        .from('diary_entries')
        .select(`
          id,
          title,
          activities,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les histoires de vie
      const { data: lifeStories } = await supabase
        .from('life_stories')
        .select(`
          id,
          title,
          created_at,
          user_id
        `)
        .order('updated_at', { ascending: false })
        .limit(10);

      // Récupérer les commentaires
      const { data: comments } = await supabase
        .from('blog_comments')
        .select(`
          id,
          content,
          created_at,
          profiles!inner(display_name, email),
          blog_posts!inner(id, title)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les profils pour les entrées de journal et histoires de vie
      const userIds = [
        ...(diaryEntries?.map(entry => entry.user_id) || []),
        ...(lifeStories?.map(story => story.user_id) || [])
      ].filter((id, index, array) => array.indexOf(id) === index);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', userIds);

      const profilesMap = profiles?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      // Combiner toutes les activités
      const allActivities: RecentActivity[] = [
        ...(blogPosts?.map(post => ({
          id: post.id,
          type: 'blog_post' as const,
          title: post.title,
          content: post.content.substring(0, 150) + '...',
          author_name: post.profiles.display_name || post.profiles.email,
          created_at: post.created_at,
          url: `/blog/${post.id}`
        })) || []),
        
        ...(wishPosts?.map(post => ({
          id: post.id,
          type: 'wish_post' as const,
          title: post.title,
          content: post.content.substring(0, 150) + '...',
          author_name: post.profiles.display_name || post.profiles.email,
          created_at: post.created_at,
          url: `/wishes/${post.id}`
        })) || []),
        
        ...(diaryEntries?.map(entry => ({
          id: entry.id,
          type: 'diary_entry' as const,
          title: entry.title,
          content: entry.activities?.substring(0, 150) + '...' || 'Aucune activité décrite',
          author_name: profilesMap[entry.user_id]?.display_name || profilesMap[entry.user_id]?.email || 'Utilisateur inconnu',
          created_at: entry.created_at,
          url: `/diary/${entry.id}`
        })) || []),
        
        ...(lifeStories?.map(story => ({
          id: story.id,
          type: 'life_story' as const,
          title: story.title,
          content: 'Histoire de vie en cours de rédaction',
          author_name: profilesMap[story.user_id]?.display_name || profilesMap[story.user_id]?.email || 'Utilisateur inconnu',
          created_at: story.created_at,
          url: `/life-story`
        })) || []),
        
        ...(comments?.map(comment => ({
          id: comment.id,
          type: 'comment' as const,
          title: `Commentaire sur "${comment.blog_posts.title}"`,
          content: comment.content.substring(0, 150) + '...',
          author_name: comment.profiles.display_name || comment.profiles.email,
          created_at: comment.created_at,
          url: `/blog/${comment.blog_posts.id}`,
          post_title: comment.blog_posts.title
        })) || [])
      ];

      // Trier par date décroissante
      allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setActivities(allActivities.slice(0, 20)); // Limiter à 20 éléments
      
    } catch (error) {
      console.error('Erreur lors du chargement des activités récentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'blog_post':
        return <FileText className="h-5 w-5" />;
      case 'wish_post':
        return <Heart className="h-5 w-5" />;
      case 'diary_entry':
        return <PenTool className="h-5 w-5" />;
      case 'life_story':
        return <BookOpen className="h-5 w-5" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'blog_post':
        return 'Article';
      case 'wish_post':
        return 'Souhait';
      case 'diary_entry':
        return 'Journal';
      case 'life_story':
        return 'Histoire de vie';
      case 'comment':
        return 'Commentaire';
      default:
        return 'Activité';
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'blog_post':
        return 'bg-blue-100 text-blue-800';
      case 'wish_post':
        return 'bg-pink-100 text-pink-800';
      case 'diary_entry':
        return 'bg-green-100 text-green-800';
      case 'life_story':
        return 'bg-purple-100 text-purple-800';
      case 'comment':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
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
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-tranches-charcoal mb-2">Activités récentes</h1>
          <p className="text-gray-600">
            Découvrez les dernières contributions de la communauté
          </p>
        </div>

        {activities.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune activité récente
              </h3>
              <p className="text-gray-600">
                Les activités de la communauté apparaîtront ici.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <Card key={`${activity.type}-${activity.id}`} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-tranches-sage/10 rounded-lg">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          <Link 
                            to={activity.url}
                            className="hover:text-tranches-sage transition-colors"
                          >
                            {activity.title}
                          </Link>
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getActivityTypeColor(activity.type)}>
                            {getActivityTypeLabel(activity.type)}
                          </Badge>
                          <span className="text-sm text-gray-500 flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {activity.author_name}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(new Date(activity.created_at), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {activity.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recent;
