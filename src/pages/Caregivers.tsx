
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCaregiversAccess } from '@/hooks/useCaregiversAccess';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InterventionReportsList from '@/components/caregivers/InterventionReportsList';
import CommunicationSpace from '@/components/caregivers/CommunicationSpace';
import InterventionReviews from '@/components/caregivers/InterventionReviews';

const Caregivers = () => {
  const { session, isLoading: authLoading } = useAuth();
  const { hasCaregiversAccess, isLoading: accessLoading } = useCaregiversAccess();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reports');

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Espace Aidants
          </h1>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="reports">Rapports d'intervention</TabsTrigger>
              <TabsTrigger value="communication">Espace de coordination</TabsTrigger>
              <TabsTrigger value="reviews">Avis sur les interventions</TabsTrigger>
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
