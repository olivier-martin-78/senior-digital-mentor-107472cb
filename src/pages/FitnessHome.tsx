import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFitnessArticles } from '@/hooks/useFitnessArticles';
import { useFitnessCategories } from '@/hooks/useFitnessCategories';
import FitnessArticleCard from '@/components/fitness/FitnessArticleCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const FitnessHome = () => {
  const { user } = useAuth();
  const [articlesPerCategory, setArticlesPerCategory] = useState(5);
  const [recentArticlesLimit, setRecentArticlesLimit] = useState(6);

  // Fetch featured article (most viewed)
  const { articles: featuredArticles, loading: featuredLoading } = useFitnessArticles({
    published: true,
    limit: 1
  });

  // Fetch recent articles
  const { articles: recentArticles, loading: recentLoading } = useFitnessArticles({
    published: true,
    limit: recentArticlesLimit
  });

  // Fetch categories
  const { categories, loading: categoriesLoading } = useFitnessCategories();
  
  const predefinedCategories = categories.filter(cat => cat.is_predefined);

  // For now, we'll just show recent articles by category
  // Later we can optimize with separate API calls if needed

  const displayName = user?.user_metadata?.display_name || user?.email || 'Utilisateur';

  const showMoreRecentArticles = () => {
    setRecentArticlesLimit(prev => prev + 6);
  };

  if (featuredLoading || categoriesLoading) {
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
              Bienvenue {displayName}
            </h1>
            <p className="text-muted-foreground text-lg">
              Découvrez nos conseils pour rester en forme
            </p>
          </div>
          
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link to="/fitness/editor">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel article
            </Link>
          </Button>
        </div>

        {/* Featured Article */}
        {featuredArticle && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Article vedette</h2>
            <Card className="overflow-hidden">
              <div className="md:flex">
                {featuredArticle.image_url && (
                  <div className="md:w-1/2">
                    <img 
                      src={featuredArticle.image_url}
                      alt={featuredArticle.title}
                      className="w-full h-64 md:h-full object-cover"
                    />
                  </div>
                )}
                <div className="md:w-1/2 p-6">
                  <Badge variant="secondary" className="mb-3">
                    {featuredArticle.fitness_categories.name}
                  </Badge>
                  <h3 className="text-2xl font-bold mb-3">{featuredArticle.title}</h3>
                  {featuredArticle.subtitle && (
                    <p className="text-muted-foreground mb-4">{featuredArticle.subtitle}</p>
                  )}
                  <Button asChild>
                    <Link to={`/fitness/article/${featuredArticle.id}`}>
                      Lire l'article
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Articles by Category */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Parcourir par catégorie</h2>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {categoryRecentArticles.map(article => (
                      <FitnessArticleCard 
                        key={article.id} 
                        article={article} 
                        compact={true}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Articles */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Articles récents</h2>
          {recentLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
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
          )}
        </section>
      </div>
    </div>
  );
};

export default FitnessHome;