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
   * Obtenir les statistiques d'utilisation
   */
  static async getUsageStats(filters: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    contentType?: ContentType;
    actionType?: ActionType;
  } = {}): Promise<{
    totalActions: number;
    totalActionsGlobal: number;
    uniqueUsers: number;
    topContent: Array<{ content_title: string; content_type: string; view_count: number }>;
    actionsByType: Array<{ action_type: string; count: number }>;
    dailyActivity: Array<{ date: string; count: number }>;
    sessionsByUser: Array<{ user_id: string; session_count: number; display_name?: string }>;
  }> {
    try {
      // Total des actions avec tous les filtres
      let totalQuery = supabase
        .from('user_actions')
        .select('*', { count: 'exact', head: true });

      if (filters.startDate) {
        totalQuery = totalQuery.gte('timestamp', filters.startDate);
      }
      if (filters.endDate) {
        totalQuery = totalQuery.lte('timestamp', filters.endDate);
      }
      if (filters.userId) {
        totalQuery = totalQuery.eq('user_id', filters.userId);
      }
      if (filters.contentType) {
        totalQuery = totalQuery.eq('content_type', filters.contentType);
      }
      if (filters.actionType) {
        totalQuery = totalQuery.eq('action_type', filters.actionType);
      }

      const { count: totalActions } = await totalQuery;

      // Total des actions SANS le filtre userId (pour "Actions totales")
      let totalGlobalQuery = supabase
        .from('user_actions')
        .select('*', { count: 'exact', head: true });

      if (filters.startDate) {
        totalGlobalQuery = totalGlobalQuery.gte('timestamp', filters.startDate);
      }
      if (filters.endDate) {
        totalGlobalQuery = totalGlobalQuery.lte('timestamp', filters.endDate);
      }
      // Ne pas appliquer le filtre userId pour avoir le total global
      if (filters.contentType) {
        totalGlobalQuery = totalGlobalQuery.eq('content_type', filters.contentType);
      }
      if (filters.actionType) {
        totalGlobalQuery = totalGlobalQuery.eq('action_type', filters.actionType);
      }

      const { count: totalActionsGlobal } = await totalGlobalQuery;

      // Utilisateurs uniques SANS le filtre userId (pour avoir le vrai nombre d'utilisateurs actifs)
      let usersQuery = supabase
        .from('user_actions')
        .select('user_id');

      if (filters.startDate) {
        usersQuery = usersQuery.gte('timestamp', filters.startDate);
      }
      if (filters.endDate) {
        usersQuery = usersQuery.lte('timestamp', filters.endDate);
      }
      // Ne pas appliquer le filtre userId ici pour avoir le vrai nombre d'utilisateurs actifs
      if (filters.contentType) {
        usersQuery = usersQuery.eq('content_type', filters.contentType);
      }
      if (filters.actionType) {
        usersQuery = usersQuery.eq('action_type', filters.actionType);
      }

      const { data: usersData } = await usersQuery;
      const uniqueUsers = new Set(usersData?.map(u => u.user_id)).size;

      // Récupérer le top contenu vu avec tous les filtres
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
      if (filters.userId) {
        topContentQuery = topContentQuery.eq('user_id', filters.userId);
      }
      if (filters.contentType) {
        topContentQuery = topContentQuery.eq('content_type', filters.contentType);
      }

      const { data: topContentData } = await topContentQuery;

      // Agréger par titre de contenu (pour éviter les doublons)
      const contentCounts = new Map();
      topContentData?.forEach(action => {
        // Exclure "Page Jeux cognitifs"
        if (action.content_title === 'Page Jeux cognitifs') {
          return;
        }
        
        const key = action.content_title;
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

      // Calculer les vraies sessions par utilisateur (grouper les connexions par intervalles)
      let sessionsQuery = supabase
        .from('user_login_sessions')
        .select('user_id, login_timestamp')
        .order('user_id, login_timestamp');

      if (filters.startDate) {
        sessionsQuery = sessionsQuery.gte('login_timestamp', filters.startDate);
      }
      if (filters.endDate) {
        sessionsQuery = sessionsQuery.lte('login_timestamp', filters.endDate);
      }
      // Ne pas filtrer par userId pour les sessions - on veut voir toutes les sessions même si un utilisateur est sélectionné
      // if (filters.userId) {
      //   sessionsQuery = sessionsQuery.eq('user_id', filters.userId);
      // }

      console.log('🔍 DEBUG: Fetching sessions with filters:', {
        startDate: filters.startDate,
        endDate: filters.endDate,
        userId: filters.userId
      });

      const { data: sessionsData, error: sessionsError } = await sessionsQuery;
      
      if (sessionsError) {
        console.error('❌ Error fetching sessions:', sessionsError);
      }
      
      console.log('📊 DEBUG: Raw sessions data:', {
        totalSessions: sessionsData?.length || 0,
        sampleData: sessionsData?.slice(0, 5),
        pinsanSessions: sessionsData?.filter(s => {
          // Look for Pinsan sessions by checking if user_id might correspond to Sabine Pinsan
          return s.user_id; // We'll log all and filter in console
        })
      });
      const sessionsByUser = new Map();

      // Grouper les connexions par utilisateur et calculer les vraies sessions
      if (sessionsData && sessionsData.length > 0) {
        // Grouper par utilisateur
        const userLogins = new Map();
        sessionsData.forEach(session => {
          const userId = session.user_id;
          if (!userLogins.has(userId)) {
            userLogins.set(userId, []);
          }
          userLogins.get(userId).push(new Date(session.login_timestamp));
        });

        // Pour chaque utilisateur, calculer le nombre de sessions
        userLogins.forEach((timestamps, userId) => {
          timestamps.sort((a, b) => a.getTime() - b.getTime());
          
          let sessionCount = 1; // Au moins une session
          for (let i = 1; i < timestamps.length; i++) {
            const timeDiff = timestamps[i].getTime() - timestamps[i - 1].getTime();
            // Si plus de 30 minutes d'écart, c'est une nouvelle session
            if (timeDiff > 30 * 60 * 1000) {
              sessionCount++;
            }
          }
          
          sessionsByUser.set(userId, sessionCount);
          
          // Debug log for each user's session calculation
          console.log(`👤 DEBUG: User ${userId} - ${timestamps.length} logins → ${sessionCount} sessions`);
        });
      }

      // Récupérer les noms d'utilisateurs pour les sessions
      const userIds = Array.from(sessionsByUser.keys());
      const sessionsWithNames = [];
      
      console.log('🔍 DEBUG: Session calculation complete, looking up profiles for users:', userIds);
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);
          
        if (profilesError) {
          console.error('❌ Error fetching profiles:', profilesError);
        }
        
        console.log('👥 DEBUG: Retrieved profiles:', profiles);
        
        userIds.forEach(userId => {
          const profile = profiles?.find(p => p.id === userId);
          const sessionCount = sessionsByUser.get(userId);
          
          console.log(`🔍 DEBUG: Processing user ${userId}: profile=${profile?.display_name}, sessions=${sessionCount}`);
          
          // Inclure tous les utilisateurs qui ont des sessions (même 1 seule)
          sessionsWithNames.push({
            user_id: userId,
            session_count: sessionCount,
            display_name: profile?.display_name || 'Utilisateur inconnu'
          });
        });
      }

      const finalSessions = sessionsWithNames.sort((a, b) => b.session_count - a.session_count);
      console.log('✅ DEBUG: Final sessions by user result:', finalSessions);

      return {
        totalActions: totalActions || 0,
        totalActionsGlobal: totalActionsGlobal || 0,
        uniqueUsers,
        topContent,
        actionsByType: [],
        dailyActivity: [],
        sessionsByUser: finalSessions
      };
    } catch (error) {
      console.error('Error in getUsageStats:', error);
      return {
        totalActions: 0,
        totalActionsGlobal: 0,
        uniqueUsers: 0,
        topContent: [],
        actionsByType: [],
        dailyActivity: [],
        sessionsByUser: []
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