
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-connection-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  console.log('=== DEBUT FONCTION sync-invitation-permissions ===');
  console.log('URL de la requête:', req.url);
  console.log('Méthode:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('Requête OPTIONS reçue, renvoi des headers CORS');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Vérifier le body de la requête
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Body de la requête:', JSON.stringify(requestBody));
    } catch (parseError) {
      console.log('Pas de body JSON ou erreur de parsing:', parseError.message);
      requestBody = {};
    }

    // Créer un client Supabase avec la clé service
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    console.log('Variables d\'environnement:', {
      hasServiceKey: !!supabaseServiceKey,
      hasUrl: !!supabaseUrl,
      urlLength: supabaseUrl?.length || 0
    });
    
    if (!supabaseServiceKey || !supabaseUrl) {
      throw new Error('Configuration Supabase manquante');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Client Supabase créé avec succès');

    // Vérifier si on cible un utilisateur spécifique
    const targetUserId = requestBody.targetUserId;
    if (targetUserId) {
      console.log('🎯 Synchronisation ciblée pour utilisateur:', targetUserId);
      
      // Récupérer toutes les invitations pour cet utilisateur
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', targetUserId)
        .single();
      
      if (!userProfile) {
        throw new Error('Utilisateur introuvable');
      }
      
      const { data: invitations, error: invError } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', userProfile.email)
        .not('used_at', 'is', null);
      
      console.log('🎯 Invitations trouvées pour', userProfile.email, ':', invitations?.length || 0);
      
      if (invitations && invitations.length > 0) {
        let permissionsCreated = 0;
        
        for (const invitation of invitations) {
          console.log('🎯 Traitement invitation:', invitation.id, 'de', invitation.invited_by);
          
          // Créer les permissions d'albums si blog_access = true
          if (invitation.blog_access) {
            console.log('📚 Création permissions albums pour invitation', invitation.id);
            const { data: albums } = await supabase
              .from('blog_albums')
              .select('id')
              .eq('author_id', invitation.invited_by);
            
            console.log('📚 Albums trouvés:', albums?.length || 0);
            
            if (albums) {
              for (const album of albums) {
                const { error: albumPermError } = await supabase
                  .from('album_permissions')
                  .insert({
                    album_id: album.id,
                    user_id: targetUserId
                  });
                
                if (!albumPermError) {
                  permissionsCreated++;
                  console.log('✅ Permission album créée:', album.id);
                } else if (albumPermError.code !== '23505') { // Ignorer les doublons
                  console.error('❌ Erreur création permission album:', albumPermError);
                }
              }
            }
          }
          
          // Créer les permissions d'histoires de vie si life_story_access = true
          if (invitation.life_story_access) {
            console.log('📖 Création permissions histoires de vie pour invitation', invitation.id);
            const { error: lifeStoryPermError } = await supabase
              .from('life_story_permissions')
              .insert({
                story_owner_id: invitation.invited_by,
                permitted_user_id: targetUserId,
                permission_level: 'read',
                granted_by: invitation.invited_by
              });
            
            if (!lifeStoryPermError) {
              permissionsCreated++;
              console.log('✅ Permission histoire de vie créée');
            } else if (lifeStoryPermError.code !== '23505') { // Ignorer les doublons
              console.error('❌ Erreur création permission histoire de vie:', lifeStoryPermError);
            }
          }
          
          // Créer les permissions de journal si diary_access = true
          if (invitation.diary_access) {
            console.log('📔 Création permissions journal pour invitation', invitation.id);
            const { error: diaryPermError } = await supabase
              .from('diary_permissions')
              .insert({
                diary_owner_id: invitation.invited_by,
                permitted_user_id: targetUserId,
                permission_level: 'read',
                granted_by: invitation.invited_by
              });
            
            if (!diaryPermError) {
              permissionsCreated++;
              console.log('✅ Permission journal créée');
            } else if (diaryPermError.code !== '23505') { // Ignorer les doublons
              console.error('❌ Erreur création permission journal:', diaryPermError);
            }
          }
        }
        
        console.log('🎯 Synchronisation terminée. Permissions créées:', permissionsCreated);
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: `Permissions synchronisées pour l'utilisateur ${targetUserId}`,
          details: `${permissionsCreated} nouvelles permissions créées à partir de ${invitations?.length || 0} invitations`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ 
          success: true, 
          message: `Aucune invitation trouvée pour l'utilisateur ${targetUserId}`,
          details: `Email: ${userProfile.email}`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log('🔧 Synchronisation globale - Exécution de la fonction fix_existing_invitation_permissions...');
    
    // Récupérer toutes les invitations utilisées avec groupe
    const { data: usedInvitations, error: invitationsError } = await supabase
      .from('invitations')
      .select('*')
      .not('used_at', 'is', null)
      .not('group_id', 'is', null);
    
    if (invitationsError) {
      console.error('❌ Erreur récupération invitations:', invitationsError);
      throw invitationsError;
    }
    
    console.log('📋 Invitations utilisées trouvées:', usedInvitations?.length || 0);
    
    let totalPermissionsCreated = 0;
    
    if (usedInvitations && usedInvitations.length > 0) {
      for (const invitation of usedInvitations) {
        console.log('🔄 Traitement invitation globale:', invitation.id);
        
        // Trouver l'utilisateur associé à cette invitation via le groupe
        const { data: groupMember } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', invitation.group_id)
          .eq('role', 'guest')
          .single();
        
        if (!groupMember) {
          console.log('⚠️ Aucun membre de groupe trouvé pour invitation:', invitation.id);
          continue;
        }
        
        const userId = groupMember.user_id;
        console.log('👤 Utilisateur trouvé:', userId);
        
        // Créer les permissions comme dans la version ciblée
        if (invitation.blog_access) {
          const { data: albums } = await supabase
            .from('blog_albums')
            .select('id')
            .eq('author_id', invitation.invited_by);
          
          if (albums) {
            for (const album of albums) {
              const { error: albumPermError } = await supabase
                .from('album_permissions')
                .insert({
                  album_id: album.id,
                  user_id: userId
                });
              
              if (!albumPermError) {
                totalPermissionsCreated++;
              } else if (albumPermError.code !== '23505') {
                console.error('❌ Erreur création permission album globale:', albumPermError);
              }
            }
          }
        }
        
        if (invitation.life_story_access) {
          const { error: lifeStoryPermError } = await supabase
            .from('life_story_permissions')
            .insert({
              story_owner_id: invitation.invited_by,
              permitted_user_id: userId,
              permission_level: 'read',
              granted_by: invitation.invited_by
            });
          
          if (!lifeStoryPermError) {
            totalPermissionsCreated++;
          } else if (lifeStoryPermError.code !== '23505') {
            console.error('❌ Erreur création permission histoire globale:', lifeStoryPermError);
          }
        }
        
        if (invitation.diary_access) {
          const { error: diaryPermError } = await supabase
            .from('diary_permissions')
            .insert({
              diary_owner_id: invitation.invited_by,
              permitted_user_id: userId,
              permission_level: 'read',
              granted_by: invitation.invited_by
            });
          
          if (!diaryPermError) {
            totalPermissionsCreated++;
          } else if (diaryPermError.code !== '23505') {
            console.error('❌ Erreur création permission journal globale:', diaryPermError);
          }
        }
      }
    }

    console.log('🔧 Synchronisation globale terminée. Total permissions créées:', totalPermissionsCreated);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Permissions synchronisées avec succès',
      details: `${totalPermissionsCreated} nouvelles permissions créées à partir de ${usedInvitations?.length || 0} invitations`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== ERREUR COMPLETE ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Erreur complète:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Erreur lors de la synchronisation des permissions',
      details: error.toString(),
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    console.log('=== FIN FONCTION sync-invitation-permissions ===');
  }
});
