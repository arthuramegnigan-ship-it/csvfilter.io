const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const sig = event.headers["stripe-signature"];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  const session = stripeEvent.data.object;

  switch (stripeEvent.type) {
    case "checkout.session.completed": {
      const userId = session.metadata.supabase_user_id;
      await supabase.from("profiles").update({
        is_pro: true,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
      }).eq("id", userId);
      break;
    }
    case "customer.subscription.deleted": {
      await supabase.from("profiles").update({
        is_pro: false,
        stripe_subscription_id: null,
      }).eq("stripe_customer_id", session.customer);
      break;
    }
    case "invoice.payment_succeeded": {
      await supabase.from("profiles").update({
        is_pro: true,
      }).eq("stripe_customer_id", session.customer);
      break;
    }
    case "invoice.payment_failed": {
      await supabase.from("profiles").update({
        is_pro: false,
      }).eq("stripe_customer_id", session.customer);
      break;
    }
  }

  return { statusCode: 200, body: "ok" };
};
