import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar } from 'lucide-react';
import type { FitnessArticleWithCategory } from '@/types/fitness';
import { supabase } from '@/integrations/supabase/client';

interface FitnessArticleCardProps {
  article: FitnessArticleWithCategory;
  compact?: boolean;
  fullWidth?: boolean;
}

const FitnessArticleCard: React.FC<FitnessArticleCardProps> = ({ article, compact = false, fullWidth = false }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
      <Link to={`/fitness/article/${article.id}`} className="block h-full">
        {fullWidth ? (
          <div className="md:flex h-full">
            {article.image_url && (
              <div className="md:w-1/2">
                <img 
                  src={article.image_url && /^https?:\/\//.test(article.image_url) ? article.image_url : (article.image_url ? supabase.storage.from('blog-media').getPublicUrl(article.image_url).data.publicUrl : '')}
                  alt={article.title}
                  className="w-full h-64 md:h-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                />
              </div>
            )}
            <div className={article.image_url ? "md:w-1/2 p-6 flex flex-col justify-between" : "p-6 flex flex-col justify-between"}>
              <div>
                <Badge variant="secondary" className="mb-3">
                  {article.fitness_categories.name}
                </Badge>
                <h3 className="text-2xl font-bold text-foreground mb-3">{article.title}</h3>
                {article.subtitle && (
                  <p className="text-muted-foreground mb-4">{article.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(article.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{article.view_count} vues</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {article.image_url && (
              <div className={`relative overflow-hidden ${compact ? 'h-32' : 'h-48'}`}>
                <img 
                  src={article.image_url && /^https?:\/\//.test(article.image_url) ? article.image_url : (article.image_url ? supabase.storage.from('blog-media').getPublicUrl(article.image_url).data.publicUrl : '')}
                  alt={article.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-white/90">
                    {article.fitness_categories.name}
                  </Badge>
                </div>
              </div>
            )}
            
            <CardContent className={`flex-1 flex flex-col ${compact ? 'p-3' : 'p-4'}`}>
              <div className="flex-1">
                <h3 className={`font-bold text-foreground line-clamp-2 mb-1 ${compact ? 'text-sm' : 'text-lg'}`}>
                  {article.title}
                </h3>
                
                {article.subtitle && (
                  <p className={`text-muted-foreground line-clamp-2 mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>
                    {article.subtitle}
                  </p>
                )}
              </div>
              
              <div className={`flex items-center justify-between text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(article.created_at)}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{article.view_count}</span>
                </div>
              </div>
            </CardContent>
          </div>
        )}
      </Link>
    </Card>
  );
};

export default FitnessArticleCard;