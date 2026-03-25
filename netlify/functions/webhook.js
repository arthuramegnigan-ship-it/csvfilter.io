const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async function(event) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const sig = event.headers["stripe-signature"];
  let stripeEvent;

  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return { statusCode: 400, body: "Webhook Error: " + err.message };
  }

  const obj = stripeEvent.data.object;

  if (stripeEvent.type === "checkout.session.completed") {
    const userId = obj.metadata && obj.metadata.supabase_user_id;
    if (userId) {
      await supabase.from("profiles").update({
        is_pro: true,
        stripe_customer_id: obj.customer,
        stripe_subscription_id: obj.subscription,
      }).eq("id", userId);
    }
  } else if (stripeEvent.type === "invoice.payment_succeeded") {
    await supabase.from("profiles").update({ is_pro: true }).eq("stripe_customer_id", obj.customer);
  } else if (stripeEvent.type === "customer.subscription.deleted") {
    await supabase.from("profiles").update({ is_pro: false, stripe_subscription_id: null }).eq("stripe_customer_id", obj.customer);
  } else if (stripeEvent.type === "invoice.payment_failed") {
    await supabase.from("profiles").update({ is_pro: false }).eq("stripe_customer_id", obj.customer);
  }

  return { statusCode: 200, body: "ok" };
};
