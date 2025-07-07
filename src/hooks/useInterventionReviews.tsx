
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface InterventionReview {
  id: string;
  date: string;
  patient_name: string;
  auxiliary_name: string;
  professional_id: string;
  client_rating?: number;
  client_comments?: string;
}

interface ReviewsByProfessional {
  [professionalId: string]: {
    auxiliary_name: string;
    reviews: InterventionReview[];
    ratings: number[];
    averageRating?: number;
  };
}

interface ReviewsData {
  reportsWithReviews: InterventionReview[];
  byProfessional: ReviewsByProfessional;
  totalReviews: number;
  averageRating: number;
}

export const useInterventionReviews = () => {
  const { session } = useAuth();
  const [reviewsData, setReviewsData] = useState<ReviewsData>({
    reportsWithReviews: [],
    byProfessional: {},
    totalReviews: 0,
    averageRating: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchInterventionReviews = async () => {
    if (!session?.user) {
      console.log('❌ Pas d\'utilisateur connecté pour les avis');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔍 Récupération optimisée des avis d\'intervention...');
      
      // Requête optimisée : récupérer uniquement les rapports avec des avis/notes
      const { data: reports, error } = await supabase
        .from('intervention_reports')
        .select(`
          id,
          date,
          patient_name,
          auxiliary_name,
          professional_id,
          client_rating,
          client_comments
        `)
        .or('client_rating.not.is.null,client_comments.not.is.null')
        .order('date', { ascending: false })
        .limit(100); // Limiter à 100 avis récents

      if (error) {
        console.error('❌ Erreur lors de la récupération des avis:', error);
        setReviewsData({
          reportsWithReviews: [],
          byProfessional: {},
          totalReviews: 0,
          averageRating: 0
        });
        return;
      }

      if (!reports || reports.length === 0) {
        console.log('✅ Aucun avis trouvé');
        setReviewsData({
          reportsWithReviews: [],
          byProfessional: {},
          totalReviews: 0,
          averageRating: 0
        });
        return;
      }

      console.log('✅ Avis optimisés trouvés:', reports.length);

      // Traitement optimisé des données
      const byProfessional: ReviewsByProfessional = {};
      const allRatings: number[] = [];

      reports.forEach(report => {
        if (!byProfessional[report.professional_id]) {
          byProfessional[report.professional_id] = {
            auxiliary_name: report.auxiliary_name,
            reviews: [],
            ratings: []
          };
        }
        
        byProfessional[report.professional_id].reviews.push(report);
        
        if (report.client_rating) {
          byProfessional[report.professional_id].ratings.push(report.client_rating);
          allRatings.push(report.client_rating);
        }
      });

      // Calculer les moyennes
      Object.keys(byProfessional).forEach(professionalId => {
        const ratings = byProfessional[professionalId].ratings;
        if (ratings.length > 0) {
          byProfessional[professionalId].averageRating = 
            ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        }
      });

      const averageRating = allRatings.length > 0 
        ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length 
        : 0;

      setReviewsData({
        reportsWithReviews: reports,
        byProfessional,
        totalReviews: reports.length,
        averageRating
      });

    } catch (error) {
      console.error('❌ Erreur générale lors du chargement des avis:', error);
      setReviewsData({
        reportsWithReviews: [],
        byProfessional: {},
        totalReviews: 0,
        averageRating: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventionReviews();
  }, [session]);

  return {
    reviewsData,
    isLoading,
    refetch: fetchInterventionReviews
  };
};
