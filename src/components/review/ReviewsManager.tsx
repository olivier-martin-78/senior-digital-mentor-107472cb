import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { useReviewsManagement } from '@/hooks/useReviewsManagement';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ReviewsManager = () => {
  const { data, loading } = useReviewsManagement();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-200">En attente</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-200">Complété</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-red-600 border-red-200">Expiré</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4 text-orange-500" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.stats.pending}</div>
            <p className="text-sm text-muted-foreground">Demandes en cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Complétés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.stats.completed}</div>
            <p className="text-sm text-muted-foreground">Avis reçus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Note moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-blue-600">
                {data.stats.averageRating.toFixed(1)}
              </div>
              <div className="flex">
                {renderStars(Math.round(data.stats.averageRating))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Sur 5 étoiles</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList>
          <TabsTrigger value="requests">Demandes d'avis</TabsTrigger>
          <TabsTrigger value="reviews">Avis reçus</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demandes d'avis</CardTitle>
              <CardDescription>
                Gérez vos demandes d'avis envoyées aux clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.requests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune demande d'avis trouvée
                </p>
              ) : (
                <div className="space-y-4">
                  {data.requests.map((request) => (
                    <div
                      key={request.id}
                      className="flex justify-between items-start p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">
                          {request.client_name || request.caregiver_name || 'Contact inconnu'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {request.city} • {format(new Date(request.review_date), 'dd MMM yyyy', { locale: fr })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Envoyé le {format(new Date(request.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                        </div>
                        {request.expires_at && (
                          <div className="text-xs text-muted-foreground">
                            Expire le {format(new Date(request.expires_at), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Avis reçus</CardTitle>
              <CardDescription>
                Consultez les avis laissés par vos clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.reviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun avis reçu pour le moment
                </p>
              ) : (
                <div className="space-y-4">
                  {data.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {review.reviewer_name || 'Anonyme'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(review.completed_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      {review.comments && (
                        <div className="text-sm bg-muted/50 p-3 rounded">
                          "{review.comments}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReviewsManager;