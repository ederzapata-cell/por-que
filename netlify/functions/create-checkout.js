const crypto = require("crypto");

const PLANS = {
  "100": { amountInCents: 1490000, label: "100 preguntas" },
  "300": { amountInCents: 2990000, label: "300 preguntas" },
  "all": { amountInCents: 4990000, label: "Completo · 1.000 preguntas" }
};

exports.handler = async function(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    const publicKey = process.env.WOMPI_PUBLIC_KEY;
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

    if (!publicKey || !integritySecret) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing Wompi environment variables" })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { plan, uid, email } = body;

    if (!uid || typeof uid !== "string") {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing Firebase uid" })
      };
    }

    if (!PLANS[plan]) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid plan" })
      };
    }

    const config = PLANS[plan];

    // Unique reference tied to this Firebase account and plan.
    const nonce = crypto.randomBytes(8).toString("hex");
    const timestamp = Date.now();
    const reference = `PQ-${plan}-${uid}-${timestamp}-${nonce}`;

    const currency = "COP";
    const signatureString =
      `${reference}${config.amountInCents}${currency}${integritySecret}`;

    const integrity = crypto
      .createHash("sha256")
      .update(signatureString)
      .digest("hex");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        publicKey,
        currency,
        amountInCents: config.amountInCents,
        reference,
        signature: integrity,
        redirectUrl: "https://porque.tekkify.co/payment-return.html",
        customerEmail: email || "",
        plan,
        label: config.label
      })
    };
  } catch (error) {
    console.error("create-checkout error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Could not create checkout" })
    };
  }
};
