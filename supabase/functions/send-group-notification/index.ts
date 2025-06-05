
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-connection-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface NotificationRequest {
  contentType: 'blog' | 'diary' | 'wish';
  contentId: string;
  title: string;
  authorId: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🔍 send-group-notification - Début requête:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method === 'OPTIONS') {
    console.log('🔍 send-group-notification - Traitement OPTIONS');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    console.log('🔍 send-group-notification - Auth header:', authHeader ? 'présent' : 'absent');
    
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('🔍 send-group-notification - Erreur auth:', authError);
      throw new Error('Invalid authentication');
    }

    console.log('🔍 send-group-notification - Utilisateur authentifié:', user.id);

    // Parser le body JSON
    let requestData: NotificationRequest;
    try {
      requestData = await req.json();
      console.log('🔍 send-group-notification - Données reçues:', requestData);
      
      if (!requestData.contentType || !requestData.contentId || !requestData.title || !requestData.authorId) {
        throw new Error('Missing required fields in request body');
      }
      
    } catch (parseError) {
      console.error('🔍 send-group-notification - Erreur parsing:', parseError);
      throw new Error(`Invalid request body: ${parseError.message}`);
    }

    const { contentType, contentId, title, authorId } = requestData;

    console.log('🔍 send-group-notification - Données validées:', { contentType, contentId, title, authorId });

    // Récupérer les informations de l'auteur
    const { data: authorProfile, error: authorError } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', authorId)
      .single();

    if (authorError || !authorProfile) {
      console.error('🔍 send-group-notification - Erreur profil auteur:', authorError);
      throw new Error('Author profile not found');
    }

    console.log('🔍 send-group-notification - Profil auteur trouvé:', authorProfile.display_name);

    // Récupérer les groupes de l'auteur
    const { data: authorGroups, error: authorGroupsError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', authorId);

    if (authorGroupsError) {
      console.error('🔍 send-group-notification - Erreur groupes auteur:', authorGroupsError);
      throw new Error('Failed to fetch author groups');
    }

    console.log('🔍 send-group-notification - Groupes auteur trouvés:', authorGroups?.length || 0);

    if (!authorGroups || authorGroups.length === 0) {
      console.log('🔍 send-group-notification - Aucun groupe pour l\'auteur');
      return new Response(
        JSON.stringify({ message: 'Author is not in any group' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Extraire les IDs des groupes
    const groupIds = authorGroups.map(g => g.group_id);

    // Récupérer les membres du groupe de l'auteur (excluant l'auteur lui-même)
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id, group_id')
      .in('group_id', groupIds)
      .neq('user_id', authorId);

    if (membersError) {
      console.error('🔍 send-group-notification - Erreur membres groupe:', membersError);
      throw new Error('Failed to fetch group members');
    }

    console.log('🔍 send-group-notification - Membres groupe trouvés:', groupMembers?.length || 0);

    // AMÉLIORATION: Récupérer aussi les créateurs des groupes (s'ils ne sont pas l'auteur)
    const { data: groupCreators, error: creatorsError } = await supabase
      .from('invitation_groups')
      .select('created_by')
      .in('id', groupIds)
      .neq('created_by', authorId);

    if (creatorsError) {
      console.error('🔍 send-group-notification - Erreur créateurs groupes:', creatorsError);
    } else {
      console.log('🔍 send-group-notification - Créateurs groupes trouvés:', groupCreators?.length || 0);
    }

    // Combiner les IDs des membres et des créateurs
    let allUserIds: string[] = [];
    
    if (groupMembers) {
      allUserIds.push(...groupMembers.map(m => m.user_id));
    }
    
    if (groupCreators) {
      groupCreators.forEach(creator => {
        if (!allUserIds.includes(creator.created_by)) {
          allUserIds.push(creator.created_by);
        }
      });
    }

    // Supprimer les doublons
    allUserIds = [...new Set(allUserIds)];

    console.log('🔍 send-group-notification - Total utilisateurs à notifier:', allUserIds.length);

    if (allUserIds.length === 0) {
      console.log('🔍 send-group-notification - Aucun membre à notifier');
      return new Response(
        JSON.stringify({ message: 'No group members to notify' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Récupérer les profils des utilisateurs à notifier
    const { data: memberProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .in('id', allUserIds);

    if (profilesError) {
      console.error('🔍 send-group-notification - Erreur profils membres:', profilesError);
      throw new Error('Failed to fetch member profiles');
    }

    console.log('🔍 send-group-notification - Profils membres trouvés:', memberProfiles?.length || 0);

    // Construire l'URL du contenu
    const baseUrl = 'https://a2978196-c5c0-456b-9958-c4dc20b52bea.lovableproject.com';
    const contentUrl = contentType === 'blog' ? `${baseUrl}/blog/${contentId}` :
                      contentType === 'diary' ? `${baseUrl}/diary/${contentId}` :
                      `${baseUrl}/wishes/${contentId}`;

    console.log('🔍 send-group-notification - URL contenu:', contentUrl);

    // Vérifier la configuration Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log('🔍 send-group-notification - Clé API Resend:', resendApiKey ? 'configurée' : 'manquante');
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Préparer et envoyer les emails
    const emailPromises = memberProfiles?.map(async (memberProfile: any) => {
      if (!memberProfile?.email) {
        console.log(`⚠️ send-group-notification - Email manquant pour ${memberProfile?.display_name || 'utilisateur inconnu'}`);
        return;
      }

      const contentTypeLabel = contentType === 'blog' ? 'article de blog' :
                              contentType === 'diary' ? 'entrée de journal' : 'souhait';

      try {
        console.log(`🔍 send-group-notification - Envoi email à ${memberProfile.email}`);
        
        const emailResponse = await resend.emails.send({
          from: 'Senior Digital Mentor <contact@senior-digital-mentor.com>',
          to: [memberProfile.email],
          subject: `Nouvelle publication de ${authorProfile.display_name || authorProfile.email}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2D5A27;">Nouvelle publication sur Senior Digital Mentor</h2>
              
              <p>Bonjour ${memberProfile.display_name || memberProfile.email},</p>
              
              <p><strong>${authorProfile.display_name || authorProfile.email}</strong> a publié un nouveau ${contentTypeLabel} :</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0; color: #2D5A27;">${title}</h3>
              </div>
              
              <p>
                <a href="${contentUrl}" 
                   style="background-color: #2D5A27; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Lire maintenant
                </a>
              </p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              
              <p style="font-size: 12px; color: #666;">
                Vous recevez cet email car vous faites partie du groupe de ${authorProfile.display_name || authorProfile.email}.
                <br>
                Senior Digital Mentor - Accompagnement numérique pour les seniors
              </p>
            </div>
          `,
        });
        
        console.log(`📧 send-group-notification - Réponse Resend pour ${memberProfile.email}:`, {
          id: emailResponse.data?.id,
          error: emailResponse.error
        });
        
        if (emailResponse.error) {
          console.error(`❌ send-group-notification - Erreur Resend pour ${memberProfile.email}:`, emailResponse.error);
          throw emailResponse.error;
        }
        
        console.log(`✅ send-group-notification - Email envoyé avec succès à ${memberProfile.email}, ID: ${emailResponse.data?.id}`);
      } catch (emailError) {
        console.error(`❌ send-group-notification - Échec envoi email à ${memberProfile.email}:`, {
          error: emailError,
          message: emailError?.message,
          stack: emailError?.stack
        });
        // Ne pas faire échouer toute la fonction pour un email
      }
    }) || [];

    await Promise.allSettled(emailPromises);

    console.log('✅ send-group-notification - Tous les emails traités');

    return new Response(
      JSON.stringify({ message: 'Group notifications sent successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ send-group-notification - Erreur:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
