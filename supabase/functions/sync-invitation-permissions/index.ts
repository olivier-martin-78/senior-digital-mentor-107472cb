
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
    
    if (!supabaseServiceKey || !supabaseUrl) {
      throw new Error('Configuration Supabase manquante');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Vérification de l\'autorisation...');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token d\'autorisation manquant');
    }

    // Vérifier que l'utilisateur est admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier le rôle admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Accès refusé - rôle admin requis');
    }

    console.log('Exécution de la fonction de rattrapage des permissions...');
    
    // Exécuter la fonction de rattrapage
    const { error: syncError } = await supabase.rpc('fix_existing_invitation_permissions');

    if (syncError) {
      console.error('Erreur lors de la synchronisation:', syncError);
      throw syncError;
    }

    console.log('Synchronisation des permissions terminée avec succès');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Permissions synchronisées avec succès' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== ERREUR COMPLETE ===');
    console.error('Message:', error.message);
    console.error('Erreur complète:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Erreur lors de la synchronisation des permissions',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
