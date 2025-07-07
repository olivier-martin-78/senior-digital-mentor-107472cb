
import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCaregiversData } from '@/hooks/useCaregiversData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, TrendingUp } from 'lucide-react';

const InterventionReviews = () => {
  const { interventionReports, clients, isLoading } = useCaregiversData();

  const reviewsData = useMemo(() => {
    const reportsWithReviews = interventionReports.filter(
      report => report.client_rating || report.client_comments
    );

    // Grouper par professionnel
    const byProfessional = reportsWithReviews.reduce((acc, report) => {
      if (!acc[report.professional_id]) {
        acc[report.professional_id] = {
          auxiliary_name: report.auxiliary_name,
          reviews: [],
          ratings: []
        };
      }
      
      acc[report.professional_id].reviews.push(report);
      if (report.client_rating) {
        acc[report.professional_id].ratings.push(report.client_rating);
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Calculer les moyennes
    Object.keys(byProfessional).forEach(professionalId => {
      const ratings = byProfessional[professionalId].ratings;
      if (ratings.length > 0) {
        byProfessional[professionalId].averageRating = 
          ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length;
      }
    });

    return {
      reportsWithReviews,
      byProfessional,
      totalReviews: reportsWithReviews.length,
      averageRating: reportsWithReviews
        .filter(r => r.client_rating)
        .reduce((sum, r) => sum + r.client_rating!, 0) / 
        reportsWithReviews.filter(r => r.client_rating).length || 0
    };
  }, [interventionReports]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (reviewsData.reportsWithReviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <Star className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Aucun avis disponible pour le moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="mx-auto h-8 w-8 text-blue-500 mb-2" />
              <div className="text-2xl font-bold">{reviewsData.totalReviews}</div>
              <p className="text-sm text-gray-600">Avis total</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Star className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
              <div className="text-2xl font-bold">
                {reviewsData.averageRating.toFixed(1)}
              </div>
              <p className="text-sm text-gray-600">Note moyenne</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <div className="text-2xl font-bold">
                {reviewsData.reportsWithReviews.filter(r => r.client_comments).length}
              </div>
              <p className="text-sm text-gray-600">Commentaires</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Avis par professionnel */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Avis par intervenant</h3>
        
        {Object.entries(reviewsData.byProfessional).map(([professionalId, data]: [string, any]) => (
          <Card key={professionalId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{data.auxiliary_name}</CardTitle>
                <div className="flex items-center gap-2">
                  {data.averageRating && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current text-yellow-500" />
                      {data.averageRating.toFixed(1)}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {data.reviews.length} avis
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.reviews.map((review: any) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{review.patient_name}</span>
                      <div className="flex items-center gap-2">
                        {review.client_rating && (
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.client_rating
                                    ? 'fill-current text-yellow-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        <span className="text-sm text-gray-500">
                          {format(new Date(review.date), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </div>
                    </div>
                    {review.client_comments && (
                      <p className="text-gray-700 text-sm">{review.client_comments}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InterventionReviews;
