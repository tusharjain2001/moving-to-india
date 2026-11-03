// "Talk to AI" for the India site: the same guided conversation as Moversly's
// assistant (moversely/ai/survey/chat.py), adapted to Singapore/Malaysia → India.
// Our code runs the conversation and checks each answer; common questions get
// fixed answers from our own data (customs summaries, FAQ), so nothing is made up.
// Other questions go to the AI on our server (see api/assistant.js).
import { CITIES, FAQS, INDIA_IMPORT, OTHER_CITY, SERVICES_6, SG_EXPORT } from "../data/content";
import { CITY_ALIASES } from "./places";

export const MOVE_TYPES = { full: "Full household", partial: "Partial household", boxes: "A few boxes" };
const SIZE_FOR_FORM = { full: "Full Household", partial: "Partial Household", boxes: "Few Boxes" };
const EDITABLE = { from: "Moving from", to: "Moving to", move_type: "What you're moving", date: "Moving date", name: "Name", email: "Email", phone: "Phone" };

export const GREETING =
  "Hi! I'm your AI moving assistant for moves to India. I'll ask a few quick questions, then you can scan your rooms " +
  "with your phone to estimate your shipment. You can ask me anything about moving or Indian customs along the way.";

const QUESTION_START = /^(what|how|when|where|why|which|who|do|does|did|can|could|is|are|will|would|should|shall|may|tell me|explain|help)\b/i;
const today = () => new Date().toISOString().slice(0, 10);
const title = (s) => s.trim().replace(/\s+/g, " ").split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

// ── Which step comes next ─────────────────────────────────
export function nextStep(a) {
  if (!a.from) return "from";
  if (a.from === "Malaysia" && !a.fromCity) return "fromCity";
  if (!a.to) return "to";
  if (a.to === OTHER_CITY && !a.toCity) return "toCity";
  for (const s of ["move_type", "date", "name", "email", "phone"]) if (!a[s]) return s;
  return "confirm";
}

export const longDate = (iso) =>
  new Date(`${iso}T00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export const fromLabel = (a) => (a.from === "Malaysia" ? a.fromCity || "Malaysia" : "Singapore");
export const toLabel = (a) => (a.to === OTHER_CITY ? a.toCity || "India" : `${a.to}, India`);

/** The assistant's question for a step, and the input widget to show. */
export function question(step, a) {
  switch (step) {
    case "from":
      return ["Where are you moving from?", { type: "chips", options: [{ label: "Singapore", value: "Singapore" }, { label: "Malaysia", value: "Malaysia" }] }];
    case "fromCity":
      return ["Which city in Malaysia are you moving from?", { type: "text", input: "text", placeholder: "e.g. Kuala Lumpur" }];
    case "to":
      return [
        `And which city in India are you moving to from ${a.from === "Malaysia" ? "Malaysia" : "Singapore"}?`,
        { type: "chips", options: [...CITIES.map((c) => ({ label: c.name, value: c.name })), { label: OTHER_CITY, value: OTHER_CITY }] },
      ];
    case "toCity":
      return ["Which city in India? Type its name.", { type: "text", input: "text", placeholder: "e.g. Kochi" }];
    case "move_type":
      return ["What are you moving?", { type: "chips", options: Object.entries(MOVE_TYPES).map(([value, label]) => ({ label, value })) }];
    case "date":
      return ["When would you like to move?", { type: "date", min: today() }];
    case "name":
      return ["Great. What's your full name?", { type: "text", input: "text", placeholder: "Full name" }];
    case "email": {
      const first = (a.name || "").split(" ")[0];
      return [`Thanks${first ? ", " + first : ""}! What's your email address?`, { type: "text", input: "email", placeholder: "you@example.com" }];
    }
    case "phone":
      return ["And your phone number, so our team can reach you?", { type: "text", input: "tel", placeholder: "+65 9123 4567" }];
    case "edit":
      return ["What would you like to change?", { type: "chips", options: Object.entries(EDITABLE).map(([k, label]) => ({ label, value: `edit:${k}` })) }];
    default:
      return [
        `Here's your move: ${fromLabel(a)} to ${toLabel(a)}, ${MOVE_TYPES[a.move_type].toLowerCase()}, around ${longDate(a.date)}. ` +
          "Next, scan each room with your phone and I'll estimate your shipment volume.",
        { type: "summary" },
      ];
  }
}

// ── Reading answers (ported from chat.py) ─────────────────
const MONTHS = Object.fromEntries(["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].map((m, i) => [m, i + 1]));

function parseDate(text) {
  const t = text.toLowerCase().trim();
  let y, mo, d, m;
  if ((m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/))) [y, mo, d] = [+m[1], +m[2], +m[3]];
  else if ((m = t.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/))) {
    [d, mo, y] = [+m[1], +m[2], +m[3]];
    if (mo > 12 && d <= 12) [d, mo] = [mo, d];
    if (y < 100) y += 2000;
  } else if ((m = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3})[a-z]*\.?,?\s+(\d{4})\b/))) [d, mo, y] = [+m[1], MONTHS[m[2]] || 0, +m[3]];
  else if ((m = t.match(/\b([a-z]{3})[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/))) [mo, d, y] = [MONTHS[m[1]] || 0, +m[2], +m[3]];
  else return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (!mo || dt.getUTCDate() !== d || dt.getUTCMonth() !== mo - 1) return null;
  const iso = dt.toISOString().slice(0, 10);
  return iso >= today() ? iso : null;
}

function parseName(text) {
  let t = text.trim().replace(/^(hi|hello|hey)[,!.\s]+/i, "");
  t = t.replace(/^(my name is|my name's|i am|i'm|im|this is|it's|its|name is|call me)\s+/i, "").replace(/^[\s.!,]+|[\s.!,]+$/g, "");
  if (t.length >= 2 && t.length <= 60 && /^[\p{L}][\p{L}'-]*(?:[ .'-]+[\p{L}][\p{L}.'-]*){0,4}$/u.test(t)) return title(t);
  return null;
}

const parseEmail = (text) => (text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/) || [])[0]?.toLowerCase() || null;

function parsePhone(text) {
  if (!/\d/.test(text)) return null;
  const digits = text.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? text.replace(/[^\d+ ()-]/g, "").trim() : null;
}

const MY_CITIES = /\b(kuala lumpur|kl|penang|george town|johor bahru|johor|jb|selangor|petaling jaya|pj|shah alam|subang|ipoh|kuching|kota kinabalu|malacca|melaka|putrajaya|cyberjaya|seremban|klang)\b/i;
const looksLikePlace = (t) => /^[\p{L}][\p{L} .'-]{1,40}$/u.test(t.trim()) && t.trim().split(/\s+/).length <= 4;

/** [value, problem, extra answers]. value null + problem null means "couldn't read it". */
function parse(step, text, a) {
  const t = text.trim();
  if (step === "from") {
    if (/\b(singapore|sg)\b/i.test(t)) return ["Singapore", null];
    const my = t.match(MY_CITIES);
    if (my) return ["Malaysia", null, { fromCity: `${title(my[1].length <= 2 ? { kl: "Kuala Lumpur", jb: "Johor Bahru", pj: "Petaling Jaya" }[my[1].toLowerCase()] || my[1] : my[1])}, Malaysia` }];
    if (/\bmalaysia\b/i.test(t)) return ["Malaysia", null];
    return [null, null];
  }
  if (step === "fromCity") {
    const city = t.replace(/,?\s*malaysia$/i, "");
    return looksLikePlace(city) ? [`${title(city)}, Malaysia`, null] : [null, null];
  }
  if (step === "to") {
    const hit = CITY_ALIASES.find(([re]) => re.test(t));
    if (hit) return [hit[1], null];
    if (/^(other|another|somewhere else)/i.test(t)) return [OTHER_CITY, null];
    const city = t.replace(/,?\s*india$/i, "");
    if (looksLikePlace(city) && !/^india$/i.test(t)) return [OTHER_CITY, null, { toCity: `${title(city)}, India` }];
    return [null, null];
  }
  if (step === "toCity") {
    const hit = CITY_ALIASES.find(([re]) => re.test(t));
    if (hit) return [`${CITIES.find((c) => c.name === hit[1]).place}`, null, { to: hit[1] }];
    const city = t.replace(/,?\s*india$/i, "");
    return looksLikePlace(city) ? [`${title(city)}, India`, null] : [null, null];
  }
  if (step === "move_type") {
    // Furniture or other items first: "a few boxes and a sofa" is part of a home, not only boxes.
    const things = /\b(furnitures?|furniture's|items?|things|stuff|pieces?|belongings|sofas?|couch|beds?|mattress|tables?|chairs?|wardrobes?|cupboards?|fridge|tv|desk|cabinets?|appliances?|washing machine)\b/i;
    const few = /\b(partial|part|some|few|couple|small|little|handful|only|just|limited)\b/i;
    if (/\b(full|whole|entire|everything|all (?:my|of|our|the)|complete|house|home|apartment|flat|\d\s*-?\s*(bhk|bed|bedroom|room)s?|bhk|bedrooms?|condo|hdb|family)\b/i.test(t) && !few.test(t)) return ["full", null];
    if (/\b(box|boxes|cartons?|suitcases?|bags?|luggage|parcels?)\b/i.test(t) && !things.test(t)) return ["boxes", null];
    if (few.test(t) || things.test(t)) return ["partial", null];
    return [null, null];
  }
  if (step === "date") {
    const d = parseDate(t);
    if (d) return [d, null];
    // A full date with a year that is wrong or past; anything else ("15 Dec", "next Friday") the AI may read.
    if (/\b\d{4}\b/.test(t)) return [null, "That date doesn't look right, or it's in the past. Please pick it from the calendar."];
    return [null, null];
  }
  if (step === "name") return [parseName(t), null];
  if (step === "email") {
    const v = parseEmail(t);
    return [v, v || !t.includes("@") ? null : "That email doesn't look complete. Could you check it?"];
  }
  if (step === "phone") {
    const v = parsePhone(t);
    return [v, v || !/\d/.test(t) ? null : "That number looks too short or too long. Could you check it?"];
  }
  return [null, null];
}

const isQuestion = (t) => t.trim().endsWith("?") || QUESTION_START.test(t.trim()) || t.trim().split(/\s+/).length > 8;

// ── Fixed answers from our own data ───────────────────────
const faq = (i) => FAQS[i][1];
const ANSWERS = [
  [/\b(duty|duties|tax|taxes|transfer of residence|tr|tor|inr|rupees?)\b/i, () => faq(1)],
  [/\b(cost|costs|price|prices|pricing|quote|quotation|how much|charge|charges|fee|fees|expensive|cheap|budget|rate|rates)\b/i, () => faq(0)],
  [/\b(how long|how many (days|weeks|months)|transit|delivery time|take to (ship|arrive|reach|deliver))\b|when will .* (arrive|reach)/i, () => faq(2)],
  [/\b(be in india|present|arrive before|stay until|when should i (fly|arrive|travel))\b/i, () => faq(3)],
  [/\b(car|cars|vehicle|motorbike|motorcycle|scooter|plants?)\b/i, () => faq(5)],
  [/\b(accurate|accuracy|precise|how good is the ai)\b/i, () => faq(4)],
  [/\b(pet|pets|dog|dogs|cat|cats|puppy|kitten|bird|birds|rabbit|animal|animals)\b/i, () =>
    "Pets travel separately from your household goods and need their own permits and paperwork, usually a microchip, vaccinations and a health certificate. Our team will confirm what applies to you."],
  [/\b(document|documents|docs|paperwork|papers|customs|forms?|visa|passport|permit|oci|frro|pan)\b/i, (a) => docsAnswer(a)],
  [/\b(pack|packing|packers|unpack|storage|store|warehouse|insurance|insure|insured|pick ?up|door to door|assemble|dismantle|crating|air freight|sea freight|container)\b/i, () =>
    `APAC Relocation handles the whole move under one contract: ${SERVICES_6.map(([t]) => t.toLowerCase()).join(", ")}. Insurance is optional at 3% of the declared value. Our team confirms the details with your quote.`],
  [/\b(data|privacy|private|gdpr|pdpa|share my|personal (data|information|details)|my (details|information|videos?))\b/i, () =>
    "Your details and room videos are used only to plan your move and prepare your quote. Our team can answer any privacy questions when they contact you."],
  [/\b(scan|scanning|video|record|recording|survey|camera|app)\b/i, () =>
    "After these questions, you record a short video of each room with your phone, no app needed. AI finds your furniture, measures it in 3D and adds up your shipment volume. You can edit any item."],
];

function docsAnswer(a) {
  const exp = a.from === "Malaysia"
    ? "To leave Malaysia: we don't have a customs summary yet, so our team will send the checklist with your quote."
    : "To leave Singapore:\n" + SG_EXPORT.documents.map((d) => `• ${d}`).join("\n");
  const imp = "To move into India:\n" + INDIA_IMPORT.documents.map((d) => `• ${d}`).join("\n");
  return `${a.from ? exp + "\n\n" : ""}${imp}\n\nYou'll get the full checklist, with duty-free rules, at the end.`;
}

const fixedAnswer = (text, a) => {
  const hit = ANSWERS.find(([re]) => re.test(text));
  return hit ? hit[1](a) : null;
};

/** What the visitor "said" when they tapped a button. */
export function label(step, value) {
  if (step === "move_type") return MOVE_TYPES[value] || value;
  if (step === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return longDate(value);
  if (value.startsWith("edit:")) return `Change ${(EDITABLE[value.slice(5)] || value.slice(5)).toLowerCase()}`;
  if (value === "edit") return "Change something";
  return value;
}

export const startState = () => ({ step: "from", answers: {}, editing: false });

export const NO_ANSWER = "Sorry, I can't answer that right now. Our moving team will help with it after you finish here.";

/** What the visitor has told the chat so far, for the AI ("Singapore to Mumbai, India, full household"). */
export function moveContext(a) {
  const parts = [];
  if (a.from) parts.push(a.to ? `${fromLabel(a)} to ${toLabel(a)}` : `from ${fromLabel(a)}`);
  if (a.move_type) parts.push(MOVE_TYPES[a.move_type].toLowerCase());
  if (a.date) parts.push(`around ${longDate(a.date)}`);
  return parts.join(", ");
}

/**
 * One turn of the conversation. Returns the new state, the assistant's
 * replies (the next question is added by the caller), and true when the
 * question has no fixed answer and should go to the AI.
 */
export function turn(state, text = "", value = "") {
  const s = { ...state, answers: { ...state.answers } };
  const a = s.answers;
  const step = s.step;
  text = text.trim().slice(0, 500);
  value = value.trim().slice(0, 100);

  if (value === "edit") return [{ ...s, step: "edit" }, []];
  if (value.startsWith("edit:") && EDITABLE[value.slice(5)]) {
    const k = value.slice(5);
    if (k === "from") { delete a.from; delete a.fromCity; delete a.to; delete a.toCity; }
    else if (k === "to") { delete a.to; delete a.toCity; }
    else delete a[k];
    return [{ ...s, step: nextStep(a), editing: true }, []];
  }

  // On steps the AI can read, a long sentence is an answer ("I'm moving to Kochi in Kerala"),
  // so only a real question (a "?" or a question word) counts as one.
  const question_ = UNDERSTAND[step] ? text.endsWith("?") || QUESTION_START.test(text) : isQuestion(text);
  const asking = !!text && question_ && text.split(/\s+/).length > 3;
  let answer = null, problem = null, extra = null;
  if (value && step !== "edit" && step !== "confirm") [answer, problem, extra] = [value, null, null];
  else if (step !== "edit" && step !== "confirm" && !asking) [answer, problem, extra] = parse(step, value || text, a);

  if (answer !== null && answer !== undefined) {
    if (step === "toCity" && extra?.to) { a.to = extra.to; delete a.toCity; }
    else {
      a[step] = answer;
      if (extra) Object.assign(a, extra);
    }
    if (step === "from" && answer === "Singapore") delete a.fromCity;
    if (step === "to" && answer !== OTHER_CITY) delete a.toCity;
    const next = nextStep(a);
    return [{ ...s, step: next, editing: next === "confirm" ? false : s.editing }, []];
  }
  if (problem) return [s, [problem]];

  if (text && (asking || question_ || step === "edit" || step === "confirm")) {
    const fixed = fixedAnswer(text, a);
    return fixed ? [s, [fixed]] : [s, [], true];
  }

  const hint = {
    from: "I can help with moves from Singapore and Malaysia for now. Tap one below.",
    to: "Pick a city below, or choose \"Other city in India\" and type its name.",
    fromCity: "Just the city name is perfect, for example Kuala Lumpur.",
    toCity: "Just the city name is perfect, for example Kochi.",
    move_type: "Just to check: are you moving your whole home, part of it (for example a few pieces of furniture), or only a few boxes? Tap one below.",
    date: "Please pick the exact date from the calendar below.",
    name: "Just your first and last name is perfect.",
  }[step] || "Sorry, I didn't catch that.";
  // The page can ask the AI to read answers our rules couldn't (see UNDERSTAND).
  return [s, [hint], false, !!text && !!UNDERSTAND[step]];
}

// Steps whose typed answers the AI may read when our rules can't (never name, email or
// phone): what kind of answer to ask for. The AI's reply goes through turn() again, so our
// own rules still check it.
export const UNDERSTAND = {
  from: { kind: "choice", choices: { Singapore: "moving from Singapore", Malaysia: "moving from anywhere in Malaysia" } },
  fromCity: { kind: "place", country: "Malaysia" },
  to: { kind: "place", country: "India" },
  toCity: { kind: "place", country: "India" },
  move_type: { kind: "choice", choices: { full: "their whole home", partial: "part of a home, e.g. some furniture or a few items", boxes: "only boxes, suitcases or bags" } },
  date: { kind: "date" },
};

// What the chat understood, shown when the AI read the answer, with the matching "Change" key.
export function understood(step, a) {
  const text = {
    from: () => `moving from ${fromLabel(a)}`,
    fromCity: () => `moving from ${fromLabel(a)}`,
    to: () => `moving to ${toLabel(a)}`,
    toCity: () => `moving to ${toLabel(a)}`,
    move_type: () => MOVE_TYPES[a.move_type].toLowerCase(),
    date: () => longDate(a.date),
  }[step];
  const edit = { fromCity: "from", toCity: "to" }[step] || step;
  return text ? [`Got it: ${text()}.`, edit] : null;
}

/** The finished chat as the booking form's values (see lib/move.js). */
export function toFormValues(a) {
  const city = CITIES.find((c) => c.name === a.to);
  return {
    fromChoice: a.from,
    fromPlace: a.from === "Malaysia" ? a.fromCity || "" : "",
    toChoice: a.to,
    toPlace: a.to === OTHER_CITY ? a.toCity || "" : "",
    origin: a.from === "Malaysia" ? a.fromCity : "Singapore",
    dest: city ? city.place : a.toCity,
    size: SIZE_FOR_FORM[a.move_type] || "Full Household",
    date: a.date,
    name: a.name,
    email: a.email,
    phone: a.phone,
  };
}
