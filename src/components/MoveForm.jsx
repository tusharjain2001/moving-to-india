import { useEffect, useRef, useState } from "react";
import { MOVE_SIZES, createOrderForPricing, deepGet, loadGoogleMaps } from "../api/moversly";
import { destFields, originFields, routeProblem } from "../lib/places";

const SIZE_LABEL = { "Full Household": "Full household", "Partial Household": "Partial", "Few Boxes": "A few boxes" };
const FLOW = ["Your move", "AI survey", "Quotation", "Payment", "Documents"];

/**
 * Place search backed by google.maps.places.Autocomplete (as in the Malaysia
 * project and the Moversly site), limited to the given countries
 * ("sg,my" or "in"). Any place can be picked, a suburb or an address too; it
 * is normalised to "City, Country", which the Moversly backend needs.
 * Without a Google key it is a plain text box.
 */
function PlaceInput({ id, value, onChange, countries, placeholder, className = "f-input" }) {
  const inputRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    let ac = null;
    loadGoogleMaps().then((g) => {
      if (cancelled || !g?.maps?.places?.Autocomplete || !inputRef.current) return;
      ac = new g.maps.places.Autocomplete(inputRef.current, {
        fields: ["address_components", "name"],
        componentRestrictions: { country: countries.split(",") },
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace() || {};
        const comps = place.address_components || [];
        const get = (t) => (comps.find((c) => c.types.includes(t)) || {}).long_name;
        const city = get("locality") || get("postal_town") || get("administrative_area_level_2") || get("administrative_area_level_1");
        const ctry = get("country");
        onChangeRef.current(city && ctry && city !== ctry ? `${city}, ${ctry}` : place.name || inputRef.current.value);
      });
    });
    return () => {
      cancelled = true;
      if (ac && window.google?.maps?.event) window.google.maps.event.clearInstanceListeners(ac);
    };
  }, [countries]);

  return (
    <input
      ref={inputRef}
      id={id}
      className={className}
      type="text"
      autoComplete="off"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => e.target.select()}
    />
  );
}

function validate(v, origin, dest) {
  const route = routeProblem(origin, dest);
  if (route) return route;
  if (!v.date) return "Choose your moving date.";
  if (!v.name.trim()) return "Enter your name.";
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) return "Enter a valid email address.";
  if (v.phone.replace(/\D/g, "").length < 7) return "Enter a valid phone number.";
  return "";
}

/**
 * Step 1 "Start your move plan". On submit it creates the order on
 * api.moversly.com, exactly like the Malaysia project's QuoteBand: new users
 * then get an OTP email; users the backend already knows go to the AI survey.
 */
export default function MoveForm({ values, setValues, onSubmitted }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const update = (k, val) => {
    setValues((s) => ({ ...s, [k]: val }));
    setError("");
  };
  // The searched places drive everything else: origin office, city card, price.
  const setOrigin = (v) => {
    setValues((s) => ({ ...s, origin: v, ...originFields(v) }));
    setError("");
  };
  const setDest = (v) => {
    setValues((s) => ({ ...s, dest: v, ...destFields(v) }));
    setError("");
  };
  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const origin = values.origin.trim();
    const dest = values.dest.trim();
    const problem = validate(values, origin, dest);
    if (problem) return setError(problem);
    const final = { ...values, origin, dest, ...originFields(origin), ...destFields(dest) };
    setSubmitting(true);
    try {
      const res = await createOrderForPricing(final);
      const orderId = deepGet(res, ["order_id", "orderId", "orderID"]);
      if (!orderId) throw new Error("We couldn't create your booking. Please try again.");
      const exists = deepGet(res, ["user_exist", "userExist", "user_exists"]);
      onSubmitted(final, orderId, exists === true || exists === "true");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div id="start" className="plan-card">
      <div className="plan-head">
        <h2>Start your move plan</h2>
        <span>Step 1 of 5</span>
      </div>
      <div className="plan-bars" aria-hidden="true">
        {FLOW.map((s, i) => <span key={s} className={i === 0 ? "on" : ""} />)}
      </div>

      <form onSubmit={submit} noValidate className="plan-form">
        {error && <p role="alert" className="plan-error">{error}</p>}

        <div className="row1">
        <div className="pair">
          <label className="pick">
            <span>From</span>
            <PlaceInput id="origin" countries="sg,my" className="pick-input" value={values.origin} onChange={setOrigin} placeholder="City in Singapore or Malaysia" />
          </label>
          <label className="pick">
            <span>To</span>
            <PlaceInput id="dest" countries="in" className="pick-input" value={values.dest} onChange={setDest} placeholder="City in India" />
          </label>
        </div>

        <div role="group" aria-label="What are you moving?" className="seg">
          {MOVE_SIZES.map((s) => (
            <button type="button" key={s} aria-pressed={values.size === s} className={values.size === s ? "on" : ""} onClick={() => update("size", s)}>
              {SIZE_LABEL[s]}
            </button>
          ))}
        </div>
        </div>

        <div className="fields">
          <label className="f-label">
            Moving date
            <input className="f-input" type="date" min={today} value={values.date} onChange={(e) => update("date", e.target.value)} />
          </label>
          <label className="f-label">
            Full name
            <input className="f-input" autoComplete="name" value={values.name} onChange={(e) => update("name", e.target.value)} />
          </label>
          <label className="f-label">
            Email
            <input className="f-input" type="email" inputMode="email" autoComplete="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
          </label>
          <label className="f-label">
            Phone
            <input className="f-input" type="tel" inputMode="tel" autoComplete="tel" placeholder="+65" value={values.phone} onChange={(e) => update("phone", e.target.value)} />
          </label>
        </div>

        <div className="plan-foot">
          <p className="plan-note">
            No app · No payment now · Written quote in 48 hours
            <br />
            4.9★ rating* · 1,000+ moves a year · Own office in India
          </p>
          <button type="submit" className="pill-cta" disabled={submitting}>
            {submitting ? "Creating your move plan…" : "Next: scan your rooms"} <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>
    </div>
  );
}
