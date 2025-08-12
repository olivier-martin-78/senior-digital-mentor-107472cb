
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from 'https://esm.sh/resend@2.0.0';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting to prevent abuse
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 3; // 3 requests per minute per IP

// Input sanitization function
function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .trim()
    .substring(0, 5000); // Limit length
}

console.log('Fonction send-contact-email initialisée avec sécurité renforcée');

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const userLimit = rateLimit.get(clientIP);
    
    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= RATE_LIMIT_MAX) {
          console.warn(`Rate limit exceeded for IP: ${clientIP}`);
          return new Response(
            JSON.stringify({ success: false, error: 'Trop de requêtes. Veuillez réessayer plus tard.' }),
            { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        userLimit.count++;
      } else {
        rateLimit.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimit.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }
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
    
    const { firstName, lastName, email, phone, message, thematiques, attachmentUrl } = parsedData;
    
    // Sanitize all inputs to prevent XSS
    const cleanFirstName = sanitizeInput(firstName);
    const cleanLastName = sanitizeInput(lastName);
    const cleanEmail = sanitizeInput(email);
    const cleanPhone = sanitizeInput(phone);
    const cleanMessage = sanitizeInput(message);
    const cleanThematiques = Array.isArray(thematiques) ? thematiques.map(t => sanitizeInput(t)).slice(0, 10) : [];
    
    console.log('Données extraites et nettoyées:', { 
      firstName: cleanFirstName ? '✓' : '✗', 
      lastName: cleanLastName ? '✓' : '✗', 
      email: cleanEmail ? '✓' : '✗',
      phone: cleanPhone ? '✓' : '✗',
      message: cleanMessage ? '✓' : '✗', 
      hasThematiques: cleanThematiques.length > 0 ? '✓' : '✗',
      hasAttachment: !!attachmentUrl 
    });
    
    // Validation des champs requis avec données nettoyées
    if (!cleanFirstName || !cleanLastName || !cleanEmail || !cleanMessage) {
      console.error('Champs manquants après nettoyage');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Tous les champs sont requis (prénom, nom, email, message)' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Validation stricte de l'email et longueur
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail) || cleanEmail.length > 254) {
      console.error('Email invalide ou trop long');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Adresse email invalide' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Validation des longueurs
    if (cleanFirstName.length > 50 || cleanLastName.length > 50 || cleanMessage.length > 5000) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Les données dépassent la longueur maximale autorisée' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    const fullName = `${cleanFirstName} ${cleanLastName}`;
    
    // Construire le contenu de l'email avec données nettoyées
    const emailSubject = `Nouvelle demande de contact de ${fullName}`;
    let emailContent = `
      <h1>Nouvelle demande de contact</h1>
      <p><strong>Prénom:</strong> ${cleanFirstName}</p>
      <p><strong>Nom:</strong> ${cleanLastName}</p>
      <p><strong>Email:</strong> ${cleanEmail}</p>
    `;
    
    // Ajouter le téléphone si fourni
    if (cleanPhone && cleanPhone.trim()) {
      emailContent += `<p><strong>Téléphone:</strong> ${cleanPhone}</p>`;
    }
    
    // Ajouter les thématiques si présentes
    if (cleanThematiques.length > 0) {
      emailContent += `
        <p><strong>Thématiques sélectionnées:</strong></p>
        <ul>
          ${cleanThematiques.map((theme: string) => `<li>${theme}</li>`).join('')}
        </ul>
      `;
    }
    
    emailContent += `
      <p><strong>Message:</strong></p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
        ${cleanMessage.replace(/\n/g, '<br/>')}
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
      reply_to: cleanEmail,
    });
    
    console.log('✓ Résultat notification:', notificationResult);
    
    // Envoyer un email de confirmation à l'expéditeur
    console.log('=== ENVOI EMAIL CONFIRMATION ===');
    console.log('Destinataire:', email);
    
    const confirmationResult = await resend.emails.send({
      from: 'contact@senior-digital-mentor.com',
      to: [cleanEmail],
      subject: 'Nous avons bien reçu votre message - Senior Digital Mentor',
      html: `
        <h1>Bonjour ${cleanFirstName},</h1>
        <p>Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.</p>
        <p>Nous reviendrons vers vous dans les plus brefs délais.</p>
        <br>
        <p>Cordialement,</p>
        <p><strong>L'équipe Senior Digital Mentor</strong></p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Senior Digital Mentor - Des activités digitales qui me font du bien et me sentir moins seul(e).
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
