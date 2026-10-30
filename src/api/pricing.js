// Price from the sales team's Google Sheet "Singapore to India Export", read by
// our server (moversely ai/survey/prices.py) with the Google service account:
//   GET /prices?route=india&city=<City>&cft=<CFT>&origin=<Singapore|Malaysia>
//   -> { price, currency, cft, band, type, shipment_type, container_type, port, tab }
//   or { price: null, cft, reason }  (origin | city | volume: our team quotes instead)
// The server finds the city tab and CFT band, takes "Quote Amount (SGD)", and
// uses the cheaper of Console and 20' FCL where both fit (351–600 CFT).
import { M3_TO_FT3 } from "../lib/units";
import { SURVEY_API_URL } from "./survey";

export async function getSheetPrice({ origin, city, volumeM3 }) {
  const params = new URLSearchParams({ route: "india", city, origin, cft: (volumeM3 * M3_TO_FT3).toFixed(1) });
  let res;
  try {
    res = await fetch(`${SURVEY_API_URL}/prices?${params}`);
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  if (!res.ok) throw new Error("Prices are not available right now. Please try again shortly.");
  return res.json();
}

// Payment with the amount set by our server, not the browser:
//   POST /payment {order_id, route, origin, city, cft, type, price, email, name, origin_port, destination_port}
//   -> { client_secret, price, currency }
// The server looks the price up in the sheet again, saves it on the order and opens the
// Stripe payment on api.moversly.com. Errors carry `code`: "price_changed" (with the new
// `quote`) when the sheet changed since the quotation was shown, or "no_price".
export async function openPayment({ orderId, quote, city, origin, email, name }) {
  let res;
  try {
    res = await fetch(`${SURVEY_API_URL}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderId,
        route: "india",
        origin,
        city,
        cft: quote.cft,
        type: quote.type,
        price: quote.price,
        email,
        name,
        origin_port: quote.origin_port || "",
        destination_port: quote.destination_port || "",
      }),
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.detail;
    const err = new Error((typeof detail === "string" && detail) || detail?.message || "We couldn't start the payment. Please try again.");
    if (detail && typeof detail === "object") Object.assign(err, detail);
    throw err;
  }
  return data;
}
