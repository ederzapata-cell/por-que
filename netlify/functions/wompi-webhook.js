const crypto = require("crypto");
const { getFirebaseAdmin } = require("./_firebase-admin");

const PLAN_CONFIG = {
  "100": { amountInCents: 1490000, unlockedCount: 100, rank: 1 },
  "300": { amountInCents: 2990000, unlockedCount: 300, rank: 2 },
  "all": { amountInCents: 4990000, unlockedCount: 1000, rank: 3 }
};

const PLAN_RANK = {
  free: 0,
  "100": 1,
  "300": 2,
  all: 3
};

function response(statusCode, body = "OK") {
  return {
    statusCode,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body
  };
}

function readPath(root, path) {
  return path.split(".").reduce((value, key) => {
    if (value === null || value === undefined) return undefined;
    return value[key];
  }, root);
}

function safeChecksumEqual(a, b) {
  if (!a || !b) return false;

  const left = Buffer.from(String(a).toLowerCase(), "utf8");
  const right = Buffer.from(String(b).toLowerCase(), "utf8");

  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifyWompiEvent(payload, headers, eventSecret) {
  const signature = payload && payload.signature;
  const properties = signature && signature.properties;

  if (!Array.isArray(properties) || !properties.length) return false;
  if (payload.timestamp === undefined || payload.timestamp === null) return false;

  let concatenated = "";

  for (const property of properties) {
    const value = readPath(payload.data, property);
    if (value === undefined || value === null) return false;
    concatenated += String(value);
  }

  concatenated += String(payload.timestamp);
  concatenated += eventSecret;

  const calculated = crypto
    .createHash("sha256")
    .update(concatenated)
    .digest("hex");

  const headerChecksum =
    headers["x-event-checksum"] ||
    headers["X-Event-Checksum"];

  const received =
    headerChecksum ||
    (signature && signature.checksum);

  return safeChecksumEqual(calculated, received);
}

function parseReference(reference) {
  if (typeof reference !== "string") return null;

  // UID is captured greedily so the parser remains safe if Firebase UID
  // formatting ever includes separators.
  const match = reference.match(
    /^PQ-(100|300|all)-(.+)-(\d{13})-([a-f0-9]{16})$/
  );

  if (!match) return null;

  return {
    plan: match[1],
    uid: match[2],
    createdAtMillis: Number(match[3]),
    nonce: match[4]
  };
}

exports.handler = async function(event) {
  try {
    if (event.httpMethod !== "POST") {
      return response(405, "Method not allowed");
    }

    const eventSecret = process.env.WOMPI_EVENT_SECRET;
    if (!eventSecret) {
      console.error("Missing WOMPI_EVENT_SECRET");
      return response(500, "Server configuration error");
    }

    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return response(400, "Invalid JSON");
    }

    if (!verifyWompiEvent(payload, event.headers || {}, eventSecret)) {
      console.warn("Rejected Wompi event: invalid checksum");
      return response(401, "Invalid checksum");
    }

    // Acknowledge other legitimate Wompi event types without processing them.
    if (payload.event !== "transaction.updated") {
      return response(200, "Ignored event");
    }

    const tx = payload.data && payload.data.transaction;
    if (!tx || !tx.id) {
      return response(400, "Missing transaction");
    }

    // Wompi can notify intermediate/final non-approved states.
    // Only APPROVED grants access.
    if (tx.status !== "APPROVED") {
      return response(200, `Ignored status ${tx.status || "unknown"}`);
    }

    const parsed = parseReference(tx.reference);
    if (!parsed) {
      // Valid Wompi event, but not a ¿Por qué? dynamic checkout transaction.
      return response(200, "Ignored foreign reference");
    }

    const config = PLAN_CONFIG[parsed.plan];

    if (!config) {
      return response(200, "Ignored unknown plan");
    }

    if (tx.currency !== "COP") {
      console.warn("Rejected approved transaction: wrong currency", tx.id);
      return response(400, "Wrong currency");
    }

    if (Number(tx.amount_in_cents) !== config.amountInCents) {
      console.warn("Rejected approved transaction: wrong amount", tx.id);
      return response(400, "Wrong amount");
    }

    const admin = getFirebaseAdmin();

    // Confirm that the UID embedded in the server-generated reference is a
    // real Firebase Authentication user.
    try {
      await admin.auth().getUser(parsed.uid);
    } catch (error) {
      console.error("Firebase user not found for approved transaction", {
        transactionId: tx.id,
        uid: parsed.uid,
        error: error && error.code
      });
      return response(400, "Unknown user");
    }

    const db = admin.firestore();
    const userRef = db.collection("users").doc(parsed.uid);
    const purchaseRef = db.collection("wompiPurchases").doc(tx.id);

    await db.runTransaction(async (firestoreTx) => {
      const [purchaseSnap, userSnap] = await Promise.all([
        firestoreTx.get(purchaseRef),
        firestoreTx.get(userRef)
      ]);

      // Idempotency: Wompi may retry the same event.
      if (purchaseSnap.exists) return;

      const userData = userSnap.exists ? (userSnap.data() || {}) : {};
      const currentPlan = userData.plan || "free";
      const currentRank = PLAN_RANK[currentPlan] ?? 0;

      // Never downgrade access. If someone with "all" later pays for 100,
      // their account remains "all".
      const resultingPlan =
        config.rank > currentRank ? parsed.plan : currentPlan;

      const resultingUnlocked =
        PLAN_CONFIG[resultingPlan]?.unlockedCount ||
        userData.unlockedCount ||
        10;

      firestoreTx.set(
        userRef,
        {
          plan: resultingPlan,
          unlockedCount: resultingUnlocked,
          lastPurchaseAt: admin.firestore.FieldValue.serverTimestamp(),
          lastWompiTransactionId: tx.id
        },
        { merge: true }
      );

      firestoreTx.set(purchaseRef, {
        uid: parsed.uid,
        purchasedPlan: parsed.plan,
        resultingPlan,
        unlockedCountGranted: config.unlockedCount,
        transactionId: tx.id,
        reference: tx.reference,
        amountInCents: Number(tx.amount_in_cents),
        currency: tx.currency,
        status: tx.status,
        customerEmail: tx.customer_email || null,
        paymentMethodType: tx.payment_method_type || null,
        wompiCreatedAt: tx.created_at || null,
        wompiFinalizedAt: tx.finalized_at || null,
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        eventTimestamp: payload.timestamp,
        environment: payload.environment || null
      });
    });

    console.log("Wompi purchase activated", {
      transactionId: tx.id,
      uid: parsed.uid,
      plan: parsed.plan
    });

    return response(200, "OK");
  } catch (error) {
    console.error("wompi-webhook error:", error);
    // Returning 500 lets Wompi retry transient failures.
    return response(500, "Internal error");
  }
};
