
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AppRole } from '@/types/supabase';

export class AuthService {
  static async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session: data.session };
  }

  static onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  }

  static async fetchUserProfile(userId: string): Promise<Profile | null> {
    console.log('🔍 Fetching profile for user:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching user profile:', error);
      return null;
    }

    console.log('✅ Profile fetched successfully:', data);
    return data;
  }

  static async fetchUserRoles(userId: string): Promise<AppRole[]> {
    console.log('🔍 Fetching roles for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error fetching user roles:', error);
        return [];
      }

      console.log('✅ Raw roles data from database:', data);
      const roles = data?.map(row => row.role) || [];
      console.log('✅ Processed roles array:', roles);
      return roles;
    } catch (error) {
      console.error('❌ Exception while fetching roles:', error);
      return [];
    }
  }
}
