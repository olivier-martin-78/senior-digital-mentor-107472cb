import React, { useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFitnessArticle, useFitnessArticles } from '@/hooks/useFitnessArticles';
import FitnessArticleCard from '@/components/fitness/FitnessArticleCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Eye, Calendar, Edit } from 'lucide-react';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { supabase } from '@/integrations/supabase/client';

// Suggestions (related + recent) are isolated to avoid any hook-order issues in the main component
const ArticleSuggestions: React.FC<{ categoryId?: string; currentId: string; categoryName?: string }>
  = ({ categoryId, currentId, categoryName }) => {
  const recentFilters = useMemo(() => ({ published: true, limit: 6 }), []);
  const relatedFilters = useMemo(() => ({ published: true, categoryId, limit: 6 }), [categoryId]);

  const { articles: recentArticles } = useFitnessArticles(recentFilters);
  const { articles: relatedArticles } = useFitnessArticles(relatedFilters);

  const filteredRelatedArticles = relatedArticles.filter(a => a.id !== currentId);
  const filteredRecentArticles = recentArticles.filter(a => a.id !== currentId);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {filteredRelatedArticles.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">
            Articles dans la catégorie "{categoryName || 'Non catégorisé'}"
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRelatedArticles.slice(0, 6).map(relatedArticle => (
              <FitnessArticleCard 
                key={relatedArticle.id} 
                article={relatedArticle}
                compact={true}
              />
            ))}
          </div>
        </section>
      )}

      {filteredRecentArticles.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Articles récents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecentArticles.slice(0, 6).map(recentArticle => (
              <FitnessArticleCard 
                key={recentArticle.id} 
                article={recentArticle}
                compact={true}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const FitnessArticle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { article, loading } = useFitnessArticle(id!);
  const { user } = useOptionalAuth();
  
  // Debug: auth and route state
  useEffect(() => {
    console.info('[FitnessArticle] init', { id, userId: user?.id ?? null });
  }, [id, user]);
  
  // Debug: article loading state changes  
  useEffect(() => {
    console.debug('[FitnessArticle] state', { loading, hasArticle: !!article });
    if (article) {
      console.debug('[FitnessArticle] article loaded', {
        id: article.id,
        title: article.title,
        category: article.fitness_categories?.name,
        published: article.published,
        imageUrl: article.image_url
      });
    }
  }, [loading, article]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article non trouvé</h1>
          <Button asChild>
            <Link to="/fitness">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux articles
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button asChild variant="ghost">
            <Link to="/fitness">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux articles
            </Link>
          </Button>
        </div>

        {/* Article Content */}
        <article className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="mb-4">
              <Badge variant="secondary" className="mb-4">
                {article.fitness_categories?.name || 'Non catégorisé'}
              </Badge>
            </div>
            
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {article.title}
            </h1>
            
            {article.subtitle && (
              <p className="text-xl text-muted-foreground mb-6">
                {article.subtitle}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{article.view_count} vues</span>
              </div>
            </div>

            {/* Edit Button for Article Author */}
            {user && user.id === article.author_id && (
              <div className="mt-4">
                <Button asChild>
                  <Link to={`/fitness/editor/${article.id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier l'article
                  </Link>
                </Button>
              </div>
            )}
          </header>

          {/* Featured Image */}
          {article.image_url && (
            <div className="mb-8">
              <img 
                src={article.image_url && /^https?:\/\//.test(article.image_url) ? article.image_url : (article.image_url ? supabase.storage.from('blog-media').getPublicUrl(article.image_url).data.publicUrl : '')}
                alt={article.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg"
                loading="lazy"
                decoding="async"
                onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
              />
            </div>
          )}

          {/* Article Content */}
          <div 
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: article.content || '' }}
          />

          {/* Source */}
          {article.source && (
            <div className="mb-12">
              <p className="text-sm text-muted-foreground">
                <strong>Source :</strong> {article.source}
              </p>
            </div>
          )}
        </article>

        {/* Bottom Sections */}
        <ArticleSuggestions 
          categoryId={article.category_id} 
          currentId={article.id} 
          categoryName={article.fitness_categories?.name}
        />
      </div>
    </div>
  );
};

export default FitnessArticle;
