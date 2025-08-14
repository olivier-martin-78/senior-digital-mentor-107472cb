import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ReviewRequest {
  id: string;
  professional_id: string;
  client_id?: string;
  caregiver_id?: string;
  review_date: string;
  city: string;
  status: 'pending' | 'completed' | 'expired';
  created_at: string;
  expires_at: string;
  email_sent_at?: string;
  client_name?: string;
  caregiver_name?: string;
}

export interface ClientReview {
  id: string;
  review_request_id: string;
  rating: number;
  comments?: string;
  reviewer_name?: string;
  completed_at: string;
}

export interface ReviewsData {
  requests: ReviewRequest[];
  reviews: ClientReview[];
  stats: {
    pending: number;
    completed: number;
    averageRating: number;
  };
}

export const useReviewsManagement = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ReviewsData>({
    requests: [],
    reviews: [],
    stats: { pending: 0, completed: 0, averageRating: 0 }
  });
  const [loading, setLoading] = useState(true);

  const fetchReviewsData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Fetch review requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('review_requests')
        .select('*')
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch related clients and caregivers separately
      const clientIds = requestsData?.filter(r => r.client_id).map(r => r.client_id) || [];
      const caregiverIds = requestsData?.filter(r => r.caregiver_id).map(r => r.caregiver_id) || [];

      const [clientsData, caregiversData] = await Promise.all([
        clientIds.length > 0 ? supabase.from('clients').select('id, first_name, last_name').in('id', clientIds) : Promise.resolve({ data: [] }),
        caregiverIds.length > 0 ? supabase.from('caregivers').select('id, first_name, last_name').in('id', caregiverIds) : Promise.resolve({ data: [] })
      ]);

      if (requestsError) throw requestsError;

      // Fetch completed reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('client_reviews')
        .select(`
          *,
          review_request:review_requests!inner(professional_id)
        `)
        .eq('review_request.professional_id', user.id)
        .order('completed_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Transform data
      const clientsMap = new Map();
      const caregiversMap = new Map();
      
      clientsData.data?.forEach(c => clientsMap.set(c.id, c));
      caregiversData.data?.forEach(c => caregiversMap.set(c.id, c));

      const transformedRequests: ReviewRequest[] = (requestsData || []).map(req => {
        const client = req.client_id ? clientsMap.get(req.client_id) : undefined;
        const caregiver = req.caregiver_id ? caregiversMap.get(req.caregiver_id) : undefined;
        
        return {
          ...req,
          status: req.status as 'pending' | 'completed' | 'expired',
          client_name: client ? `${(client as any).first_name} ${(client as any).last_name}` : undefined,
          caregiver_name: caregiver ? `${(caregiver as any).first_name} ${(caregiver as any).last_name}` : undefined,
        };
      });

      const transformedReviews: ClientReview[] = reviewsData || [];

      // Calculate stats
      const pending = transformedRequests.filter(r => r.status === 'pending').length;
      const completed = transformedRequests.filter(r => r.status === 'completed').length;
      const ratings = transformedReviews.map(r => r.rating);
      const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      setData({
        requests: transformedRequests,
        reviews: transformedReviews,
        stats: { pending, completed, averageRating }
      });
    } catch (error) {
      console.error('Error fetching reviews data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsData();
  }, [user?.id]);

  return { data, loading, refetch: fetchReviewsData };
};