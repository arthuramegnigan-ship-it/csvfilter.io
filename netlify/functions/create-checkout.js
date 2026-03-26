const Stripe = require("stripe");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const { userId, email } = JSON.parse(event.body);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: "price_1TESlGLrCcYxw7KZ6g4HIYat", quantity: 1 }],
success_url: `${process.env.URL}/?session_id={CHECKOUT_SESSION_ID}`,      cancel_url: `${process.env.URL}/`,
      metadata: { supabase_user_id: userId },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
