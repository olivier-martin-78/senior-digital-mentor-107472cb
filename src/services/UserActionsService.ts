import { supabase } from '@/integrations/supabase/client';

export type ActionType = 'create' | 'update' | 'view' | 'delete';
export type ContentType = 'activity' | 'blog_post' | 'diary_entry' | 'wish_post' | 'life_story';

export interface UserAction {
  id: string;
  user_id: string;
  action_type: string;
  content_type: string;
  content_id: string;
  content_title: string;
  timestamp: string;
  metadata: any;
  created_at: string;
  profiles?: {
    display_name: string | null;
    email: string;
  };
}

export class UserActionsService {
  /**
   * Enregistrer une action utilisateur
   */
  static async trackUserAction(
    actionType: ActionType,
    contentType: ContentType,
    contentId: string,
    contentTitle: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      console.log('🔍 UserActionsService.trackUserAction called:', JSON.stringify({
        actionType,
        contentType,
        contentId,
        contentTitle,
        metadata
      }, null, 2));

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('❌ No authenticated user found for tracking');
        return;
      }

      console.log('✅ User found for tracking:', user.id);

      const insertData = {
        user_id: user.id,
        action_type: actionType,
        content_type: contentType,
        content_id: contentId,
        content_title: contentTitle,
        metadata: metadata
      };

      console.log('📤 Inserting user action:', JSON.stringify(insertData, null, 2));

      const { error } = await supabase
        .from('user_actions')
        .insert(insertData);

      if (error) {
        console.error('❌ Error tracking user action:', JSON.stringify(error, null, 2));
        console.error('❌ Error details - code:', error.code, 'message:', error.message);
      } else {
        console.log('✅ User action tracked successfully');
      }
    } catch (error) {
      console.error('❌ Failed to track user action:', error);
    }
  }

  /**
   * Raccourci pour tracker une vue
   */
  static async trackView(
    contentType: ContentType,
    contentId: string,
    contentTitle: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.trackUserAction('view', contentType, contentId, contentTitle, metadata);
  }

  /**
   * Raccourci pour tracker une création
   */
  static async trackCreate(
    contentType: ContentType,
    contentId: string,
    contentTitle: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.trackUserAction('create', contentType, contentId, contentTitle, metadata);
  }

  /**
   * Raccourci pour tracker une modification
   */
  static async trackUpdate(
    contentType: ContentType,
    contentId: string,
    contentTitle: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.trackUserAction('update', contentType, contentId, contentTitle, metadata);
  }

  /**
   * Raccourci pour tracker une suppression
   */
  static async trackDelete(
    contentType: ContentType,
    contentId: string,
    contentTitle: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.trackUserAction('delete', contentType, contentId, contentTitle, metadata);
  }

   /**
    * Récupérer les actions utilisateurs avec filtres (pour les admins)
    */
   static async getUserActions(filters: {
     userId?: string;
     startDate?: string;
     endDate?: string;
     contentType?: ContentType;
     actionType?: ActionType;
     limit?: number;
     offset?: number;
   } = {}): Promise<{ data: UserAction[]; count: number }> {
     try {
       let query = supabase
         .from('user_actions')
         .select('*', { count: 'exact' })
         .order('timestamp', { ascending: false });

       // Appliquer les filtres
       if (filters.userId) {
         query = query.eq('user_id', filters.userId);
       }

       if (filters.startDate) {
         query = query.gte('timestamp', filters.startDate);
       }

       if (filters.endDate) {
         query = query.lte('timestamp', filters.endDate);
       }

       if (filters.contentType) {
         query = query.eq('content_type', filters.contentType);
       }

       if (filters.actionType) {
         query = query.eq('action_type', filters.actionType);
       }

       // Pagination
       if (filters.limit) {
         query = query.limit(filters.limit);
       }

       if (filters.offset) {
         query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
       }

       const { data: actionsData, error, count } = await query;

       if (error) {
         console.error('Error fetching user actions:', error);
         return { data: [], count: 0 };
       }

       if (!actionsData || actionsData.length === 0) {
         return { data: [], count: count || 0 };
       }

       // Récupérer les profils des utilisateurs
       const userIds = [...new Set(actionsData.map(action => action.user_id))];
       const { data: profilesData } = await supabase
         .from('profiles')
         .select('id, display_name, email')
         .in('id', userIds);

       // Associer les profils aux actions
       const actionsWithProfiles = actionsData.map(action => ({
         ...action,
         profiles: profilesData?.find(profile => profile.id === action.user_id) || null
       }));

       return { data: actionsWithProfiles as UserAction[] || [], count: count || 0 };
     } catch (error) {
       console.error('Error in getUserActions:', error);
       return { data: [], count: 0 };
     }
   }

  /**
   * Obtenir les statistiques d'utilisation
   */
  static async getUsageStats(filters: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    totalActions: number;
    uniqueUsers: number;
    topContent: Array<{ content_title: string; content_type: string; view_count: number }>;
    actionsByType: Array<{ action_type: string; count: number }>;
    dailyActivity: Array<{ date: string; count: number }>;
  }> {
    try {
      // Total des actions
      let totalQuery = supabase
        .from('user_actions')
        .select('*', { count: 'exact', head: true });

      if (filters.startDate) {
        totalQuery = totalQuery.gte('timestamp', filters.startDate);
      }
      if (filters.endDate) {
        totalQuery = totalQuery.lte('timestamp', filters.endDate);
      }

      const { count: totalActions } = await totalQuery;

      // Utilisateurs uniques
      let usersQuery = supabase
        .from('user_actions')
        .select('user_id', { count: 'exact' });

      if (filters.startDate) {
        usersQuery = usersQuery.gte('timestamp', filters.startDate);
      }
      if (filters.endDate) {
        usersQuery = usersQuery.lte('timestamp', filters.endDate);
      }

      const { data: usersData } = await usersQuery;
      const uniqueUsers = new Set(usersData?.map(u => u.user_id)).size;

      // Récupérer le top contenu vu
      let topContentQuery = supabase
        .from('user_actions')
        .select('content_title, content_type, content_id')
        .eq('action_type', 'view');

      if (filters.startDate) {
        topContentQuery = topContentQuery.gte('timestamp', filters.startDate);
      }
      if (filters.endDate) {
        topContentQuery = topContentQuery.lte('timestamp', filters.endDate);
      }

      const { data: topContentData } = await topContentQuery;

      // Agréger manuellement les vues par contenu
      const contentCounts = new Map();
      topContentData?.forEach(action => {
        const key = `${action.content_type}-${action.content_id}`;
        if (contentCounts.has(key)) {
          contentCounts.set(key, {
            ...contentCounts.get(key),
            view_count: contentCounts.get(key).view_count + 1
          });
        } else {
          contentCounts.set(key, {
            content_title: action.content_title,
            content_type: action.content_type,
            view_count: 1
          });
        }
      });

      const topContent = Array.from(contentCounts.values())
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, 10);

      return {
        totalActions: totalActions || 0,
        uniqueUsers,
        topContent,
        actionsByType: [],
        dailyActivity: []
      };
    } catch (error) {
      console.error('Error in getUsageStats:', error);
      return {
        totalActions: 0,
        uniqueUsers: 0,
        topContent: [],
        actionsByType: [],
        dailyActivity: []
      };
    }
  }

  /**
   * Tracker une connexion utilisateur
   */
  static async trackLogin(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No authenticated user found for login tracking');
        return;
      }

      // Récupérer les informations du navigateur
      const userAgent = navigator.userAgent;
      const ipAddress = null; // L'IP sera gérée côté serveur si nécessaire
      
      const { error } = await supabase
        .from('user_login_sessions')
        .insert({
          user_id: user.id,
          login_timestamp: new Date().toISOString(),
          ip_address: ipAddress,
          user_agent: userAgent
        });

      if (error) {
        console.error('Error tracking login session:', error);
      } else {
        console.log('Login session tracked successfully');
      }
    } catch (error) {
      console.error('Error in trackLogin:', error);
    }
  }

  /**
   * Récupérer les utilisateurs qui ont des actions enregistrées (pour le filtre admin)
   */
  static async getUsersWithActions(): Promise<Array<{ id: string; display_name: string | null; email: string }>> {
    try {
      // Récupérer les IDs d'utilisateurs uniques qui ont des actions
      const { data: userActions, error: actionsError } = await supabase
        .from('user_actions')
        .select('user_id')
        .order('user_id');

      if (actionsError) {
        console.error('Error fetching user actions:', actionsError);
        return [];
      }

      // Extraire les IDs uniques
      const uniqueUserIds = [...new Set(userActions?.map(action => action.user_id) || [])];

      if (uniqueUserIds.length === 0) {
        return [];
      }

      // Récupérer les profils de ces utilisateurs
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', uniqueUserIds)
        .order('display_name');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }

      return profiles || [];
    } catch (error) {
      console.error('Error in getUsersWithActions:', error);
      return [];
    }
  }

  /**
   * Supprimer toutes les actions d'un utilisateur (pour les admins)
   */
  static async deleteAllUserActions(userId: string): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const { data, error, count } = await supabase
        .from('user_actions')
        .delete({ count: 'exact' })
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting user actions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, deletedCount: count || 0 };
    } catch (error) {
      console.error('Error in deleteAllUserActions:', error);
      return { success: false, error: 'Erreur inattendue lors de la suppression' };
    }
  }
}