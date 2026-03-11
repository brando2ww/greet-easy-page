import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { action } = body;

    // Webhook doesn't need auth
    if (action === "webhook") {
      return await handleWebhook(req, body, supabaseAdmin, stripeKey);
    }

    // All other actions require auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let result;

    switch (action) {
      case "create-checkout":
        result = await createCheckout(body, user, stripe, supabaseAdmin, req);
        break;
      case "request-withdrawal":
        result = await requestWithdrawal(body, user, supabaseAdmin);
        break;
      case "list-transactions":
        result = await listTransactions(user, supabaseAdmin);
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[wallet-api] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function createCheckout(
  body: any,
  user: any,
  stripe: Stripe,
  supabaseAdmin: any,
  req: Request
) {
  const { amount } = body;
  const amountInCents = Math.round(amount * 100);

  if (!amount || amount < 5 || amount > 1000) {
    throw new Error("Amount must be between R$ 5.00 and R$ 1,000.00");
  }

  // Check/create Stripe customer
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  let customerId: string | undefined;
  if (customers.data.length > 0) {
    customerId = customers.data[0].id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  const origin = req.headers.get("origin") || "https://greet-easy-page.lovable.app";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: "Saldo Nexcharge",
            description: `Adição de saldo - R$ ${amount.toFixed(2)}`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${origin}/carteira/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/carteira`,
    metadata: {
      user_id: user.id,
      amount: amount.toString(),
      type: "wallet_deposit",
    },
  });

  // Record pending transaction
  await supabaseAdmin.from("wallet_transactions").insert({
    user_id: user.id,
    type: "deposit",
    status: "pending",
    amount,
    description: `Depósito via Stripe - R$ ${amount.toFixed(2)}`,
    stripe_session_id: session.id,
  });

  return { url: session.url };
}

async function handleWebhook(
  req: Request,
  body: any,
  supabaseAdmin: any,
  stripeKey: string
) {
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  // For simplicity, we validate via session retrieval rather than signature
  const { sessionId } = body;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: "Missing sessionId" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return new Response(JSON.stringify({ error: "Payment not completed" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = session.metadata?.user_id;
  const amount = parseFloat(session.metadata?.amount || "0");

  if (!userId || !amount) {
    return new Response(JSON.stringify({ error: "Invalid session metadata" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check if already processed
  const { data: existingTx } = await supabaseAdmin
    .from("wallet_transactions")
    .select("id, status")
    .eq("stripe_session_id", sessionId)
    .eq("status", "completed")
    .maybeSingle();

  if (existingTx) {
    return new Response(JSON.stringify({ success: true, already_processed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  // Update transaction status
  await supabaseAdmin
    .from("wallet_transactions")
    .update({ status: "completed" })
    .eq("stripe_session_id", sessionId);

  // Credit wallet balance
  const { data: wallet } = await supabaseAdmin
    .from("wallet_balances")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (wallet) {
    await supabaseAdmin
      .from("wallet_balances")
      .update({ balance: Number(wallet.balance) + amount })
      .eq("user_id", userId);
  } else {
    await supabaseAdmin
      .from("wallet_balances")
      .insert({ user_id: userId, balance: amount });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function requestWithdrawal(body: any, user: any, supabaseAdmin: any) {
  const { amount } = body;

  if (!amount || amount < 5) {
    throw new Error("Minimum withdrawal is R$ 5.00");
  }

  // Check balance
  const { data: wallet } = await supabaseAdmin
    .from("wallet_balances")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentBalance = wallet?.balance || 0;
  if (amount > currentBalance) {
    throw new Error("Insufficient balance");
  }

  // Deduct balance immediately
  await supabaseAdmin
    .from("wallet_balances")
    .update({ balance: Number(currentBalance) - amount })
    .eq("user_id", user.id);

  // Record withdrawal transaction
  await supabaseAdmin.from("wallet_transactions").insert({
    user_id: user.id,
    type: "withdrawal",
    status: "pending",
    amount,
    description: `Solicitação de retirada - R$ ${amount.toFixed(2)}`,
  });

  return { success: true };
}

async function listTransactions(user: any, supabaseAdmin: any) {
  const { data, error } = await supabaseAdmin
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return { transactions: data || [] };
}
