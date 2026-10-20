const crypto = require("crypto");
const { getFirebaseAdmin } = require("./_firebase-admin");

const PLANS = {
  "100": { amountInCents: 1490000, label: "100 preguntas" },
  "300": { amountInCents: 2990000, label: "300 preguntas" },
  "all": { amountInCents: 4990000, label: "Completo · 1.000 preguntas" }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async function(event) {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const publicKey = process.env.WOMPI_PUBLIC_KEY;
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

    if (!publicKey || !integritySecret) {
      return json(500, { error: "Missing Wompi environment variables" });
    }

    const authHeader =
      event.headers.authorization ||
      event.headers.Authorization ||
      "";

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return json(401, { error: "Missing Firebase ID token" });
    }

    const admin = getFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(match[1]);

    const body = JSON.parse(event.body || "{}");
    const plan = body.plan;
    const requestedEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!PLANS[plan]) {
      return json(400, { error: "Invalid plan" });
    }

    const config = PLANS[plan];
    const uid = decoded.uid;

    // Google users use their verified Firebase email. Anonymous buyers may
    // provide an email only as Wompi purchase/contact metadata. Access remains
    // securely tied to the Firebase UID embedded in the signed reference.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = decoded.email || requestedEmail;
    if (!email || !emailPattern.test(email) || email.length > 254) {
      return json(400, { error: "Valid email required" });
    }

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

    return json(200, {
      publicKey,
      currency,
      amountInCents: config.amountInCents,
      reference,
      signature: integrity,
      redirectUrl: "https://porque.tekkify.co/payment-return.html",
      customerEmail: email,
      plan,
      label: config.label
    });
  } catch (error) {
    console.error("create-checkout error:", error);

    if (
      error &&
      (
        error.code === "auth/id-token-expired" ||
        error.code === "auth/argument-error" ||
        error.code === "auth/id-token-revoked"
      )
    ) {
      return json(401, { error: "Invalid Firebase session" });
    }

    return json(500, { error: "Could not create checkout" });
  }
};
