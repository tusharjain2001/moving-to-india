import { useState } from "react";
import logo from "../assets/logo.png";
import { INDIA_IMPORT, SG_EXPORT } from "../data/content";
import { GENERAL_DOCS, TERMS, fmtDate, money } from "../lib/quote";

// Steps 3–5 of the v4 design: quotation, payment (simulation), Move Pass, documents.

const Nav = ({ backLabel, onBack, nextLabel, onNext }) => (
  <div className="flow-nav noprint">
    <button type="button" className="btn-out" onClick={onBack}>← {backLabel}</button>
    {onNext && <button type="button" className="btn-big only-desktop" onClick={onNext}>{nextLabel} <span aria-hidden="true">→</span></button>}
  </div>
);

/* ── Step 3: quotation ─────────────────────────────────── */
export function QuoteStep({ info, onBack, onNext }) {
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
          <span className="chip-tint">Illustrative instant estimate</span>
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

      <section className="panel">
        <dl className="price-list">
          <div><dt>Confirmed inventory volume (customer-edited)</dt><dd>{info.volume}</dd></div>
          <div><dt>Illustrative door-to-door moving services</dt><dd>{money(info.price)}</dd></div>
          <div className="soft"><dt>Optional insurance</dt><dd>Selected at checkout</dd></div>
        </dl>
        <div className="price-total">
          <span>Estimated moving price*</span>
          <span className="big-money">{money(info.price)}</span>
        </div>
      </section>

      <div className="two-cards">
        <div className="panel panel-pad-sm">
          <div className="strong ok-text">✓ Included in this example:</div>
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

      <Nav backLabel="Edit survey" onBack={onBack} nextLabel="Next: payment" onNext={onNext} />
    </>
  );
}

/* ── Step 4: payment (simulation) ──────────────────────── */
export function PaymentStep({ info, pay, setPay, ready, onConfirm, onBack, onEdit }) {
  const set = (k, val) => setPay((p) => ({ ...p, [k]: val }));
  const initials = info.v.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  const agreements = [
    ["reviewed", "I have reviewed the quotation scope, exclusions, schedule estimates, cancellation terms and APAC Relocation contractual responsibility."],
    ["understood", "I understand optional cargo insurance is separate from APAC Relocation's contractual obligations and is subject to actual insurer policy terms."],
  ];
  return (
    <>
      <div className="step-title">
        <div className="title-row">
          <h1>Review &amp; book your <span className="accent-text">move</span></h1>
          <span className="sim-badge">SIMULATION</span>
        </div>
        <p className="step-sub">One payment to APAC Relocation. No card details are collected and no money moves.</p>
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

      <div className="caps extras-k">Extras</div>
      <section className={`panel panel-pad-sm ins ${pay.insured ? "on" : ""}`}>
        <div className="ins-row">
          <div className="grow">
            <div className="h-17">Add shipment insurance at 3% of declared value</div>
            <div className="small muted mt6">Opt-in only. A real purchase requires approved insurer, coverage details, exclusions, deductible, policy document and any required disclosures.</div>
          </div>
          <button type="button" role="switch" aria-checked={pay.insured} aria-label="Add shipment insurance" className={`switch ${pay.insured ? "on" : ""}`} onClick={() => set("insured", !pay.insured)}>
            <span />
          </button>
        </div>
        {pay.insured && (
          <div className="ins-value">
            <label className="declared">
              Declared value of your goods
              <span className="declared-box">
                <span className="muted">SGD</span>
                <input type="number" min="0" step="100" inputMode="numeric" placeholder="20000" value={pay.declared} onChange={(e) => set("declared", e.target.value)} />
              </span>
            </label>
            <p className="small muted">Premium <b className="ink">{money(info.premium)}</b></p>
          </div>
        )}
      </section>

      <section className="panel">
        <dl className="price-list">
          <div><dt>Moving services</dt><dd>{money(info.price)}</dd></div>
          <div><dt>Optional insurance premium</dt><dd>{money(info.premium)}</dd></div>
        </dl>
        <div className="price-total">
          <span>Illustrative subtotal</span>
          <span className="big-money">{money(info.price + info.premium)}</span>
        </div>
        <p className="sim-note">Not a final payable total: taxes, duties and other applicable fees are not calculated. No real payment will be taken in this simulation.</p>
      </section>

      <section className="panel agree">
        {agreements.map(([k, text]) => {
          const other = k === "reviewed" ? pay.understood : pay.reviewed;
          return (
            <label key={k} className={`agree-row ${!pay[k] && other ? "attention" : ""}`}>
              <input type="checkbox" checked={pay[k]} onChange={() => set(k, !pay[k])} />
              <span>{text}</span>
            </label>
          );
        })}
      </section>

      <div className="pay-nav only-desktop">
        <button type="button" className="btn-out" onClick={onBack}>← Quotation</button>
        <div className="pay-cta">
          <button type="button" className="btn-pay" disabled={!ready} onClick={onConfirm}>Simulate payment &amp; confirm booking</button>
          {!ready && <span className="pay-hint">Tick both boxes above to continue.</span>}
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
          <div className="caps">Total</div>
          <div className="pass-total">{money(b.total)}</div>
          <div className="ok-text tiny strong mt6">✓ Confirmed · simulated payment</div>
        </div>
      </article>

      <div className="pass-text">
        <span className="ok-chip">✓ Booking confirmed</span>
        <h1 className="pass-h1">Your move to India is <span className="accent-text">booked</span></h1>
        <p className="step-sub">Simulated payment only. No money was taken. In the live version, a confirmation is sent to {info.v.email}.</p>
        <dl className="panel pass-list">
          <div><dt>Booking reference</dt><dd className="strong">{b.ref}</dd></div>
          <div><dt>Optional insurance premium</dt><dd>{money(b.premium)}</dd></div>
          <div><dt>Illustrative subtotal</dt><dd className="strong accent-text">{money(b.total)}</dd></div>
        </dl>
        <div className="noprint mt14"><button type="button" className="btn-out" onClick={() => window.print()}>Print or save PDF</button></div>
        <p className="tint-box mt24">Next, check the documents you need for customs. Our India office will contact you to confirm the final price and pickup date.</p>
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
