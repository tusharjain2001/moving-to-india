// Turning a searched place ("Navi Mumbai, India", "Petaling Jaya, Malaysia")
// into the choices the rest of the site uses: Singapore or Malaysia for the
// origin office, and one of the six city cards (or "other") for prices and codes.
import { OTHER_CITY } from "../data/content";

export const CITY_ALIASES = [
  [/\b(mumbai|bombay|navi mumbai|thane)\b/i, "Mumbai"],
  [/\b(bengaluru|bangalore|blr)\b/i, "Bengaluru"],
  [/\b(delhi|new delhi|ncr|gurgaon|gurugram|noida|faridabad|ghaziabad)\b/i, "Delhi NCR"],
  [/\b(chennai|madras)\b/i, "Chennai"],
  [/\b(hyderabad|secunderabad|cyberabad)\b/i, "Hyderabad"],
  [/\b(pune|poona)\b/i, "Pune"],
];

const parts = (s) => (s || "").split(",").map((x) => x.trim()).filter(Boolean);

/** Origin office for a place: Malaysia when the place is in Malaysia, else Singapore. */
export function originFields(origin) {
  const malaysia = /malaysia$/i.test((origin || "").trim());
  return { fromChoice: malaysia ? "Malaysia" : "Singapore", fromPlace: malaysia ? origin.trim() : "" };
}

/** City card for a place in India, or "Other city in India". */
export function destFields(dest) {
  const city = parts(dest)[0] || "";
  const hit = CITY_ALIASES.find(([re]) => re.test(city));
  return hit ? { toChoice: hit[1], toPlace: "" } : { toChoice: OTHER_CITY, toPlace: (dest || "").trim() };
}

/** Problem with the route, or "" when the order API will accept it. */
export function routeProblem(origin, dest) {
  const o = parts(origin);
  const d = parts(dest);
  const oCountry = (o.at(-1) || "").toLowerCase();
  if (!(oCountry === "singapore" || (oCountry === "malaysia" && o.length >= 2)))
    return 'Choose where you are moving from in Singapore or Malaysia, for example "Kuala Lumpur, Malaysia".';
  // The backend fails (PRO_ERR_008) on a country-only destination.
  if (d.length < 2 || (d.at(-1) || "").toLowerCase() !== "india")
    return 'Choose the city in India you are moving to, for example "Mumbai, India".';
  return "";
}
