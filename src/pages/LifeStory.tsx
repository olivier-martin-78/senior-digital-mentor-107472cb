
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LifeStoryForm from '@/components/life-story/LifeStoryForm';
import LifeStoryUserSelector from '@/components/life-story/LifeStoryUserSelector';

const LifeStory = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  if (!session) {
    navigate('/auth');
    return null;
  }

  const handleUserChange = (userId: string | null) => {
    setSelectedUserId(userId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <LifeStoryUserSelector
            selectedUserId={selectedUserId}
            onUserChange={handleUserChange}
            className="mb-4"
          />
        </div>
        
        <LifeStoryForm targetUserId={selectedUserId} />
      </div>
    </div>
  );
};

export default LifeStory;
