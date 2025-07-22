import React, { useState, useEffect } from 'react';
import { TimelineData } from '@/types/timeline';
import { CreateTimelineForm } from './CreateTimelineForm';

interface EditTimelineFormProps {
  initialData: TimelineData;
  onSubmit: (data: TimelineData) => void;
  onCancel: () => void;
}

export const EditTimelineForm: React.FC<EditTimelineFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel 
}) => {
  return (
    <CreateTimelineForm 
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
};