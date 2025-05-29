
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
    console.log('=== DÉBUT TRAITEMENT REQUÊTE ===');
    console.log('Method:', req.method);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    
    // Vérifier la clé API Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('ERREUR CRITIQUE: RESEND_API_KEY non définie');
      throw new Error('Configuration manquante: RESEND_API_KEY');
    }
    console.log('✓ RESEND_API_KEY configurée');
    
    const resend = new Resend(resendApiKey);
    
    // Traiter les données de la requête
    const requestBody = await req.text();
    console.log('Corps de la requête brut:', requestBody);
    
    let parsedData;
    try {
      parsedData = JSON.parse(requestBody);
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      throw new Error('Données JSON invalides');
    }
    
    const { name, email, message, attachmentUrl } = parsedData;
    console.log('Données extraites:', { 
      name: name ? '✓' : '✗', 
      email: email ? '✓' : '✗', 
      message: message ? '✓' : '✗', 
      hasAttachment: !!attachmentUrl 
    });
    
    // Validation des champs requis
    if (!name || !email || !message) {
      console.error('Champs manquants:', { name: !!name, email: !!email, message: !!message });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Tous les champs sont requis (nom, email, message)' 
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
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
        ${message.replace(/\n/g, '<br/>')}
      </div>
    `;
    
    // Ajouter le lien de la pièce jointe si elle existe
    if (attachmentUrl) {
      emailContent += `
        <p><strong>Pièce jointe:</strong> <a href="${attachmentUrl}" target="_blank">Voir la pièce jointe</a></p>
      `;
    }
    
    emailContent += `
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        Email envoyé depuis le formulaire de contact de Senior Digital Mentor
      </p>
    `;
    
    console.log('=== ENVOI EMAIL NOTIFICATION ===');
    console.log('Destinataire: contact@senior-digital-mentor.com');
    
    // Envoyer l'email de notification à votre adresse professionnelle
    const notificationResult = await resend.emails.send({
      from: 'contact@senior-digital-mentor.com',
      to: 'contact@senior-digital-mentor.com',
      subject: emailSubject,
      html: emailContent,
      reply_to: email,
    });
    
    console.log('✓ Résultat notification:', notificationResult);
    
    // Envoyer un email de confirmation à l'expéditeur
    console.log('=== ENVOI EMAIL CONFIRMATION ===');
    console.log('Destinataire:', email);
    
    const confirmationResult = await resend.emails.send({
      from: 'contact@senior-digital-mentor.com',
      to: email,
      subject: 'Nous avons bien reçu votre message - Senior Digital Mentor',
      html: `
        <h1>Bonjour ${name},</h1>
        <p>Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.</p>
        <p>Nous reviendrons vers vous dans les plus brefs délais.</p>
        <br>
        <p>Cordialement,</p>
        <p><strong>L'équipe Senior Digital Mentor</strong></p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Senior Digital Mentor - Le digital à mon rythme
        </p>
      `,
    });
    
    console.log('✓ Résultat confirmation:', confirmationResult);
    console.log('=== ENVOI TERMINÉ AVEC SUCCÈS ===');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Emails envoyés avec succès',
        notification: notificationResult,
        confirmation: confirmationResult
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('=== ERREUR DANS LA FONCTION ===');
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erreur interne du serveur',
        details: error.constructor.name
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
