// Quotation text and helpers. The price itself comes from the sales team's
// sheet (src/api/pricing.js); transit windows are the design's samples.
import { CITIES } from "../data/content";

const OTHER_TRANSIT = "14–30 days";

export const transitOf = (toChoice) => CITIES.find((x) => x.name === toChoice)?.sea || OTHER_TRANSIT;

export const money = (n) => "SGD " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const TERMS = [
  "The price is for the volume band shown, based on your AI survey. APAC Relocation reviews your inventory and confirms the details in writing.",
  "If the volume at pickup is different, the price is adjusted to the matching band.",
  "The quotation is valid for 14 days.",
  "Transit times are estimates and depend on sailing schedules, customs clearance and capacity.",
  "Duties, taxes and any service not listed as included are charged separately if they apply.",
  "Insurance is optional: our team can arrange cover after you book.",
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
