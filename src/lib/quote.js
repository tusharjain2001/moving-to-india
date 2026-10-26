// Illustrative pricing from the v4 design (not live rates): the city's sample
// starting price for ~20 m³, plus SGD 55 per extra m³, rounded to 10.
// To be replaced by the Moversly pricing API once APAC Relocation confirms rates.
import { CITIES, OTHER_CITY } from "../data/content";

const OTHER = { base: 3300, transit: "14–30 days" };
export const INSURANCE_RATE = 0.03;

const parseSgd = (s) => Number(String(s).replace(/[^\d.]/g, ""));
function cityInfo(toChoice) {
  const c = CITIES.find((x) => x.name === toChoice);
  return c ? { base: parseSgd(c.price), transit: c.sea } : toChoice === OTHER_CITY ? OTHER : { base: parseSgd(CITIES[0].price), transit: CITIES[0].sea };
}

export const transitOf = (toChoice) => cityInfo(toChoice).transit;

export function priceOf(toChoice, totalM3) {
  const { base } = cityInfo(toChoice);
  return Math.round((base + Math.max(0, totalM3 - 20) * 55) / 10) * 10;
}

export const premiumOf = (insured, declared) =>
  insured ? Math.round(Math.max(0, Number(declared) || 0) * INSURANCE_RATE * 100) / 100 : 0;

export const money = (n) => "SGD " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const TERMS = [
  "This is an illustrative estimate, not a binding offer. APAC Relocation confirms the final price in writing after reviewing your inventory.",
  "The price is based on the inventory volume shown. If the volume changes, the price is adjusted.",
  "The quotation is valid for 14 days.",
  "Transit times are estimates and depend on sailing schedules, customs clearance and capacity.",
  "Duties, taxes and any service not listed as included are charged separately if they apply.",
  "Insurance is optional and is arranged at checkout.",
];

export const GENERAL_DOCS = [
  "Passport (copy of the photo page)",
  "Visa, work permit or residence permit for your new country",
  "Detailed inventory of everything you are shipping, in English",
  "Bill of lading or air waybill (your mover arranges this)",
  "Signed authorisation letter so your mover can clear customs for you",
];

export function fmtDate(d, short) {
  if (!d) return "Date to be confirmed";
  const x = new Date(d + "T00:00:00");
  return x.toLocaleDateString("en-GB", short ? { day: "numeric", month: "short", year: "numeric" } : { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}
