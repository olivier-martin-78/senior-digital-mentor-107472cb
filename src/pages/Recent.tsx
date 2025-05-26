
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import InviteUserDialog from '@/components/InviteUserDialog';
import DateRangeFilter from '@/components/DateRangeFilter';

const Recent = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!session) {
      navigate('/auth');
      return;
    }
    fetchRecentItems();
  }, [session, navigate, startDate, endDate]);

  const fetchRecentItems = async () => {
    try {
      setLoading(true);
      
      // Construire les filtres de date
      let blogQuery = supabase
        .from('blog_posts')
        .select('*, profiles(display_name, email)')
        .eq('published', true)
        .order('created_at', { ascending: false });

      let diaryQuery = supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // Appliquer les filtres de date si définis
      if (startDate) {
        blogQuery = blogQuery.gte('created_at', startDate);
        diaryQuery = diaryQuery.gte('created_at', startDate);
      }
      if (endDate) {
        // Ajouter 23:59:59 à la date de fin pour inclure toute la journée
        const endDateTime = endDate + 'T23:59:59';
        blogQuery = blogQuery.lte('created_at', endDateTime);
        diaryQuery = diaryQuery.lte('created_at', endDateTime);
      }

      const [blogResponse, diaryResponse] = await Promise.all([
        blogQuery.limit(10),
        diaryQuery.limit(10)
      ]);

      if (blogResponse.error) throw blogResponse.error;
      if (diaryResponse.error) throw diaryResponse.error;

      // Combiner et trier par date
      const allItems = [
        ...blogResponse.data.map(item => ({ ...item, type: 'blog' })),
        ...diaryResponse.data.map(item => ({ ...item, type: 'diary' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRecentItems(allItems.slice(0, 20));
    } catch (error) {
      console.error('Erreur lors du chargement des éléments récents:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const getItemLink = (item: any) => {
    if (item.type === 'blog') {
      return `/blog/${item.id}`;
    } else if (item.type === 'diary') {
      return `/diary/${item.id}`;
    }
    return '#';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal">Activité récente</h1>
          <InviteUserDialog />
        </div>

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClear={handleClearFilters}
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid gap-4 mt-6">
            {recentItems.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">Aucune activité récente trouvée pour cette période.</p>
                </CardContent>
              </Card>
            ) : (
              recentItems.map((item, index) => (
                <Card key={`${item.type}-${item.id}-${index}`} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader 
                    className="pb-2"
                    onClick={() => navigate(getItemLink(item))}
                  >
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-medium text-tranches-charcoal">
                        {item.title}
                      </CardTitle>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.type === 'blog' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.type === 'blog' ? 'Album' : 'Journal'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent 
                    className="pt-0"
                    onClick={() => navigate(getItemLink(item))}
                  >
                    <p className="text-sm text-gray-600 mb-2">
                      {formatDate(item.created_at)}
                    </p>
                    {item.type === 'blog' && item.profiles && (
                      <p className="text-sm text-gray-500">
                        Par {item.profiles.display_name || item.profiles.email}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recent;
