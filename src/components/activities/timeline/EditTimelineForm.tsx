import React, { useState, useEffect } from 'react';
import { TimelineData } from '@/types/timeline';
import { CreateTimelineForm } from './CreateTimelineForm';

interface EditTimelineFormProps {
  initialData: TimelineData;
  onSubmit: (data: TimelineData & { subActivityTagId?: string }) => void;
  onCancel: () => void;
  initialSubActivityTagId?: string | null;
}

export const EditTimelineForm: React.FC<EditTimelineFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  initialSubActivityTagId
}) => {
  console.log('🔍 EditTimelineForm - Initialisation avec:', {
    initialData,
    initialSubActivityTagId
  });

  return (
    <CreateTimelineForm 
      onSubmit={onSubmit}
      onCancel={onCancel}
      initialData={initialData}
      initialSubActivityTagId={initialSubActivityTagId}
    />
  );
};