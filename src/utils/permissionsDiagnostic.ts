
import { supabase } from '@/integrations/supabase/client';

export const diagnosePer missions = async (userEmail: string) => {
  console.log('🔍 DIAGNOSTIC PERMISSIONS pour:', userEmail);
  
  try {
    // 1. Récupérer les infos de l'utilisateur
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single();
    
    if (!userProfile) {
      console.log('❌ Utilisateur introuvable');
      return;
    }
    
    console.log('👤 Profil utilisateur:', userProfile);
    
    // 2. Vérifier l'appartenance aux groupes
    const { data: groupMemberships } = await supabase
      .from('group_members')
      .select(`
        *,
        invitation_groups(*)
      `)
      .eq('user_id', userProfile.id);
    
    console.log('👥 Appartenances aux groupes:', groupMemberships);
    
    // 3. Vérifier les invitations
    const { data: invitations } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', userEmail);
    
    console.log('💌 Invitations:', invitations);
    
    // 4. Vérifier les albums accessibles
    const { data: albums } = await supabase
      .from('blog_albums')
      .select(`
        *,
        profiles(email, display_name)
      `);
    
    console.log('📚 Albums trouvés via RLS:', albums);
    
    // 5. Vérifier les posts accessibles
    const { data: posts } = await supabase
      .from('blog_posts')
      .select(`
        *,
        profiles(email, display_name)
      `);
    
    console.log('📝 Posts trouvés via RLS:', posts);
    
    // 6. Vérifier les entrées de journal accessibles
    const { data: diaryEntries } = await supabase
      .from('diary_entries')
      .select('*');
    
    console.log('📔 Entrées de journal trouvées via RLS:', diaryEntries);
    
    return {
      userProfile,
      groupMemberships,
      invitations,
      albums,
      posts,
      diaryEntries
    };
    
  } catch (error) {
    console.error('💥 Erreur lors du diagnostic:', error);
  }
};

export const syncUserPermissions = async (userEmail: string) => {
  console.log('🔧 SYNCHRONISATION PERMISSIONS pour:', userEmail);
  
  try {
    // Récupérer l'ID utilisateur
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();
    
    if (!userProfile) {
      console.log('❌ Utilisateur introuvable');
      return;
    }
    
    // Appeler la fonction Edge de synchronisation ciblée
    const { data, error } = await supabase.functions.invoke('sync-invitation-permissions', {
      body: { targetUserId: userProfile.id }
    });
    
    if (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      return;
    }
    
    console.log('✅ Synchronisation réussie:', data);
    return data;
    
  } catch (error) {
    console.error('💥 Erreur lors de la synchronisation:', error);
  }
};
