
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { LifeStoryProgress } from '@/types/lifeStory';

interface StoryProgressProps {
  progress: LifeStoryProgress;
}

export const StoryProgress: React.FC<StoryProgressProps> = ({ progress }) => {
  const progressPercentage = progress.totalQuestions > 0 
    ? Math.round((progress.answeredQuestions / progress.totalQuestions) * 100) 
    : 0;
    
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Progression: {progress.answeredQuestions}/{progress.totalQuestions} questions</span>
        <span>{progressPercentage}%</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
};

export default StoryProgress;
