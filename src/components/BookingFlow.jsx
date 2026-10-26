import { useState } from "react";
import { cityByName } from "../data/content";
import { placeCity, placeCode } from "../lib/move";
import { premiumOf, priceOf, transitOf, fmtDate, money } from "../lib/quote";
import { M3_TO_FT3, roomVolume, shippingGuide } from "../lib/units";
import { useSurvey } from "../lib/useSurvey";
import { DocsStep, PassStep, PaymentStep, QuoteStep } from "./FlowSteps";
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
 * Steps 2–5 of the booking flow (Claude Design "India Booking Flow v4"):
 * AI survey, quotation, payment (simulation) with the Move Pass, documents.
 * Prices are the design's illustrative estimate, not live rates.
 */
export default function BookingFlow({ step, move, update, go, onNewMove }) {
  const survey = useSurvey();
  const { rooms } = survey;
  const [pay, setPay] = useState({ insured: false, declared: "", reviewed: false, understood: false });

  const v = move.values;
  const booking = move.booking || null;
  const city = cityByName(v.toChoice);
  const total = rooms.reduce((s, r) => s + roomVolume(r), 0);
  const itemCount = rooms.reduce((s, r) => s + r.items.reduce((n, it) => n + it.qty, 0), 0);
  const scanned = rooms.filter((r) => r.status === "done").length;
  const price = priceOf(v.toChoice, total);
  const premium = premiumOf(pay.insured, pay.declared);
  const transit = transitOf(v.toChoice);
  const fromSG = v.fromChoice !== "Malaysia";

  const info = {
    v,
    booking,
    orderId: move.orderId,
    rooms,
    total,
    itemCount,
    scanned,
    price,
    premium,
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

  const ready = pay.reviewed && pay.understood;
  const confirmBooking = () => {
    if (!ready) return;
    // Simulation: nothing is charged. The Moversly order number is the booking reference.
    update({ ...move, booking: { ref: move.orderId, premium, total: price + premium, insured: pay.insured, declared: pay.declared, at: new Date().toISOString() } });
    go("pass");
  };

  const idx = STEP_INDEX[step];
  const [prevRoute, prevLabel] = PREV[step];
  const goStep = (i) => {
    const target = [null, "survey", "quote", booking ? "pass" : "payment", booking ? "documents" : null][i];
    if (i === 0) go("home");
    else if (target) go(target);
  };

  const cta = {
    survey: { label: "Next: quotation", action: () => go("quote") },
    quote: { label: "Next: payment", action: () => go("payment") },
    payment: { label: "Simulate payment & confirm", action: confirmBooking, disabled: !ready, hint: !ready },
    pass: { label: "Next: documents", action: () => go("documents") },
    documents: { label: "Save as PDF", action: () => window.print() },
  }[step];

  const asideTotal = booking ? booking.total : step === "payment" ? price + premium : price;
  const asideTotalLabel = booking ? "Illustrative subtotal (simulated payment)" : step === "payment" ? "Illustrative subtotal" : "Estimated moving price*";
  const asideIns = booking ? money(booking.premium) : step === "payment" ? money(premium) : "Selected at checkout";

  return (
    <div className="flow">
      <StepHeader step={idx} onBack={() => go(prevRoute)} backLabel={prevLabel} onStep={goStep} canOpen={(i) => i < idx || (i === 4 && !!booking)} />

      <div className={`flow-body ${step === "pass" ? "wide" : ""}`}>
        <main className="flow-main">
          {step === "survey" && <SurveyStep survey={survey} info={info} onBack={() => go("home")} onNext={() => go("quote")} />}
          {step === "quote" && <QuoteStep info={info} onBack={() => go("survey")} onNext={() => go("payment")} />}
          {step === "payment" && (
            <PaymentStep info={info} pay={pay} setPay={setPay} ready={ready} onConfirm={confirmBooking} onBack={() => go("quote")} onEdit={() => go("home")} />
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
                <div className="route-line"><span /><b aria-hidden="true">✈</b><span /></div>
                <span className="route-days">{transit}*</span>
              </div>
              <div className="right"><div className="code">{info.toCode}</div><div className="route-name">{info.toName}</div></div>
            </div>
            <dl className="facts">
              <div><dt>Pickup</dt><dd>{info.dateShort}</dd></div>
              <div><dt>Shipment</dt><dd>{info.typeLabel}</dd></div>
              <div><dt>Volume</dt><dd>{info.volume} · {info.ft3}</dd></div>
              <div><dt>Shipping</dt><dd>{info.shipping}</dd></div>
            </dl>
            <dl className="facts sub">
              <div><dt>Origin office</dt><dd>{info.originOffice}</dd></div>
              <div><dt>Destination office</dt><dd>APAC Relocation India</dd></div>
            </dl>
            <dl className="facts sub">
              <div><dt>Moving services</dt><dd>{money(price)}</dd></div>
              <div><dt>Optional insurance</dt><dd>{asideIns}</dd></div>
            </dl>
            <div className="booking-total">
              <span>{asideTotalLabel}</span>
              <span className="total">{money(asideTotal)}</span>
            </div>
            <p className="booking-note">*Sample, to be confirmed by APAC Relocation. Rates and transit windows are not live confirmations.</p>
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
            <div className="small strong">{info.fromCode} ✈ {info.toCode} <span className="muted">· {info.dateShort} · {info.volume}</span></div>
            <div className="bar-price">{money(asideTotal)}</div>
          </div>
          <span className="muted tiny right">{asideTotalLabel}</span>
        </div>
        <button type="button" className="btn-big block" onClick={cta.action} disabled={cta.disabled}>
          {cta.label} <span aria-hidden="true">→</span>
        </button>
        {cta.hint && <div className="pay-hint center">Tick both boxes above to continue.</div>}
      </div>
    </div>
  );
}
