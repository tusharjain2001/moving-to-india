// Quotation text and helpers. The price itself comes from the sales team's
// sheet (src/api/pricing.js).
import { SEA_TRANSIT } from "../data/content";

export const transitOf = () => SEA_TRANSIT;

export const money = (n) => "SGD " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const TERMS = [
  "The price is for the volume band shown, based on your AI survey. APAC Relocation reviews your inventory and confirms the details in writing.",
  "If the volume at pickup is different, the price is adjusted to the matching band.",
  "The quotation is valid for 14 days.",
  "Transit times are estimates and depend on sailing schedules, customs clearance and capacity.",
  "Duties, taxes and any service not listed as included are charged separately if they apply.",
  "Insurance is optional: our team can arrange cover after you book.",
];

// "Rates Exclude" list from APAC Relocation, in their wording.
export const EXCLUSIONS = [
  "Dismantling and assembling of new or flat packed, IKEA or furniture/items which require a specialist.",
  "Wall mounting, electrical works, piano handling, valet service (unpacking of boxes and placing in cupboards, shelves etc.).",
  "Non-refundable deposit to condo/building management authority.",
  "Delivery services on weekends, public holidays and non-office hours.",
  "Stair carrying above 1st floor and use of external elevator. Parking permit slot charges and shuttling services beyond 50 feet between container/truck parking location and the main entrance of the residence.",
  "Destination port storage charges, destination customs warehouse storage, customs warehouse handling charges etc.",
  "Customs duty/tax, quarantine charges, X-ray/Gamma Radiation scanning fee, examination fee, and any govt charges if any at the destination.",
  "Port storage charges/container detention charges. These charges can be applicable in following cases: lack of necessary documents, non-availability of the client for the delivery and any delay in the release of shipment from customs due to holidays, technical issues in customs website and unexpected issues like port congestions, natural calamities, and strikes.",
  "Warehouse handling charges (in/out) other than indicated in the proposal. These charges are applicable only if storage is required by the client at origin/destination.",
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
