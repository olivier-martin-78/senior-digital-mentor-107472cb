
import { Profile } from './supabase';

export interface DiaryEntry {
  id: string;
  user_id: string;
  entry_date: string;
  title: string;
  activities: string | null;
  mood_rating: number | null;
  positive_things: string | null;
  negative_things: string | null;
  physical_state: string | null;
  mental_state: string | null;
  contacted_people: string[] | null;
  reflections: string | null;
  media_url: string | null;
  media_type: string | null;
  desire_of_day: string | null;
  tags: string[] | null;
  private_notes: string | null;
  is_private_notes_locked: boolean | null;
  objectives: string | null;
  shared_globally?: boolean;
  created_at: string | null;
  updated_at: string | null;
  email_notification_sent?: boolean;
  email_notification_requested?: boolean;
}

export interface DiaryEntryWithAuthor extends DiaryEntry {
  profiles: Profile;
}
