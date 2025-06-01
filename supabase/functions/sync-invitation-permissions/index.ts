
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== DEBUT FONCTION sync-invitation-permissions ===');
  console.log('URL de la requête:', req.url);
  console.log('Méthode:', req.method);
  console.log('Headers:', JSON.stringify(Array.from(req.headers.entries())));
  
  if (req.method === 'OPTIONS') {
    console.log('Requête OPTIONS reçue, renvoi des headers CORS');
    return new Response(null, { headers: corsHeaders });
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

    // Vérification de l'autorisation - optionnelle, nous utilisons la service key
    console.log('Vérification de l\'autorisation...');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('Pas de header Authorization, continuons quand même avec service key');
    } else {
      console.log('Header Authorization présent:', authHeader.substring(0, 20) + '...');
    }

    // Tenter d'obtenir l'utilisateur actuel pour vérification admin
    let isAdmin = false;
    if (authHeader) {
      try {
        console.log('Tentative de récupération des infos utilisateur...');
        const { data: { user }, error: authError } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );

        if (authError) {
          console.log('Erreur lors de la récupération de l\'utilisateur:', authError);
        } else if (user) {
          console.log('Utilisateur authentifié:', user.id);
          
          // Vérifier le rôle admin
          console.log('Vérification du rôle admin...');
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

          if (roleError) {
            console.log('Erreur lors de la vérification du rôle:', roleError);
          } else if (roleData?.role === 'admin') {
            isAdmin = true;
            console.log('Utilisateur confirmé comme admin');
          } else {
            console.log('Utilisateur n\'est pas admin:', roleData?.role);
          }
        }
      } catch (authCheckError) {
        console.log('Erreur lors de la vérification auth (continuons):', authCheckError);
      }
    }

    console.log('Vérification de l\'existence de la fonction fix_existing_invitation_permissions...');
    
    // Tester d'abord si la fonction existe
    const { data: functionExists, error: functionCheckError } = await supabase
      .rpc('pg_function_exists', { function_name: 'fix_existing_invitation_permissions' });

    if (functionCheckError) {
      console.error('Erreur lors de la vérification de la fonction:', functionCheckError);
      throw new Error(`Erreur de vérification de fonction: ${functionCheckError.message}`);
    }

    console.log('Résultat de la vérification de fonction:', functionExists);

    if (!functionExists) {
      console.error('La fonction fix_existing_invitation_permissions n\'existe pas');
      throw new Error('La fonction fix_existing_invitation_permissions n\'a pas été créée en base de données');
    }

    console.log('Fonction fix_existing_invitation_permissions trouvée, exécution...');
    
    // Exécuter la fonction de rattrapage
    const { data: rpcData, error: syncError } = await supabase.rpc('fix_existing_invitation_permissions');

    if (syncError) {
      console.error('Erreur lors de la synchronisation:', syncError);
      throw new Error(`Erreur RPC: ${syncError.message} (Code: ${syncError.code})`);
    }

    console.log('Synchronisation des permissions terminée avec succès');
    console.log('Données retournées par RPC:', rpcData);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Permissions synchronisées avec succès',
      details: 'La fonction a été exécutée correctement'
    }), {
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
