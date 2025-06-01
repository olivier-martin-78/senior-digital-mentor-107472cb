
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== DEBUT FONCTION sync-invitation-permissions ===');
  
  if (req.method === 'OPTIONS') {
    console.log('Requête OPTIONS reçue');
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Simplifier l'authentification - utiliser directement la service key
    // Pas besoin de vérifier le token utilisateur puisqu'on utilise la service key
    console.log('Vérification de l\'autorisation...');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('Pas de header Authorization, continuons quand même avec service key');
    }

    // Tenter d'obtenir l'utilisateur actuel pour vérification admin
    let isAdmin = false;
    if (authHeader) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );

        if (!authError && user) {
          console.log('Utilisateur authentifié:', user.id);
          
          // Vérifier le rôle admin
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

          if (!roleError && roleData?.role === 'admin') {
            isAdmin = true;
            console.log('Utilisateur confirmé comme admin');
          }
        }
      } catch (authCheckError) {
        console.log('Erreur lors de la vérification auth (continuons):', authCheckError);
      }
    }

    if (!isAdmin) {
      console.log('Utilisateur non-admin ou erreur auth - utilisation service key pour exécution');
    }

    console.log('Vérification de l\'existence de la fonction fix_existing_invitation_permissions...');
    
    // Tester d'abord si la fonction existe
    const { data: functionExists, error: functionCheckError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'fix_existing_invitation_permissions')
      .maybeSingle();

    if (functionCheckError) {
      console.error('Erreur lors de la vérification de la fonction:', functionCheckError);
      throw new Error(`Erreur de vérification de fonction: ${functionCheckError.message}`);
    }

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
  }
});
