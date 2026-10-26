// Moversly order API (api.moversly.com): the same calls and payloads as the
// Malaysia project (malaysia-project/src/api/client.js), steps 1 and 2 only.
//   1. create the order / lead (sends an OTP email to new users, returns order_id)
//   2. confirm the email OTP (or resend it)

const BASE = "https://api.moversly.com";

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
