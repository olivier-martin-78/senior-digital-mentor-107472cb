
import React from 'react';
import Header from '@/components/Header';

const RecentLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default RecentLoading;
