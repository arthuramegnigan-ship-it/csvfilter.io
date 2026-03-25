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
    // isBase64Encoded: Netlify encode parfois le body en base64
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;

    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  const obj = stripeEvent.data.object;

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const userId = obj.metadata?.supabase_user_id;
        if (!userId) break;
        await supabase.from("profiles").update({
          is_pro: true,
          stripe_customer_id: obj.customer,
          stripe_subscription_id: obj.subscription,
        }).eq("id", userId);
        console.log("Pro activated for user:", userId);
        break;
      }
      case "customer.subscription.deleted": {
        await supabase.from("profiles").update({
          is_pro: false,
          stripe_subscription_id: null,
        }).eq("stripe_customer_id", obj.customer);
        break;
      }
      case "invoice.payment_succeeded": {
        await supabase.from("profiles").update({
          is_pro: true,
        }).eq("stripe_customer_id", obj.customer);
        break;
      }
      case "invoice.payment_failed": {
        await supabase.from("profiles").update({
          is_pro: false,
        }).eq("stripe_customer_id", obj.customer);
        break;
      }
    }
  } catch (err) {
    console.error("Supabase update error:", err.message);
    return { statusCode: 500, body: "Internal error" };
  }

  return { statusCode: 200, body: "ok" };
};      await supabase.from("profiles").update({
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
