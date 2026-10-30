import { useEffect, useRef, useState } from "react";
import logo from "../assets/logo.png";
import { createPaymentIntent, deepGet, loadStripe } from "../api/moversly";
import { INDIA_IMPORT, SG_EXPORT } from "../data/content";
import { GENERAL_DOCS, TERMS, fmtDate, money } from "../lib/quote";

// Steps 3–5 of the v4 design: quotation, payment (Stripe), Move Pass, documents.

const Nav = ({ backLabel, onBack, nextLabel, onNext, nextDisabled }) => (
  <div className="flow-nav noprint">
    <button type="button" className="btn-out" onClick={onBack}>← {backLabel}</button>
    {onNext && <button type="button" className="btn-big only-desktop" onClick={onNext} disabled={nextDisabled}>{nextLabel} <span aria-hidden="true">→</span></button>}
  </div>
);

const NO_PRICE = {
  origin: "Online prices are for moves from Singapore for now. Our team will send your quotation for a move from Malaysia.",
  city: "We don't have an online price for this city yet. Our team will send your quotation.",
  volume: "Your move is larger than our online price list. Our team will send your quotation.",
};

const SHIP_TEXT = {
  Console: ["Shared container (Console)", "Lower price. Your goods share a container with other moves, so shipping takes longer."],
  "20' FCL": ["Your own 20-foot container (20' FCL)", "Faster. The container is only for your goods and ships as soon as it is packed."],
  "40' FCL": ["Your own 40-foot container (40' FCL)", "The container is only for your goods and ships as soon as it is packed."],
};

// The price split from the sales sheet (origin, freight, destination and margin rows).
const BREAKDOWN = [
  ["origin", "Origin charges", "Packing, pickup and transport to the port"],
  ["freight", "Freight charges", "Sea freight to"],
  ["destination", "Destination charges", "Customs clearance, delivery to your home and GST"],
  ["margin", "Margin", ""],
];

/* ── Step 3: quotation ─────────────────────────────────── */
function PricePanel({ info }) {
  const { quote, price, pricing } = info;
  if (info.total === 0)
    return (
      <section className="panel panel-pad-sm">
        <p className="rp-alert">Scan or add at least one room first, so we can price your move.</p>
      </section>
    );
  if (pricing.error)
    return (
      <section className="panel panel-pad-sm">
        <p className="rp-alert" role="alert">{pricing.error}</p>
        <button type="button" className="btn-out mt14" onClick={info.retry}>Try again</button>
      </section>
    );
  if (!quote)
    return (
      <section className="panel panel-pad-sm">
        <p className="small muted">Saving your inventory and getting your price…</p>
      </section>
    );
  const options = quote.options || [];
  const breakdown = price != null ? quote.breakdown : null;
  return (
    <section className="panel">
      <dl className="price-list">
        <div><dt>Confirmed inventory volume (customer-edited)</dt><dd>{info.volume} · {quote.cft} CFT</dd></div>
        {price != null && <div><dt>Rate band</dt><dd>{quote.type} · {quote.band}</dd></div>}
        {price != null && !breakdown && <div><dt>Door-to-door moving services</dt><dd>{money(price)}</dd></div>}
      </dl>
      {options.length > 1 && (
        <fieldset className="ship-opts">
          <legend className="strong">Your volume fits two ways to ship. Choose one:</legend>
          {options.map((o) => {
            const [title, sub] = SHIP_TEXT[o.type] || [o.type, ""];
            return (
              <label key={o.type} className={`ship-opt ${o.type === quote.type ? "on" : ""}`}>
                <input type="radio" name="ship-opt" checked={o.type === quote.type} onChange={() => info.choose(o.type)} />
                <span className="grow">
                  <span className="strong">{title}</span>
                  <span className="small muted block">{sub}</span>
                </span>
                <span className="strong nowrap">{money(o.price)}</span>
              </label>
            );
          })}
        </fieldset>
      )}
      {breakdown && (
        <dl className="price-list breakdown">
          {BREAKDOWN.map(([key, title, sub]) => (
            <div key={key}>
              <dt>
                {title}
                {sub && <span className="small muted block">{key === "freight" ? `${sub} ${quote.port || "India"}` : sub}</span>}
              </dt>
              <dd>{money(breakdown[key] || 0)}</dd>
            </div>
          ))}
        </dl>
      )}
      {price != null ? (
        <div className="price-total">
          <span>Moving price</span>
          <span className="big-money">{money(price)}</span>
        </div>
      ) : (
        <p className="doc-missing">{NO_PRICE[quote.reason]}</p>
      )}    </section>
  );
}

export function QuoteStep({ info, onBack, onNext, nextLabel, nextDisabled }) {
  const [termsOpen, setTermsOpen] = useState(false);
  const schedule = [
    ["Pickup", info.dateLong],
    ["Export", "After pickup and export clearance"],
    ["Transit", `Approx. ${info.transit}*`],
    ["Delivery", "Appointment after arrival and customs release"],
  ];
  return (
    <>
      <div className="step-title">
        <h1>Your door-to-door moving <span className="accent-text">quotation</span></h1>
        <div className="step-sub">
          {info.fromName} → {info.toName}
          <span className="chip-tint">Instant quotation</span>
        </div>
      </div>

      <section className="panel">
        <div className="trip">
          <div>
            <div className="trip-k">Pickup · {info.dateShort}</div>
            <div className="trip-code">{info.fromCode}</div>
            <div className="trip-name">{info.fromName}</div>
          </div>
          <div className="trip-mid">
            <span className="strong small">Approx. {info.transit}*</span>
            <div className="route-line big"><span /><b aria-hidden="true">✈</b><span /></div>
            <span className="tiny muted">Door to door · ocean freight</span>
          </div>
          <div className="right">
            <div className="trip-k">Delivery after release</div>
            <div className="trip-code">{info.toCode}</div>
            <div className="trip-name">{info.toName}</div>
          </div>
        </div>
        <div className="panel-pad">
          <h2 className="h-17">Shipment and delivery schedule</h2>
          <ol className="schedule">
            {schedule.map(([t, b], i) => (
              <li key={t}>
                <span className={`sched-n ${i === 0 ? "on" : ""}`}>{i + 1}</span>
                <span className="strong">{t}</span>
                <span className="small muted">{b}</span>
              </li>
            ))}
          </ol>
          <p className="fine">*Sample transit window, to be confirmed by APAC Relocation. Exact dates depend on sailing, customs, capacity and access.</p>
        </div>
      </section>

      <div className="two-cards">
        <div className="panel panel-pad-sm">
          <div className="caps">Origin office</div>
          <div className="office-name">{info.originOffice}</div>
          <div className="small muted">{info.fromSG ? "Singapore" : "Malaysia"} · packing, collection, export handling and agreed freight coordination</div>
        </div>
        <div className="panel panel-pad-sm">
          <div className="caps">Destination office</div>
          <div className="office-name">APAC Relocation India</div>
          <div className="small muted">India · import coordination, Transfer of Residence paperwork, delivery and agreed unpacking</div>
        </div>
      </div>

      <div className="tint-box">
        <div className="strong">One contracting provider: APAC Relocation</div>
        <div className="small">
          APAC Relocation is the proposed contracting party for the complete door-to-door service, through its own offices in
          Singapore, Malaysia and India, subject to the signed contract.
        </div>
      </div>

      <PricePanel info={info} />

      <div className="two-cards">
        <div className="panel panel-pad-sm">
          <div className="strong ok-text">✓ Included:</div>
          <p className="small muted mt8">origin packing and pickup, export coordination, ocean freight arrangement, destination clearance coordination, local delivery and standard unpacking.</p>
        </div>
        <div className="panel panel-pad-sm">
          <div className="strong warn-text">– Not included unless expressly quoted:</div>
          <p className="small muted mt8">government duties and taxes, inspections, storage, unusual access or hoisting, parking permits, demurrage, special handling, optional insurance and other specified surcharges.</p>
        </div>
      </div>

      <section className="panel">
        <button type="button" className="terms-btn" aria-expanded={termsOpen} onClick={() => setTermsOpen(!termsOpen)}>
          Quotation terms and conditions<span aria-hidden="true">{termsOpen ? "–" : "+"}</span>
        </button>
        {termsOpen && <ul className="terms">{TERMS.map((t) => <li key={t}>{t}</li>)}</ul>}
      </section>

      <Nav backLabel="Edit survey" onBack={onBack} nextLabel={nextLabel} onNext={onNext} nextDisabled={nextDisabled} />
    </>
  );
}

/* ── Step 4: payment (Stripe, as in the Malaysia project) ── */
// payment-intent on api.moversly.com returns a Stripe clientSecret; card and
// PayNow are completed in-page with Stripe's Payment Element. One payment intent
// per order and amount: opening the payment page again reuses it, so Stripe
// doesn't collect a new unfinished payment on every visit.
const intents = new Map();
function paymentIntentFor({ orderId, email, name, amount }) {
  const key = `${orderId}:${amount}`;
  if (!intents.has(key)) {
    intents.set(key, createPaymentIntent({ orderId, email, name, amount }).catch((e) => {
      intents.delete(key);
      throw e;
    }));
  }
  return intents.get(key);
}

function useStripePayment({ orderId, email, name, amount, onPaid }) {
  const [state, setState] = useState({ ready: false, error: "", processing: false });
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const mountRef = useRef(null);

  useEffect(() => {
    // Back from a bank or 3-D Secure page: Stripe adds the result to the URL.
    const params = new URLSearchParams(window.location.search);
    if (params.get("redirect_status") === "succeeded") {
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
      onPaid(params.get("payment_intent"));
      return;
    }
    if (amount == null) return;
    let alive = true;
    let element = null;
    (async () => {
      try {
        const stripe = await loadStripe(); // first, so no payment is opened if Stripe can't load
        const res = await paymentIntentFor({ orderId, email, name, amount });
        const secret = deepGet(res, ["clientSecret", "client_secret"]);
        if (!secret) throw new Error("The server didn't return a payment session. Please try again.");
        if (!alive) return;
        stripeRef.current = stripe;
        elementsRef.current = stripe.elements({ clientSecret: secret, appearance: { variables: { colorPrimary: "#067878", borderRadius: "10px" } } });
        element = elementsRef.current.create("payment", { paymentMethodOrder: ["card", "paynow"] });
        element.on("ready", () => alive && setState((s) => ({ ...s, ready: true })));
        element.mount(mountRef.current);
      } catch (e) {
        if (alive) setState((s) => ({ ...s, error: e.message || "Could not start the payment. Please try again." }));
      }
    })();
    return () => {
      alive = false;
      element?.destroy();
    };
    // One payment session per order and amount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, amount]);

  const pay = async () => {
    if (state.processing || !stripeRef.current || !elementsRef.current) return;
    setState((s) => ({ ...s, processing: true, error: "" }));
    try {
      const { error, paymentIntent } = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        confirmParams: { return_url: window.location.href },
        redirect: "if_required",
      });
      if (error) throw new Error(error.message);
      if (!["succeeded", "processing", "requires_capture"].includes(paymentIntent?.status)) throw new Error("Payment wasn't completed. Please try again.");
      onPaid(paymentIntent.id);
    } catch (e) {
      setState((s) => ({ ...s, processing: false, error: e.message || "Payment failed. Please try again." }));
    }
  };

  return { ...state, mountRef, pay };
}

export function PaymentStep({ info, agreed, setAgreed, onPaid, onBack, onEdit }) {
  const stripe = useStripePayment({ orderId: info.orderId, email: info.v.email, name: info.v.name, amount: info.price, onPaid });
  const initials = info.v.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  const agreements = [
    ["reviewed", "I have reviewed the quotation scope, exclusions, schedule estimates, cancellation terms and APAC Relocation contractual responsibility."],
    ["understood", "I understand cargo insurance is not included and is separate from APAC Relocation's contractual obligations."],
  ];
  const ticked = agreed.reviewed && agreed.understood;

  if (info.price == null)
    return (
      <>
        <div className="step-title"><h1>Review &amp; book your <span className="accent-text">move</span></h1></div>
        <section className="panel panel-pad-sm">
          <p className="doc-missing">Open your quotation first: it prices your move from your AI survey.</p>
          <button type="button" className="btn-out mt14" onClick={onBack}>← Quotation</button>
        </section>
      </>
    );

  return (
    <>
      <div className="step-title">
        <h1>Review &amp; book your <span className="accent-text">move</span></h1>
        <p className="step-sub">One secure payment to APAC Relocation, by card or PayNow.</p>
      </div>

      <section className="panel who">
        <span className="initials" aria-hidden="true">{initials}</span>
        <div className="who-text">
          <div><b>{info.v.name}</b> · {info.v.email}</div>
          <div className="muted">{info.fromName} → {info.toName} · {info.volume}</div>
          <div className="muted">Pickup requested: {info.dateLong}</div>
        </div>
        <button type="button" className="link" onClick={onEdit}>Edit</button>
      </section>

      <section className="panel">
        <dl className="price-list">
          <div><dt>Door-to-door moving services</dt><dd>{money(info.price)}</dd></div>
          <div className="soft"><dt>{info.quote.type} · {info.quote.band}</dt><dd>{info.volume}</dd></div>
        </dl>
        <div className="price-total">
          <span>Total to pay</span>
          <span className="big-money">{money(info.price)}</span>
        </div>
      </section>

      <section className="panel agree">
        {agreements.map(([k, text]) => {
          const other = k === "reviewed" ? agreed.understood : agreed.reviewed;
          return (
            <label key={k} className={`agree-row ${!agreed[k] && other ? "attention" : ""}`}>
              <input type="checkbox" checked={agreed[k]} onChange={() => setAgreed((a) => ({ ...a, [k]: !a[k] }))} />
              <span>{text}</span>
            </label>
          );
        })}
      </section>

      <section className="panel panel-pad-sm">
        {!stripe.ready && !stripe.error && <p className="small muted">Loading secure payment…</p>}
        <div ref={stripe.mountRef} />
        {stripe.error && <p className="rp-alert mt14" role="alert">{stripe.error}</p>}
      </section>

      <div className="pay-nav">
        <button type="button" className="btn-out only-desktop" onClick={onBack}>← Quotation</button>
        <div className="pay-cta">
          <button type="button" className="btn-pay" disabled={!ticked || !stripe.ready || stripe.processing} onClick={stripe.pay}>
            {stripe.processing ? "Processing…" : `Pay ${money(info.price)}`}
          </button>
          {!ticked && <span className="pay-hint">Tick both boxes above to continue.</span>}
        </div>
      </div>
    </>
  );
}

/* ── Booked: Move Pass ─────────────────────────────────── */
export function PassStep({ info, onBack, onNext }) {
  const b = info.booking;
  const facts = [
    ["Name", info.v.name],
    ["Booking ref", b.ref],
    ["Pickup date", info.dateShort],
    ["Volume", `${info.volume} · ${info.ft3}`],
    ["Shipment", info.typeLabel],
    ["Shipping", info.shipping],
  ];
  return (
    <div className="pass-wrap">
      <article className="pass" aria-label="Move Pass">
        <div className="pass-top">
          <div className="between">
            <img src={logo} alt="APAC Relocation" className="pass-logo" />
            <span className="pass-k">MOVE PASS</span>
          </div>
          <div className="pass-route">
            <div><div className="pass-small">From</div><div className="pass-code">{info.fromCode}</div><div className="pass-small mt6">{info.fromName}</div></div>
            <div className="pass-mid">
              <div className="route-line light"><span /><b aria-hidden="true">✈</b><span /></div>
              <span className="pass-small strong">{info.transit}*</span>
            </div>
            <div className="right"><div className="pass-small">To</div><div className="pass-code">{info.toCode}</div><div className="pass-small mt6">{info.toName}</div></div>
          </div>
        </div>
        <div className="pass-body">
          <dl className="pass-facts">
            {facts.map(([l, val]) => <div key={l}><dt>{l}</dt><dd>{val}</dd></div>)}
            <div className="full"><dt>Offices</dt><dd>{info.originOffice} → APAC Relocation India <span className="muted">· one contract</span></dd></div>
          </dl>
        </div>
        <div className="pass-tear" aria-hidden="true"><span /></div>
        <div className="pass-foot">
          <div className="caps">{b.paid ? "Paid" : "Price"}</div>
          <div className="pass-total">{b.paid ? money(b.total) : "To be quoted"}</div>
          <div className="ok-text tiny strong mt6">{b.paid ? "✓ Confirmed · payment received" : "✓ Quote request received"}</div>
        </div>
      </article>

      <div className="pass-text">
        <span className="ok-chip">{b.paid ? "✓ Booking confirmed" : "✓ Request received"}</span>
        <h1 className="pass-h1">
          {b.paid ? <>Your move to India is <span className="accent-text">booked</span></> : <>Your quote is <span className="accent-text">on its way</span></>}
        </h1>
        <p className="step-sub">
          {b.paid
            ? `Thank you, your payment is received. Our India office will contact you at ${info.v.email} to plan your pickup.`
            : `Our team has your inventory and will send your quotation to ${info.v.email}.`}
        </p>
        <dl className="panel pass-list">
          <div><dt>Booking reference</dt><dd className="strong">{b.ref}</dd></div>
          {b.paid && <div><dt>Amount paid</dt><dd className="strong accent-text">{money(b.total)}</dd></div>}
        </dl>
        <div className="noprint mt14"><button type="button" className="btn-out" onClick={() => window.print()}>Print or save PDF</button></div>
        <p className="tint-box mt24">Next, check the documents you need for customs. Our India office will contact you to confirm your pickup date.</p>
        <div className="noprint pass-nav only-desktop">
          <button type="button" className="btn-out" onClick={onBack}>← Quotation</button>
          <button type="button" className="btn-big" onClick={onNext}>Next: documents <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </div>
  );
}

/* ── Step 5: documents ─────────────────────────────────── */
function Extras({ summary }) {
  const boxes = [
    ["Duty relief", summary.dutyFree, "ok"],
    ["Restricted or special paperwork", summary.restricted, "bad"],
    ["Good to know", summary.notes, "info"],
  ].filter(([, items]) => items.length);
  if (!boxes.length) return null;
  return (
    <div className="extras">
      {boxes.map(([label, items, cls]) => (
        <div key={label} className={`extra ${cls}`}>
          <div className="extra-k">{label}</div>
          <ul>{items.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}

function DocCard({ kicker, title, items, count, summary, updated, missing }) {
  return (
    <section className="panel doc-card">
      <header className="doc-head">
        <div className="grow"><div className="caps">{kicker}</div><h3>{title}</h3></div>
        {count && <span className="small muted strong">{count}</span>}
      </header>
      {missing && <p className="doc-missing">{missing}</p>}
      {items.length > 0 && (
        <ul className="doc-list">
          {items.map((i) => <li key={i}><span className="box" aria-hidden="true" />{i}</li>)}
        </ul>
      )}
      {summary && <Extras summary={summary} />}
      <p className="doc-updated">{updated}</p>
    </section>
  );
}

export function DocsStep({ info, onBack }) {
  const v = info.v;
  const docCount = GENERAL_DOCS.length + (info.fromSG ? SG_EXPORT.documents.length : 0) + INDIA_IMPORT.documents.length;
  return (
    <>
      <div className="step-title">
        <h1>Your move <span className="accent-text">summary</span></h1>
        <div className="step-sub people"><span>{v.name}</span><span>{v.email}</span><span>{v.phone}</span></div>
      </div>

      <section className="sum-hero">
        <div className="sum-route">
          <div><div className="caps light">From</div><div className="sum-place">{info.fromName}</div></div>
          <span className="sum-plane" aria-hidden="true">✈</span>
          <div className="right"><div className="caps light">To</div><div className="sum-place">{info.toName}</div></div>
        </div>
        <div className="sum-sub">{info.typeLabel} · moving {info.dateLong}</div>
        <div className="sum-foot">
          <div>
            <div className="sum-sub">Shipment volume</div>
            <div className="sum-vol">{info.volume}</div>
            <div className="sum-sub">{info.ft3} · {info.itemCount} items</div>
          </div>
          <div className="sum-ship"><div className="caps">Suggested shipping</div><div className="strong">{info.shipping}</div></div>
        </div>
      </section>

      <div className="docs-head">
        <div>
          <h2>Documents you will need</h2>
          <p className="small muted">Based on the customs rules for leaving {info.fromSG ? "Singapore" : "Malaysia"} and arriving in India.</p>
        </div>
        <span className="count-chip">{docCount} documents</span>
      </div>

      <DocCard kicker="EVERY MOVE" title="For every international move" items={GENERAL_DOCS} count={`${GENERAL_DOCS.length} documents`} updated="General checklist" />
      {info.fromSG ? (
        <DocCard kicker="EXPORT" title="Leaving Singapore" items={SG_EXPORT.documents} count={`${SG_EXPORT.documents.length} document`} summary={SG_EXPORT} updated={`FIDI guide updated ${SG_EXPORT.updated}`} />
      ) : (
        <DocCard
          kicker="EXPORT"
          title="Leaving Malaysia"
          items={[]}
          missing="We don't have a customs summary for Malaysia yet. Our team will send you the full checklist with your quote."
          updated="Checklist to follow"
        />
      )}
      <DocCard kicker="IMPORT" title="Arriving in India" items={INDIA_IMPORT.documents} count={`${INDIA_IMPORT.documents.length} documents`} summary={INDIA_IMPORT} updated={`FIDI guide updated ${INDIA_IMPORT.updated}`} />

      <div className="flow-nav noprint">
        <button type="button" className="btn-out" onClick={onBack}>← Move Pass</button>
        <button type="button" className="btn-big" onClick={() => window.print()}>Save as PDF</button>
      </div>
      <div className="disclaimers">
        <p>These summaries are for information only. Customs rules change, so please confirm the exact requirements with your mover or customs broker before shipping.</p>
        <p>We provide access to the FIDI Customs Guides, developed by FIDI as an informational resource. Our company is not affiliated with FIDI and is not FAIM certified.</p>
        <p className="print-only">Printed {fmtDate(new Date().toISOString().slice(0, 10))}.</p>
      </div>
    </>
  );
}
