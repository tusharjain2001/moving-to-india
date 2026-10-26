// Page copy from the Claude Design "India Landing v4" and "India Booking Flow v4".
// Values marked * are samples, to be confirmed by APAC Relocation.
import india from "./customs/india.json";
import singapore from "./customs/singapore.json";

export const INDIA_IMPORT = india.import;
export const SG_EXPORT = singapore.export;
export const SG_EXPORT_LINES = [...singapore.export.documents, ...singapore.export.restricted];

// "To" choices. `place` is what the Moversly order API receives ("City, Country").
export const CITIES = [
  { name: "Mumbai", state: "Maharashtra", place: "Mumbai, India", code: "BOM", sea: "10–14 days", air: "5–7 days", port: "Nhava Sheva (JNPT)", price: "SGD 2,900" },
  { name: "Bengaluru", state: "Karnataka", place: "Bengaluru, India", code: "BLR", sea: "14–20 days", air: "5–7 days", port: "Chennai, then by road", price: "SGD 3,100" },
  { name: "Delhi NCR", state: "Delhi, Gurugram, Noida", place: "New Delhi, India", code: "DEL", sea: "21–30 days", air: "5–7 days", port: "Mundra or Nhava Sheva, then rail", price: "SGD 3,400" },
  { name: "Chennai", state: "Tamil Nadu", place: "Chennai, India", code: "MAA", sea: "7–12 days", air: "4–6 days", port: "Chennai", price: "SGD 2,800" },
  { name: "Hyderabad", state: "Telangana", place: "Hyderabad, India", code: "HYD", sea: "16–22 days", air: "5–7 days", port: "Chennai, then by road", price: "SGD 3,200" },
  { name: "Pune", state: "Maharashtra", place: "Pune, India", code: "PNQ", sea: "12–16 days", air: "5–7 days", port: "Nhava Sheva (JNPT), then by road", price: "SGD 3,000" },
];
export const OTHER_CITY = "Other city in India";
export const cityByName = (name) => CITIES.find((c) => c.name === name);


export const TRUST = [
  "No app, any phone",
  "Furniture measured in 3D",
  "India customs checklist",
  "Own offices in Singapore, Malaysia and India",
];

export const STATS = [
  ["1,000+", "moves a year"],
  ["2012", "established"],
  ["3", "own offices"],
  ["0", "hidden charges"],
  ["48 h", "written quote"],
];

export const HOW_STEPS = [
  ["01", "Your move", "Tell us where from, where to, when and roughly how much. Under a minute."],
  ["02", "AI survey", "Record a short video of each room. The AI lists every item with L × D × H and m³."],
  ["03", "Quotation", "See a door-to-door price for your inventory, then a written quote within 48 hours."],
  ["04", "Payment", "Review the scope, add optional insurance at 3% of declared value, confirm and get your Move Pass."],
  ["05", "Documents", "Get the customs checklist for leaving Singapore or Malaysia and arriving in India."],
];

export const SERVICES_4 = [
  ["01", "Planning from your AI survey", "Your room videos become a measured inventory. We recommend sea or air and a shared or full container, then send a written plan and quotation."],
  ["02", "Export packing with a valued inventory", "Our crew packs to export standard and writes an itemised inventory with values, the list Indian customs asks for."],
  ["03", "Sea freight to Nhava Sheva, Chennai or Mundra, or air", "We book the sailing or flight that suits your date and city. Sailings leave Singapore every week."],
  ["04", "Transfer of Residence clearance and delivery", "Our India office prepares the customs declaration with you, then delivers, unpacks and takes the packing away."],
];

export const SERVICES_6 = [
  ["Door-to-door moving to India", "From your home in Singapore or Malaysia to your new home in India, under one contract."],
  ["Professional packing", "Trained crews and export materials for furniture, electronics, art and fragile items."],
  ["Sea freight", "Full container (FCL) or shared container (LCL), sized from your AI survey."],
  ["Air freight", "A faster option for the boxes you need in your first weeks in India."],
  ["Customs clearance", "Our India office handles the paperwork and the Transfer of Residence declaration with you."],
  ["Storage", "Short or long-term storage in Singapore or India while your new home gets ready."],
];

export const TIMELINE = [
  ["T − 12 weeks", "Get a quote and plan", "Fill in the form and record each room on your phone. The AI builds your inventory in m³, you see a door-to-door price, and a coordinator sends a written quote within 48 hours."],
  ["T − 8 weeks", "Check Transfer of Residence", "We check your time abroad and your visa against the India import checklist, and list the documents your agent in India will ask for."],
  ["T − 4 weeks", "Book the sailing", "We book space on a weekly sailing to the port that serves your city, or a flight for urgent items, and agree your packing day."],
  ["T − 1 week", "Packing and collection", "Our crew packs to export standard, labels every carton against the valued inventory and loads your container in Singapore or Malaysia."],
  ["T + 1 day", "On the water to India", "Your shipment sails to Nhava Sheva, Chennai or Mundra. You fly ahead: the India checklist says to arrive before your shipment and stay until it clears."],
  ["T + 4 weeks", "Clearance and delivery", "Our India office files the customs declaration with you. Once released, the crew delivers, unpacks and takes the packing away."],
];

export const VISAS = [
  ["E", "Employment visa", "2–4 weeks*", "For foreign nationals employed by a company in India. HR usually sponsors it with your contract."],
  ["OCI", "OCI card", "6–10 weeks*", "For people of Indian origin with a foreign passport. Lets you live and work in India without a visa."],
  ["B", "Business visa", "1–3 weeks*", "For business visits and setting up operations, not regular employment."],
  ["X", "Entry visa for dependants", "2–4 weeks*", "For spouses and children joining an Employment visa holder."],
  ["S", "Student visa", "2–4 weeks*", "For full-time study at a recognised Indian institution."],
];

export const REVIEWS = [
  ["We recorded four rooms on a Sunday and had a price that evening. The India team was at Nhava Sheva for clearance, so we didn't chase anyone.", "[Customer name]", "Singapore → Mumbai · family of four"],
  ["They told us before packing which items needed purchase bills for customs. That saved us a week.", "[Customer name]", "Kuala Lumpur → Bengaluru · 2-bedroom flat"],
  ["My company booked it and I just did the survey. The Move Pass had everything on one page.", "[Customer name]", "Singapore → Pune · employee posting"],
];

export const FAQS = [
  ["How much does it cost to move from Singapore to India?", "It depends on your volume, your city and sea or air. As a sample, a 2-bedroom flat to Mumbai by sea starts from SGD 2,900*. The AI survey prices your own inventory, and a coordinator sends a written quote within 48 hours."],
  ["Will I pay duty on my used furniture?", "From the India customs guide: \"Used goods owned for 1+ year can get reduced duty under Transfer of Residence\" and \"After 2+ years abroad, used household items up to INR 5,00,000 in total qualify\". Also: \"New items and flat-screen TVs pay duty of around 38%\"."],
  ["How long does the move take?", "Sea freight takes about 7 to 30 days* depending on the city, plus customs clearance. Air freight takes about 4 to 7 days*. See Popular cities for each route."],
  ["Do I need to be in India when my shipment arrives?", "From the India customs guide: \"Arrive before your shipment and stay until it clears; some ports need you present\". Also: \"Ship goods within 1 month of arriving in India (15 days for air)\"."],
  ["How accurate is the AI survey?", "The AI measures each item from your video in L × D × H and adds up the m³. You can correct anything before you see a price, and a coordinator reviews the inventory before your written quote."],
  ["Can I ship my car, pets or plants?", "From the India customs guide: \"Cars face heavy duty and strict rules, and can't enter via Bangalore or Hyderabad\". Pets and plants need separate permits; ask us and we will confirm what applies to you."],
];
