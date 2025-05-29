
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from 'https://esm.sh/resend@2.0.0';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('Fonction send-contact-email initialisée');

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('Début du traitement de la requête');
    
    // Initialiser Resend avec la clé API
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not defined');
      throw new Error('RESEND_API_KEY is not defined');
    }
    const resend = new Resend(resendApiKey);
    
    // Traiter la requête
    const { name, email, message, attachmentUrl } = await req.json();
    console.log('Données reçues:', { name, email, message, attachmentUrl: !!attachmentUrl });
    
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Nom, email et message sont requis' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Construire le contenu de l'email
    const emailSubject = `Nouvelle demande de contact de ${name}`;
    let emailContent = `
      <h1>Nouvelle demande de contact</h1>
      <p><strong>Nom:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br/>')}</p>
    `;
    
    // Ajouter le lien de la pièce jointe si elle existe
    if (attachmentUrl) {
      emailContent += `<p><strong>Pièce jointe:</strong> <a href="${attachmentUrl}">Voir la pièce jointe</a></p>`;
    }
    
    console.log('Envoi de l\'email à contact@senior-digital-mentor.com');
    
    // Envoyer l'email à l'adresse fixe
    const notificationResult = await resend.emails.send({
      from: 'Tranches de vie <contact@tranches-de-vie.com>',
      to: 'contact@senior-digital-mentor.com',
      subject: emailSubject,
      html: emailContent,
      reply_to: email,
    });
    
    console.log('Résultat notification:', notificationResult);
    
    // Envoyer un email de confirmation à l'expéditeur
    const confirmationResult = await resend.emails.send({
      from: 'Tranches de vie <contact@tranches-de-vie.com>',
      to: email,
      subject: 'Nous avons bien reçu votre message',
      html: `
        <h1>Bonjour ${name},</h1>
        <p>Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.</p>
        <p>Nous reviendrons vers vous dans les plus brefs délais.</p>
        <p>Cordialement,</p>
        <p>L'équipe Tranches de vie</p>
      `,
    });
    
    console.log('Résultat confirmation:', confirmationResult);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email envoyé avec succès et confirmation envoyée',
        notificationResult,
        confirmationResult
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Erreur dans la fonction send-contact-email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Une erreur est survenue lors de l\'envoi de l\'email' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
