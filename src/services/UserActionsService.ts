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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No authenticated user for action tracking');
        return;
      }

      const { error } = await supabase
        .from('user_actions')
        .insert({
          user_id: user.id,
          action_type: actionType,
          content_type: contentType,
          content_id: contentId,
          content_title: contentTitle,
          metadata: metadata
        });

      if (error) {
        console.error('Error tracking user action:', error);
      }
    } catch (error) {
      console.error('Error in trackUserAction:', error);
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
}