
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { client_id, message_id } = await req.json()

    if (!client_id || !message_id) {
      return new Response(
        JSON.stringify({ error: 'Client ID and Message ID are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Récupérer les informations du message
    const { data: messageData, error: messageError } = await supabaseClient
      .from('caregiver_messages')
      .select(`
        *,
        profiles:author_id (
          display_name,
          email
        ),
        clients:client_id (
          first_name,
          last_name
        )
      `)
      .eq('id', message_id)
      .single()

    if (messageError) {
      console.error('Error fetching message:', messageError)
      return new Response(
        JSON.stringify({ error: 'Message not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Récupérer tous les participants (aidants + professionnels)
    const participants = new Set<string>()

    // Ajouter les proches aidants
    const { data: caregivers } = await supabaseClient
      .from('caregivers')
      .select('email')
      .eq('client_id', client_id)

    caregivers?.forEach(caregiver => {
      if (caregiver.email) {
        participants.add(caregiver.email)
      }
    })

    // Ajouter les professionnels ayant des RDV avec ce client
    const { data: appointments } = await supabaseClient
      .from('appointments')
      .select(`
        professional_id,
        profiles:professional_id (
          email
        )
      `)
      .eq('client_id', client_id)

    appointments?.forEach(appointment => {
      if (appointment.profiles?.email) {
        participants.add(appointment.profiles.email)
      }
    })

    // Exclure l'auteur du message des notifications
    participants.delete(messageData.profiles.email)

    if (participants.size === 0) {
      return new Response(
        JSON.stringify({ message: 'No participants to notify' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Envoyer les emails de notification
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const emailPromises = Array.from(participants).map(async (email) => {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Nouveau message de coordination</h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Patient :</strong> ${messageData.clients?.first_name} ${messageData.clients?.last_name}</p>
            <p><strong>De :</strong> ${messageData.profiles?.display_name || messageData.profiles?.email}</p>
            <p><strong>Date :</strong> ${new Date(messageData.created_at).toLocaleDateString('fr-FR')}</p>
          </div>

          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="margin-top: 0;">Message :</h3>
            <p style="white-space: pre-wrap;">${messageData.message}</p>
          </div>

          <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
            Connectez-vous à votre espace aidants pour répondre et consulter tous les échanges.
          </p>
        </div>
      `

      return fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SeniorDigital <notifications@seniordigital.fr>',
          to: [email],
          subject: `Nouveau message de coordination - ${messageData.clients?.first_name} ${messageData.clients?.last_name}`,
          html: emailHtml,
        }),
      })
    })

    await Promise.all(emailPromises)

    return new Response(
      JSON.stringify({ 
        message: 'Notifications sent successfully',
        participants_count: participants.size 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-caregiver-notification:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
