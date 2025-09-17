import React, { useState } from 'react';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { useFitnessArticles } from '@/hooks/useFitnessArticles';
import { useFitnessCategories } from '@/hooks/useFitnessCategories';
import FitnessArticleCard from '@/components/fitness/FitnessArticleCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Gamepad2, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const FitnessHome = () => {
  const { user } = useOptionalAuth();
  const [articlesPerCategory, setArticlesPerCategory] = useState(5);
  const [recentArticlesLimit, setRecentArticlesLimit] = useState(6);

  // Fetch featured article (most viewed)
  const { articles: featuredArticles, loading: featuredLoading } = useFitnessArticles({
    published: true,
    limit: 1,
    orderBy: 'view_count',
    ascending: false
  });

  // Fetch recent articles
  const { articles: recentArticles, loading: recentLoading } = useFitnessArticles({
    published: true,
    limit: recentArticlesLimit
  });

  // Fetch user's drafts (unpublished articles)
  const { articles: userDrafts, loading: draftsLoading } = useFitnessArticles({
    published: false,
    limit: 20
  });

  // Fetch categories
  const { categories, loading: categoriesLoading } = useFitnessCategories();
  
  const predefinedCategories = categories.filter(cat => cat.is_predefined);

  // For now, we'll just show recent articles by category
  // Later we can optimize with separate API calls if needed

  const displayName = user?.user_metadata?.display_name || user?.email || 'Visiteur';

  const showMoreRecentArticles = () => {
    setRecentArticlesLimit(prev => prev + 6);
  };

  if (featuredLoading || categoriesLoading || draftsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  const featuredArticle = featuredArticles[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {user ? `Bienvenue ${displayName}` : 'Rester en forme'}
            </h1>
            <p className="text-muted-foreground text-lg">
              Découvrez nos conseils pour rester en forme
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/home">
                <Target className="w-4 h-4 mr-2" />
                Notre intention  
              </Link>
            </Button>
            
            <Button asChild variant="outline">
              <Link to="/activities/games">
                <Gamepad2 className="w-4 h-4 mr-2" />
                Jeux cognitifs
              </Link>
            </Button>
            
            {user && (
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to="/fitness/editor">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvel article
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* User's Drafts */}
        {user && userDrafts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Mes brouillons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userDrafts.map(article => (
                <Card key={article.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="mb-2">Brouillon</Badge>
                      {article.fitness_categories && (
                        <Badge variant="secondary" className="text-xs">
                          {article.fitness_categories.name}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {article.subtitle && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {article.subtitle}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link to={`/fitness/editor/${article.id}`}>
                          Continuer l'édition
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Featured Article */}
        {featuredArticle ? (
          <section className="mb-12">
            <Card className="overflow-hidden">
              <div className="md:flex">
                {featuredArticle.image_url && (
                  <div className="md:w-1/2">
                    <img 
                      src={featuredArticle.image_url && /^https?:\/\//.test(featuredArticle.image_url) ? featuredArticle.image_url : (featuredArticle.image_url ? supabase.storage.from('blog-media').getPublicUrl(featuredArticle.image_url).data.publicUrl : '')}
                      alt={featuredArticle.title}
                      className="w-full h-64 md:h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                    />
                  </div>
                )}
                <div className={featuredArticle.image_url ? "md:w-1/2 p-6" : "p-6"}>
                  <Badge variant="secondary" className="mb-3">
                    {featuredArticle.fitness_categories.name}
                  </Badge>
                  <h3 className="text-2xl font-bold mb-3">{featuredArticle.title}</h3>
                  {featuredArticle.subtitle && (
                    <p className="text-muted-foreground mb-4">{featuredArticle.subtitle}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>{featuredArticle.view_count} vues</span>
                  </div>
                  <Button asChild>
                    <Link to={`/fitness/article/${featuredArticle.id}`}>
                      Lire l'article
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        ) : (
          <section className="mb-12">
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">Aucun article publié pour le moment.</p>
            </Card>
          </section>
        )}

        {/* Articles by Category */}
        {predefinedCategories.length > 0 && (
          <section className="mb-12">
            <div className="space-y-8">
              {predefinedCategories.map(category => {
                // Filter recent articles by category for display
                const categoryRecentArticles = recentArticles.filter(
                  article => article.category_id === category.id
                ).slice(0, articlesPerCategory);
                
                if (categoryRecentArticles.length === 0) return null;

                return (
                  <div key={category.id}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">{category.name}</h3>
                      <Badge variant="outline">{categoryRecentArticles.length} articles</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      {categoryRecentArticles.map(article => (
                        <FitnessArticleCard 
                          key={article.id} 
                          article={article} 
                          compact={false}
                          fullWidth={true}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {predefinedCategories.every(category => 
                recentArticles.filter(article => article.category_id === category.id).length === 0
              ) && (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">Aucun article publié dans les catégories pour le moment.</p>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* Recent Articles */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Articles récents</h2>
          {recentLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : recentArticles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {recentArticles.map(article => (
                  <FitnessArticleCard key={article.id} article={article} />
                ))}
              </div>
              
              {recentArticles.length >= recentArticlesLimit && (
                <div className="text-center">
                  <Button 
                    onClick={showMoreRecentArticles}
                    variant="outline"
                    size="lg"
                  >
                    Afficher plus d'articles
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">Aucun article publié pour le moment.</p>
              <Button asChild className="mt-4">
                <Link to="/fitness/editor">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer le premier article
                </Link>
              </Button>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
};

export default FitnessHome;