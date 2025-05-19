
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from 'https://esm.sh/resend@2.0.0';

// Initialiser Resend avec la clé API
const resendApiKey = Deno.env.get('RESEND_API_KEY');
if (!resendApiKey) {
  throw new Error('RESEND_API_KEY is not defined');
}
const resend = new Resend(resendApiKey);

console.log('Fonction send-contact-email initialisée');

serve(async (req: Request) => {
  try {
    // Initialiser le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error('Supabase environment variables are not defined');
    }
    
    // Utiliser la clé de service pour accéder aux données sans restriction RLS
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log('Client Supabase initialisé');
    
    // Traiter la requête
    const { name, email, message, attachmentUrl } = await req.json();
    console.log('Données reçues:', { name, email, message, attachmentUrl: !!attachmentUrl });
    
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Nom, email et message sont requis' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Récupérer les administrateurs qui ont activé l'option de recevoir les demandes de contact
    const { data: adminProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('receive_contacts', true);
    
    if (fetchError) {
      console.error('Erreur lors de la récupération des administrateurs:', fetchError);
      throw fetchError;
    }
    
    if (!adminProfiles || adminProfiles.length === 0) {
      console.warn('Aucun administrateur n\'a activé la réception des demandes de contact');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucun destinataire trouvé pour cette demande' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Envoi d'email à ${adminProfiles.length} administrateur(s)`);
    
    // Construire le contenu de l'email
    const emailSubject = `Nouvelle demande de contact de ${name}`;
    const emailContent = `
      <h1>Nouvelle demande de contact</h1>
      <p><strong>Nom:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br/>')}</p>
      ${attachmentUrl ? `<p><strong>Pièce jointe:</strong> <a href="${attachmentUrl}">Voir la pièce jointe</a></p>` : ''}
    `;
    
    // Envoyer l'email à tous les administrateurs concernés
    const emailPromises = adminProfiles.map(admin => {
      return resend.emails.send({
        from: 'contact@tranches-de-vie.com',
        to: admin.email,
        subject: emailSubject,
        html: emailContent,
        reply_to: email,
      });
    });
    
    const results = await Promise.all(emailPromises);
    console.log('Résultats des envois d\'emails:', results);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email envoyé à ${adminProfiles.length} administrateur(s)` 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erreur dans la fonction send-contact-email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Une erreur est survenue lors de l\'envoi de l\'email' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
