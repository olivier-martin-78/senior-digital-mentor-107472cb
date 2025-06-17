
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-connection-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("Stripe");
    if (!stripeKey) throw new Error("Stripe secret key is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      await supabaseClient.from("user_subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: null,
        status: 'inactive',
        subscription_plan_id: null,
        current_period_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_plan: null,
        current_period_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    // Vérifier aussi les abonnements en période d'essai
    const trialSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 1,
    });

    const allActiveSubscriptions = [...subscriptions.data, ...trialSubscriptions.data];
    const hasActiveSub = allActiveSubscriptions.length > 0;
    let subscriptionPlan = null;
    let currentPeriodEnd = null;
    let status = 'inactive';

    if (hasActiveSub) {
      const subscription = allActiveSubscriptions[0];
      currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      status = subscription.status;
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: currentPeriodEnd,
        status: status
      });

      // Déterminer le plan d'abonnement depuis les métadonnées ou le prix
      const planIdFromMetadata = subscription.metadata?.plan_id;
      if (planIdFromMetadata) {
        const { data: plan } = await supabaseClient
          .from("subscription_plans")
          .select("*")
          .eq("id", planIdFromMetadata)
          .single();
        subscriptionPlan = plan?.name || null;
      }
      
      logStep("Determined subscription plan", { subscriptionPlan });
    } else {
      logStep("No active subscription found");
    }

    await supabaseClient.from("user_subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      status: status,
      subscription_plan_id: subscriptionPlan ? (await supabaseClient
        .from("subscription_plans")
        .select("id")
        .eq("name", subscriptionPlan)
        .single()).data?.id : null,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    logStep("Updated database with subscription info", { 
      subscribed: hasActiveSub, 
      subscriptionPlan,
      status 
    });
    
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_plan: subscriptionPlan,
      current_period_end: currentPeriodEnd,
      status: status
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
