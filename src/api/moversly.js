// Moversly order API (api.moversly.com): the same calls and payloads as the
// Malaysia project (malaysia-project/src/api/client.js).
//   1. create the order / lead (sends an OTP email to new users, returns order_id)
//   2. confirm the email OTP (or resend it)
//   3. update the same order with the AI survey items and volume
//   4. save the price on the order (create-pricing-with-split); the price comes
//      from the sales team's sheet (src/api/pricing.js), not the pricing API
//   5. payment intent (Stripe clientSecret), opened by our server with the sheet price
//      (POST /payment, see src/api/pricing.js), paid in-page with Stripe's Payment Element
//   6. read the order back

const BASE = "https://api.moversly.com";
const M3_TO_FT3 = 35.3147;
const FALLBACK_KG_PER_M3 = 110; // the AI survey gives no weights; same estimate as the Malaysia project

export const DEFAULT_SHIPMENT_MODE = "SEA"; // AIR | SEA | ROAD
export const DEFAULT_SHIPMENT_TYPE = "CONSOLE"; // CONSOLE | FCL
// Same flag as the Malaysia project: the backend team asked for it while they test.
// Set to false once they confirm testing is finished.
export const TEST_LEAD = true;

async function req(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && (data.message || data.error || data.detail)) ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;
    const err = new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** First matching key anywhere in a nested response (case-insensitive). */
export function deepGet(obj, names) {
  const want = names.map((n) => n.toLowerCase());
  const queue = [obj];
  const seen = new Set();
  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
    seen.add(cur);
    for (const name of want) {
      for (const [k, v] of Object.entries(cur)) {
        if (k.toLowerCase() === name && v != null && v !== "") return v;
      }
    }
    for (const v of Object.values(cur)) if (v && typeof v === "object") queue.push(v);
  }
  return undefined;
}

export const MOVE_SIZES = ["Full Household", "Partial Household", "Few Boxes"];
const MOVING_TYPE = {
  "Full Household": "FULL_HOUSEHOLD",
  "Partial Household": "PARTIAL_HOUSEHOLD",
  "Few Boxes": "FEW_BOXES",
};
const countryOf = (s) => {
  const parts = (s || "").split(",").map((x) => x.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
};

export function buildBaseOrderPayload(values) {
  // The backend reads moving_date as a number: epoch milliseconds.
  const ts = Date.parse(values.date || "");
  return {
    name: values.name || "",
    email: values.email || "",
    phone: (values.phone || "").replace(/[\s-]/g, ""),
    origin_country: countryOf(values.origin) || "Singapore",
    origin_postal_code: "",
    origin_address: values.origin || "",
    destination_country: countryOf(values.dest) || "India",
    destination_postal_code: "",
    destination_address: values.dest || "",
    moving_date: Number.isFinite(ts) ? ts : 0,
    shipment_mode: DEFAULT_SHIPMENT_MODE,
    shipment_type: DEFAULT_SHIPMENT_TYPE,
    need_packing: true,
    moving_type: MOVING_TYPE[values.size] || "FULL_HOUSEHOLD",
    test_lead: TEST_LEAD,
  };
}

// Step 1: create the order. order_id, items and volume must be sent (empty),
// or the backend fails with PRO_ERR_008 "Error creating lead".
export function createOrderForPricing(values) {
  return req("/api/v1/order/create-order-for-pricing", {
    method: "POST",
    body: { order_id: "", ...buildBaseOrderPayload(values), items: [], volume: { unit: "CUBIC_M" } },
  });
}

// Step 2: email OTP. The email is the user name.
export function confirmRegistration(code, email) {
  return req("/api/v1/auth/confirm-registration/using-email", {
    method: "POST",
    body: { code, user_name: email },
  });
}
export function resendConfirmationCode(email) {
  return req("/api/v1/auth/resend-confirmation-code/using-email", {
    method: "POST",
    body: { user_name: email },
  });
}

// Step 3: the same order with items + volume. The backend parses dimensions as
// "L x W x H" (lowercase x, numbers only), so they are sent in cm without a unit.
// items: [{ name, room, dims: [m, m, m], qty }]. Returns the resolved ports and container.
export function updateOrderWithItems({ orderId, values, items }) {
  const roomNames = [...new Set(items.map((it) => it.room).filter(Boolean))];
  const unitM3 = (it) => it.dims[0] * it.dims[1] * it.dims[2];
  const apiItems = items.map((it) => ({
    name: it.name,
    dimensions: it.dims.map((m) => Math.round(m * 100)).join(" x "),
    quantity: String(it.qty),
    volumeFt3: (unitM3(it) * M3_TO_FT3).toFixed(2),
    volumeM3: unitM3(it).toFixed(2),
    weightKg: String(Math.round(unitM3(it) * FALLBACK_KG_PER_M3)),
  }));
  const totalM3 = items.reduce((s, it) => s + unitM3(it) * it.qty, 0);
  return req("/api/v1/order/create-order-for-pricing", {
    method: "POST",
    body: {
      order_id: orderId,
      ...buildBaseOrderPayload(values),
      ...(roomNames.length ? { room_name: roomNames.join(", ") } : {}),
      volume: { magnitude: totalM3.toFixed(2), unit: "CUBIC_M" },
      items: apiItems,
      total_volume: Math.round(totalM3),
      total_volume_ft3: Math.round(totalM3 * M3_TO_FT3),
      total_weight: Math.round(totalM3 * FALLBACK_KG_PER_M3),
      recommended_container: "",
    },
  });
}

// Step 4: save the price on the order. The backend expects only these fields
// (the Malaysia project found that extra fields cause an error), with from_survey_app: true.
// quote: the chosen sheet price plus the ports from the step-3 response.
export function savePricingSplit(orderId, quote) {
  return req("/api/v1/order/create-pricing-with-split", {
    method: "POST",
    body: {
      order_id: orderId,
      volume: { magnitude: String(quote.cft), unit: "CUBIC_FT" },
      container_type: quote.container_type,
      shipment_type: quote.shipment_type,
      origin_port: quote.origin_port,
      destination_port: quote.destination_port,
      final_price: { currency: quote.currency, amount: String(quote.price) },
      from_survey_app: true,
    },
  });
}

// Step 5, the payment intent, is opened by our server (src/api/pricing.js openPayment),
// so the amount comes from the sales sheet, not from the browser.

// Step 6: the full order.
export function getOrder(orderId) {
  return req(`/api/v1/order/${encodeURIComponent(orderId)}`);
}

// Stripe: the publishable key must match the mode of the backend's Stripe secret
// key. Default: the live key the Malaysia project uses (publishable keys are public),
// so a real card is really charged. Set VITE_STRIPE_PUBLISHABLE_KEY to a test key
// once the Moversly team switches payment-intent to test mode.
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_live_A4pqzjSx03dGMpIPIMrGzaIi00myhVoZVz";
let stripePromise = null;
export function loadStripe() {
  if (!stripePromise) {
    stripePromise = new Promise((resolve, reject) => {
      if (window.Stripe) return resolve(window.Stripe(STRIPE_PUBLISHABLE_KEY));
      const s = document.createElement("script");
      s.src = "https://js.stripe.com/v3";
      s.onload = () => (window.Stripe ? resolve(window.Stripe(STRIPE_PUBLISHABLE_KEY)) : reject(new Error("Stripe.js failed to start.")));
      s.onerror = () => {
        stripePromise = null;
        reject(new Error("Could not load the secure payment form. Check your connection and try again."));
      };
      document.head.appendChild(s);
    });
  }
  return stripePromise;
}

// Google Maps (Places search). Key from .env: VITE_GOOGLE_PLACES_API_KEY.
// Without a key this resolves to null and the fields are plain text boxes.
let googleMapsPromise = null;
export function loadGoogleMaps() {
  const key = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  if (!key) return Promise.resolve(null);
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve) => {
      if (window.google?.maps?.places) return resolve(window.google);
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
      s.async = true;
      s.onload = () => resolve(window.google || null);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }
  return googleMapsPromise;
}
