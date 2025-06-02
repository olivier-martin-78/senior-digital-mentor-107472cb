
import React from 'react';
import NotificationButton from '@/components/NotificationButton';
import { DiaryEntry } from '@/types/diary';

interface DiaryEntryNotificationProps {
  entry: DiaryEntry;
  onNotificationSent?: () => void;
}

const DiaryEntryNotification: React.FC<DiaryEntryNotificationProps> = ({
  entry,
  onNotificationSent
}) => {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">
            Notifier vos abonnés de cette nouvelle entrée
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Envoyez un email à ceux qui suivent votre journal
          </p>
        </div>
        <NotificationButton
          contentType="diary"
          contentId={entry.id}
          title={entry.title}
          isNotificationSent={entry.email_notification_sent}
          onNotificationSent={onNotificationSent}
        />
      </div>
    </div>
  );
};

export default DiaryEntryNotification;
