
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCaregiversAccess } from '@/hooks/useCaregiversAccess';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, MessageSquare, Star } from 'lucide-react';
import InterventionReportsList from '@/components/caregivers/InterventionReportsList';
import CommunicationSpace from '@/components/caregivers/CommunicationSpace';
import InterventionReviews from '@/components/caregivers/InterventionReviews';

const Caregivers = () => {
  const { session, isLoading: authLoading } = useAuth();
  const { hasCaregiversAccess, isLoading: accessLoading } = useCaregiversAccess();
  const [activeTab, setActiveTab] = useState('reports');
  const [hasViewedCommunication, setHasViewedCommunication] = useState(false);
  
  const { unreadCount, markAllAsRead } = useUnreadMessages();
  const { isMobileDevice } = useIsMobile();

  const navigate = useNavigate();

  // Détecter si c'est un iPhone
  const isIPhone = isMobileDevice && typeof navigator !== 'undefined' && /iPhone/i.test(navigator.userAgent);

  // Marquer les messages comme lus quand l'utilisateur clique sur l'onglet communication
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'communication' && !hasViewedCommunication) {
      setHasViewedCommunication(true);
      markAllAsRead();
    }
  };

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!session) {
    navigate('/auth');
    return null;
  }

  if (!hasCaregiversAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Accès non autorisé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              Vous n'avez pas accès à l'espace aidants. Vous devez être proche aidant ou professionnel de santé.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Afficher la pastille seulement si l'utilisateur n'a pas encore visité l'onglet communication
  const displayUnreadCount = !hasViewedCommunication ? unreadCount : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Espace Aidants
          </h1>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="reports">
                {isIPhone ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  "Rapports d'intervention"
                )}
              </TabsTrigger>
              <TabsTrigger value="communication" className="relative">
                {isIPhone ? (
                  <MessageSquare className="h-4 w-4" />
                ) : (
                  "Espace de coordination"
                )}
                {displayUnreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {displayUnreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="reviews">
                {isIPhone ? (
                  <Star className="h-4 w-4" />
                ) : (
                  "Avis sur les interventions"
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reports" className="mt-6">
              <InterventionReportsList />
            </TabsContent>

            <TabsContent value="communication" className="mt-6">
              <CommunicationSpace />
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <InterventionReviews />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Caregivers;
