
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
    let requestData;
    
    // Try to read the request body using different methods
    try {
      // First try to read as JSON directly
      requestData = await req.json();
      console.log(`send-password-reset: Direct JSON parse successful:`, requestData);
    } catch (jsonError) {
      console.log(`send-password-reset: Direct JSON parse failed, trying text:`, jsonError);
      
      // If that fails, try reading as text first
      try {
        const text = await req.text();
        console.log(`send-password-reset: Request body text: "${text}"`);
        
        if (!text || text.trim() === "") {
          console.error("send-password-reset: Request body is empty");
          throw new Error("Le corps de la requête est vide");
        }
        
        requestData = JSON.parse(text);
        console.log(`send-password-reset: Text then JSON parse successful:`, requestData);
      } catch (parseError) {
        console.error("send-password-reset: Error reading/parsing request:", parseError);
        throw new Error("Erreur lors de la lecture de la requête");
      }
    }

    const { email } = requestData;
    console.log(`send-password-reset: Processing request for email: ${email}`);

    if (!email) {
      console.error("send-password-reset: Email is required");
      throw new Error("L'email est requis");
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
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });

    if (error) {
      console.error("send-password-reset: Supabase error:", error);
      throw error;
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
    return new Response(
      JSON.stringify({ 
        error: error.message || "Une erreur s'est produite lors de l'envoi de l'email" 
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
