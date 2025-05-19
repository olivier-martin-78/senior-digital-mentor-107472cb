
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
  physical_state: 'fatigué' | 'dormi' | 'énergique' | null;
  mental_state: 'stressé' | 'calme' | 'motivé' | null;
  contacted_people: string[] | null;
  reflections: string | null;
  media_url: string | null;
  media_type: string | null;
  desire_of_day: string | null;
  tags: string[] | null;
  private_notes: string | null;
  is_private_notes_locked: boolean | null;
  objectives: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DiaryEntryWithAuthor extends DiaryEntry {
  profiles: Profile;
}
