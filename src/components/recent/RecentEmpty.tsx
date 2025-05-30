
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const RecentEmpty: React.FC = () => {
  return (
    <Card>
      <CardContent className="text-center py-8">
        <p className="text-gray-500">Aucune activité récente trouvée.</p>
      </CardContent>
    </Card>
  );
};

export default RecentEmpty;
