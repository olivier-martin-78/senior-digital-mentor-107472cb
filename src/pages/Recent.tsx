
import React from 'react';
import Header from '@/components/Header';
import RecentItemCard from '@/components/recent/RecentItemCard';
import RecentLoading from '@/components/recent/RecentLoading';
import RecentEmpty from '@/components/recent/RecentEmpty';
import { useRecentItems } from '@/hooks/useRecentItems';

const Recent = () => {
  const { recentItems, loading } = useRecentItems();

  if (loading) {
    return <RecentLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif text-tranches-charcoal mb-6">Activité récente</h1>
        
        {recentItems.length === 0 ? (
          <RecentEmpty />
        ) : (
          <div className="grid gap-6">
            {recentItems.map((item) => (
              <RecentItemCard 
                key={`${item.type}-${item.id}`} 
                item={item} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recent;
