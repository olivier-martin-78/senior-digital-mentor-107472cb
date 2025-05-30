
import { Session, User } from '@supabase/supabase-js';
import { AppRole, Profile } from '@/types/supabase';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  getEffectiveUserId?: () => string | undefined;
}
