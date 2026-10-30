import { useEffect, useState } from "react";
import { cityByName } from "../data/content";
import { deepGet, savePricingSplit, updateOrderWithItems } from "../api/moversly";
import { getSheetPrice } from "../api/pricing";
import { placeCity, placeCode } from "../lib/move";
import { transitOf, fmtDate, money } from "../lib/quote";
import { M3_TO_FT3, roomVolume, shippingGuide } from "../lib/units";
import { useSurvey } from "../lib/useSurvey";
import { DocsStep, PassStep, PaymentStep, QuoteStep } from "./FlowSteps";
import Icon from "./Icons";
import StepHeader from "./StepHeader";
import SurveyStep from "./SurveyStep";

const SIZE_LABEL = { "Full Household": "Full household", "Partial Household": "Partial household", "Few Boxes": "A few boxes" };
const STEP_INDEX = { survey: 1, quote: 2, payment: 3, pass: 3, documents: 4 };
const PREV = {
  survey: ["home", "Back to your move"],
  quote: ["survey", "Back to AI survey"],
  payment: ["quote", "Back to quotation"],
  pass: ["quote", "Back to quotation"],
  documents: ["pass", "Back to Move Pass"],
};

/**
 * Steps 2–5 of the booking flow (Claude Design "India Booking Flow v4"), connected like
 * the Malaysia project: opening the quotation sends the survey items to the order,
 * looks up the price in the sales sheet and saves it on the order; payment is a real
 * Stripe payment through the Moversly payment-intent API, opened by our server with the
 * sheet price (the browser never sends the amount). Without a sheet price
 * (city without a tab, Malaysia origin, very large move) the customer sends a quote request.
 */
export default function BookingFlow({ step, move, update, go, onNewMove }) {
  const survey = useSurvey();
  const { rooms } = survey;
  const [agreed, setAgreed] = useState({ reviewed: false, understood: false });
  const [pricing, setPricing] = useState({ loading: false, error: "" });
  const [attempt, setAttempt] = useState(0);

  const v = move.values;
  const booking = move.booking || null;
  const city = cityByName(v.toChoice);
  const total = rooms.reduce((s, r) => s + roomVolume(r), 0);
  const itemCount = rooms.reduce((s, r) => s + r.items.reduce((n, it) => n + it.qty, 0), 0);
  const scanned = rooms.filter((r) => r.status === "done").length;
  const transit = transitOf(v.toChoice);
  const fromSG = v.fromChoice !== "Malaysia";
  const priceCity = city ? city.name : placeCity(v.dest);

  // The quote belongs to this route and inventory; any edit in the survey gets a new one.
  const items = rooms.flatMap((r) => r.items.map((it) => ({ name: it.label, room: r.name, dims: it.dims, qty: it.qty })));
  const sig = JSON.stringify([v.origin, v.dest, items.map((it) => [it.name, it.dims.map((d) => d.toFixed(2)), it.qty])]);
  const quote = move.quote?.sig === sig ? move.quote : null;
  const price = quote?.price ?? null;

  useEffect(() => {
    if (step !== "quote" || quote || total === 0) return;
    let alive = true;
    setPricing({ loading: true, error: "" });
    (async () => {
      try {
        const meta = await updateOrderWithItems({ orderId: move.orderId, values: v, items });
        const result = await getSheetPrice({ origin: v.fromChoice, city: priceCity, volumeM3: total });
        const saved = {
          sig,
          ...result,
          origin_port: deepGet(meta, ["origin_port", "originPort"]) || "Singapore",
          destination_port: deepGet(meta, ["destination_port", "destinationPort"]) || result.port,
        };
        // The cheapest option is chosen first; the customer can switch on the quotation.
        // As in the Malaysia project: the customer still sees the price if saving it fails.
        if (result.price != null) await savePricingSplit(move.orderId, saved).catch((e) => console.warn("create-pricing-with-split failed:", e));
        if (!alive) return;
        update({ ...move, quote: saved });
        setPricing({ loading: false, error: "" });
      } catch (e) {
        if (alive) setPricing({ loading: false, error: e.message || "We couldn't prepare your quotation. Please try again." });
      }
    })();
    return () => {
      alive = false;
    };
    // sig stands for the inventory and route; move and update change with every save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sig, attempt]);

  // Console (shared, slower) or 20' FCL (own container, faster) where both fit: the
  // chosen option's fields replace the top-level ones, and the order gets the new price.
  const choose = (type) => {
    const next = { ...quote, ...quote.options.find((o) => o.type === type) };
    update({ ...move, quote: next });
    savePricingSplit(move.orderId, next).catch((e) => console.warn("create-pricing-with-split failed:", e));
  };

  // The sheet price changed between the quotation and payment: keep the chosen option at its new price.
  // (Our server saves the new price on the order when it opens the payment.)
  const priceChanged = (fresh) => {
    const chosen = fresh.options?.find((o) => o.type === quote.type);
    update({ ...move, quote: chosen ? { ...quote, ...fresh, ...chosen } : { ...quote, ...fresh } });
  };

  const info = {
    v,
    booking,
    orderId: move.orderId,
    rooms,
    total,
    itemCount,
    scanned,
    quote,
    price,
    pricing,
    choose,
    priceChanged,
    priceCity,
    priceOrigin: v.fromChoice,
    retry: () => setAttempt((a) => a + 1),
    transit,
    fromSG,
    volume: `${total.toFixed(1)} m³`,
    ft3: `${Math.round(total * M3_TO_FT3).toLocaleString()} ft³`,
    shipping: shippingGuide(total),
    fromCode: placeCode(v.origin),
    toCode: city ? city.code : placeCode(v.dest),
    fromName: placeCity(v.origin),
    toName: city ? `${city.name}, India` : placeCity(v.dest),
    typeLabel: SIZE_LABEL[v.size] || v.size,
    originOffice: fromSG ? "APAC Relocation Singapore" : "APAC Relocation Malaysia",
    dateShort: fmtDate(v.date, true),
    dateLong: fmtDate(v.date),
  };

  const book = (fields) => {
    update({ ...move, booking: { ref: move.orderId, total: price, at: new Date().toISOString(), ...fields } });
    go("pass");
  };
  const onPaid = (paymentId) => book({ paid: true, paymentId });
  const requestQuote = () => book({ requested: true, total: null });

  const idx = STEP_INDEX[step];
  const [prevRoute, prevLabel] = PREV[step];
  const goStep = (i) => {
    const target = [null, "survey", "quote", booking ? "pass" : "payment", booking ? "documents" : null][i];
    if (i === 0) go("home");
    else if (target) go(target);
  };

  const quoteReady = !!quote && !pricing.loading;
  const cta = {
    survey: { label: "Next: quotation", action: () => go("quote") },
    quote:
      quoteReady && price == null
        ? { label: "Send my quote request", action: requestQuote }
        : { label: "Next: payment", action: () => go("payment"), disabled: !quoteReady },
    payment: null, // the pay button sits under the Stripe form on every screen size
    pass: { label: "Next: documents", action: () => go("documents") },
    documents: { label: "Save as PDF", action: () => window.print() },
  }[step];

  const asideTotal = booking ? booking.total : price;
  const asideTotalLabel = booking?.paid ? "Paid" : booking?.requested ? "Quote requested" : "Moving price";
  const priceText = (n) => (n != null ? money(n) : pricing.loading ? "Calculating…" : step === "survey" ? "After the survey" : "Our team will quote");

  return (
    <div className="flow">
      <StepHeader step={idx} onBack={() => go(prevRoute)} backLabel={prevLabel} onStep={goStep} canOpen={(i) => i < idx || (i === 4 && !!booking)} />

      <div className={`flow-body ${step === "pass" ? "wide" : ""}`}>
        <main className="flow-main">
          {step === "survey" && <SurveyStep survey={survey} info={info} onBack={() => go("home")} onNext={() => go("quote")} />}
          {step === "quote" && <QuoteStep info={info} onBack={() => go("survey")} onNext={cta.action} nextLabel={cta.label} nextDisabled={cta.disabled} />}
          {step === "payment" && (
            <PaymentStep info={info} agreed={agreed} setAgreed={setAgreed} onPaid={onPaid} onBack={() => go("quote")} onEdit={() => go("home")} />
          )}
          {step === "pass" && <PassStep info={info} onBack={() => go("quote")} onNext={() => go("documents")} />}
          {step === "documents" && <DocsStep info={info} onBack={() => go("pass")} />}
        </main>

        {step !== "pass" && (
          <aside className="booking only-desktop noprint">
            <div className="booking-head">
              <h2>Your booking</h2>
              {booking && <span className="ref-chip">{booking.ref}</span>}
            </div>
            <div className="route-box">
              <div><div className="code">{info.fromCode}</div><div className="route-name">{info.fromName}</div></div>
              <div className="route-mid">
                <div className="route-line"><span /><b><Icon name="ship" size={20} /></b><span /></div>
                <span className="route-days">{transit}*</span>
              </div>
              <div className="right"><div className="code">{info.toCode}</div><div className="route-name">{info.toName}</div></div>
            </div>
            <dl className="facts">
              <div><dt>Pickup</dt><dd>{info.dateShort}</dd></div>
              <div><dt>Shipment</dt><dd>{info.typeLabel}</dd></div>
              <div><dt>Volume</dt><dd>{info.volume} · {info.ft3}</dd></div>
              <div><dt>Shipping</dt><dd>{quote?.type || info.shipping}</dd></div>
            </dl>
            <dl className="facts sub">
              <div><dt>Origin office</dt><dd>{info.originOffice}</dd></div>
              <div><dt>Destination office</dt><dd>APAC Relocation India</dd></div>
            </dl>
            <div className="booking-total">
              <span>{asideTotalLabel}</span>
              <span className="total">{priceText(asideTotal)}</span>
            </div>
            <p className="booking-note">*Port-to-port (PTP) transit time.</p>
            <div className="booking-new">
              <button type="button" className="link" onClick={onNewMove}>Start a different move</button>
            </div>
          </aside>
        )}
      </div>

      <div className="flow-bar only-phone noprint">
        <div className="handle" aria-hidden="true" />
        <div className="between">
          <div>
            <div className="small strong">{info.fromCode} <Icon name="ship" size={15} className="inline-icon" /> {info.toCode} <span className="muted">· {info.dateShort} · {info.volume}</span></div>
            <div className="bar-price">{priceText(asideTotal)}</div>
          </div>
          <span className="muted tiny right">{asideTotalLabel}</span>
        </div>
        {cta && (
          <button type="button" className="btn-big block" onClick={cta.action} disabled={cta.disabled}>
            {cta.label} <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
