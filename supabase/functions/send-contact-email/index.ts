
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Initialize Resend with API key from environment variables
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Define CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define interface for contact email request
interface ContactEmailRequest {
  name: string;
  email: string;
  message: string;
  attachmentUrl?: string | null;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body as JSON
    const { name, email, message, attachmentUrl } = await req.json() as ContactEmailRequest;

    if (!name || !email || !message) {
      throw new Error("Missing required fields");
    }

    console.log("Sending contact email from:", email);

    // Get admin emails that have opted to receive contact requests
    const { data: adminUsers, error: usersError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (usersError) {
      throw usersError;
    }

    // Early return if no admin users found
    if (!adminUsers || adminUsers.length === 0) {
      console.error("No admin users found to send the email to");
      throw new Error("No admin recipients configured");
    }

    // Get admin profiles with their email addresses
    const { data: adminProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('email, receive_contacts')
      .in('id', adminUsers.map(user => user.user_id))
      .eq('receive_contacts', true);

    if (profilesError) {
      throw profilesError;
    }

    // Return error if no admin user has opted to receive contacts
    if (!adminProfiles || adminProfiles.length === 0) {
      console.error("No admin users have opted to receive contact emails");
      throw new Error("No admin recipients configured");
    }

    // Extract admin emails
    const adminEmails = adminProfiles.map(profile => profile.email);

    // Build email HTML content
    const htmlContent = `
      <h1>Nouveau message de contact</h1>
      <p><strong>De:</strong> ${name} (${email})</p>
      <h2>Message:</h2>
      <p>${message.replace(/\n/g, '<br />')}</p>
      ${attachmentUrl ? `<p><strong>Pièce jointe:</strong> <a href="${attachmentUrl}">Voir la pièce jointe</a></p>` : ''}
      <hr />
      <p><small>Cette demande a été envoyée depuis le formulaire de contact de Tranches de Vie.</small></p>
    `;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Tranches de Vie <onboarding@resend.dev>",
      to: adminEmails,
      reply_to: email,
      subject: "Nouvelle demande de contact: " + name,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Return success response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    // Log and return error
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
