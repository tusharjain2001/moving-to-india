// The move details from step 1 and the Moversly order, kept in this browser so
// the survey survives a reload. Later steps (quotation) need the order_id.
const KEY = "moving-to-india:move";

// fromChoice / toChoice are the two drop-downs; fromPlace / toPlace the city
// search used for "Malaysia" and "Other city in India". origin and dest are
// what the Moversly order API receives ("City, Country").
export const EMPTY_MOVE = {
  fromChoice: "Singapore",
  fromPlace: "",
  toChoice: "",
  toPlace: "",
  origin: "Singapore",
  dest: "",
  size: "Full Household",
  date: "",
  name: "",
  email: "",
  phone: "+65 ",
};

export function loadMove() {
  try {
    const raw = localStorage.getItem(KEY);
    const saved = raw ? JSON.parse(raw) : null;
    // Moves saved before the drop-downs existed: fill in the new fields.
    return saved ? { ...saved, values: { ...EMPTY_MOVE, ...saved.values } } : null;
  } catch {
    return null;
  }
}

/** saved = { values, orderId, verified } */
export function saveMove(saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Private mode or storage blocked: the flow still works until a reload.
  }
}

export function clearMove() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

const CODES = {
  singapore: "SIN", "kuala lumpur": "KUL", penang: "PEN", "george town": "PEN", "johor bahru": "JHB", malaysia: "KUL",
  "petaling jaya": "KUL", "shah alam": "KUL", "subang jaya": "KUL", klang: "KUL", putrajaya: "KUL", cyberjaya: "KUL",
  kuching: "KCH", "kota kinabalu": "BKI", ipoh: "IPH", malacca: "MKZ", melaka: "MKZ", seremban: "KUL",
  mumbai: "BOM", "navi mumbai": "BOM", thane: "BOM", bengaluru: "BLR", bangalore: "BLR",
  delhi: "DEL", "new delhi": "DEL", gurugram: "DEL", gurgaon: "DEL", noida: "DEL",
  chennai: "MAA", hyderabad: "HYD", pune: "PNQ", kolkata: "CCU", ahmedabad: "AMD", kochi: "COK",
};

/** Airport-style code for the route line, e.g. "Mumbai, India" gives "BOM". */
export function placeCode(place) {
  const city = (place || "").split(",")[0].trim().toLowerCase();
  return CODES[city] || city.slice(0, 3).toUpperCase() || "---";
}

export const placeCity = (place) => (place || "").split(",")[0].trim();
