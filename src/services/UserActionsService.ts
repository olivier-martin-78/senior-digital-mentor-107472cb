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
    contentTitle?: string;
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

        if (filters.contentTitle) {
          query = query.eq('content_title', filters.contentTitle);
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
   * Obtenir les statistiques d'utilisation en utilisant la procédure stockée consolidée
   */
  static async getUsageStats(filters: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    contentType?: ContentType;
    actionType?: ActionType;
  } = {}): Promise<any> {
    try {
      console.log('🔍 DEBUG getUsageStats called with filters:', filters);
      
      // Convertir les filtres pour la procédure stockée SQL
      const startDateParam = filters.startDate ? new Date(filters.startDate).toISOString() : null;
      const endDateParam = filters.endDate ? new Date(filters.endDate).toISOString() : null;
      const userIdParam = filters.userId || null;
      const contentTypeParam = filters.contentType || null;
      const actionTypeParam = filters.actionType || null;

      console.log('📊 DEBUG: Calling SQL procedure with params:', {
        startDateParam,
        endDateParam,
        userIdParam,
        contentTypeParam,
        actionTypeParam
      });

      // Appeler la procédure stockée consolidée
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        start_date_param: startDateParam,
        end_date_param: endDateParam,
        user_id_param: userIdParam,
        content_type_param: contentTypeParam,
        action_type_param: actionTypeParam
      });

      if (error) {
        console.error('❌ ERROR calling get_dashboard_stats:', error);
        throw error;
      }

      console.log('✅ DEBUG: SQL procedure returned data:', {
        totalActions: (data as any)?.totalActions,
        uniqueUsers: (data as any)?.uniqueUsers,
        topContentCount: (data as any)?.topContent?.length || 0,
        sessionsByUserCount: (data as any)?.sessionsByUser?.length || 0,
        usersFromActionsCount: (data as any)?.usersFromActions?.length || 0
      });

      // DEBUG spécial pour Nancy89
      const nancy89Session = (data as any)?.sessionsByUser?.find((user: any) => user.user_id === '9f07fe60-2208-47b8-a255-f759447059a1');
      if (nancy89Session) {
        console.log('🎯 NANCY89 FINAL RESULT FROM SQL:', nancy89Session);
      } else {
        console.log('🎯 NANCY89 NOT FOUND in sessionsByUser results from SQL');
        // Chercher dans les logs SQL pour debug
        console.log('🔍 DEBUG: First 5 users in sessionsByUser:', (data as any)?.sessionsByUser?.slice(0, 5));
      }

      return (data as any) || {
        totalActions: 0,
        totalActionsGlobal: 0,
        uniqueUsers: 0,
        uniqueUsersFromSessions: 0,
        topContent: [],
        actionsByType: [],
        dailyActivity: [],
        sessionsByUser: [],
        usersFromActions: []
      };
    } catch (error) {
      console.error('❌ ERROR in getUsageStats:', error);
      return {
        totalActions: 0,
        totalActionsGlobal: 0,
        uniqueUsers: 0,
        uniqueUsersFromSessions: 0,
        topContent: [],
        actionsByType: [],
        dailyActivity: [],
        sessionsByUser: [],
        usersFromActions: []
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
        .limit(5000) // Limite explicite pour récupérer tous les utilisateurs
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

      // Récupérer les profils de ces utilisateurs, y compris les admins
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