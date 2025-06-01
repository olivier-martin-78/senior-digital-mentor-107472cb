
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-connection-type",
};

serve(async (req: Request) => {
  console.log(`send-password-reset: Request method: ${req.method}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read request body as JSON directly
    const requestData = await req.json();
    console.log(`send-password-reset: Request data received:`, requestData);

    const { email } = requestData;
    console.log(`send-password-reset: Processing request for email: ${email}`);

    if (!email || typeof email !== 'string' || email.trim() === '') {
      console.error("send-password-reset: Email is required");
      return new Response(
        JSON.stringify({ 
          error: "L'email est requis et doit être valide" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Use the correct application domain for redirect URL
    const redirectTo = "https://senior-digital-mentor.com/auth?reset=true";
    console.log(`send-password-reset: Using redirect URL: ${redirectTo}`);

    // Send password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectTo,
    });

    if (error) {
      console.error("send-password-reset: Supabase error:", error);
      return new Response(
        JSON.stringify({ 
          error: error.message || "Erreur lors de l'envoi de l'email de réinitialisation" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("send-password-reset: Password reset email sent successfully for:", email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de réinitialisation envoyé avec succès" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("send-password-reset: Error in function:", error);
    
    // Handle JSON parsing errors specifically
    if (error.name === 'SyntaxError' || error.message?.includes('JSON')) {
      return new Response(
        JSON.stringify({ 
          error: "Format de requête invalide. Veuillez envoyer du JSON valide." 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Une erreur s'est produite lors de l'envoi de l'email" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
