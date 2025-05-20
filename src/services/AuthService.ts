
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState } from '@/utils/authUtils';
import { Profile, AppRole } from '@/types/supabase';

/**
 * Service to handle authentication operations
 */
export class AuthService {
  /**
   * Fetch a user's profile data
   */
  static async fetchUserProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data as Profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  /**
   * Fetch a user's roles
   */
  static async fetchUserRoles(userId: string): Promise<AppRole[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching roles:', error);
        return [];
      }
      
      return data.map(item => item.role);
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<void> {
    // Clean up existing auth state
    cleanupAuthState();
    
    // Attempt global sign out first
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      // Continue even if this fails
    }
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUp(email: string, password: string, displayName?: string): Promise<void> {
    // Clean up existing auth state
    cleanupAuthState();
    
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });
    
    if (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<void> {
    // Clean up auth state
    cleanupAuthState();
    
    // Attempt global sign out
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      // Ignore errors
    }
  }

  /**
   * Check if session exists
   */
  static async getSession(): Promise<{ session: Session | null }> {
    const { data } = await supabase.auth.getSession();
    return { session: data.session };
  }

  /**
   * Set up auth state listener
   */
  static onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session);
    });
  }
}
