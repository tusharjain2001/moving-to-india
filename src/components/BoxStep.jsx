import { useState } from "react";
import { BOX_SIZES, boxCm, boxVolume } from "../lib/boxes";
import { M3_TO_FT3 } from "../lib/units";

const EMPTY = { size: "M", contents: "", weight: 5, qty: 1 };
const cft = (m3) => Math.round(m3 * M3_TO_FT3);

/**
 * Step 2 for "A few boxes" (as on the Malaysia page): no AI survey; the customer picks
 * a box size, types the contents, weight and quantity, and adds as many as needed.
 */
export default function BoxStep({ boxes, setBoxes, info, onBack, onNext }) {
  const [draft, setDraft] = useState(EMPTY);
  const count = boxes.reduce((n, b) => n + b.qty, 0);
  const kg = boxes.reduce((n, b) => n + b.qty * b.weight, 0);
  const qty = Math.max(1, Math.round(Number(draft.qty) || 0));

  const add = (e) => {
    e.preventDefault();
    if (!draft.contents.trim()) return;
    setBoxes([...boxes, { size: draft.size, contents: draft.contents.trim(), weight: Math.max(0, Number(draft.weight) || 0), qty }]);
    setDraft(EMPTY);
  };
  const remove = (i) => setBoxes(boxes.filter((_, x) => x !== i));

  return (
    <>
      <section className="volume">
        <div className="volume-main">
          <div className="volume-label">Shipment volume</div>
          <div className={`volume-big ${info.total === 0 ? "dim" : ""}`}>{info.total.toFixed(2)} m³</div>
          <div className="volume-sub">{info.ft3} · {count} box{count === 1 ? "" : "es"} · {kg} kg</div>
        </div>
      </section>

      <div className="rooms-head">
        <h1>Your boxes</h1>
        <span>Pick a size, describe the contents, and add as many as you need</span>
      </div>

      <form className="panel box-builder" onSubmit={add}>
        <fieldset className="box-sizes">
          <legend className="sr-only">Box size</legend>
          {Object.entries(BOX_SIZES).map(([key, b]) => (
            <label key={key} className={`box-size ${draft.size === key ? "on" : ""}`}>
              <input type="radio" name="box-size" checked={draft.size === key} onChange={() => setDraft({ ...draft, size: key })} />
              <span className="strong">{b.label}</span>
              <span className="small muted">{boxCm(key)}</span>
              <span className="small muted">{boxVolume(key).toFixed(2)} m³ · {cft(boxVolume(key))} cft each</span>
            </label>
          ))}
        </fieldset>
        <div className="box-fields">
          <label className="f-label box-contents">
            Contents
            <input className="f-input" maxLength={60} placeholder="e.g. Books, kitchenware" value={draft.contents} onChange={(e) => setDraft({ ...draft, contents: e.target.value })} />
          </label>
          <label className="f-label">
            Weight per box (kg)
            <input className="f-input" type="number" min="0" inputMode="decimal" value={draft.weight} onChange={(e) => setDraft({ ...draft, weight: e.target.value })} />
          </label>
          <label className="f-label">
            Quantity
            <input className="f-input" type="number" min="1" inputMode="numeric" value={draft.qty} onChange={(e) => setDraft({ ...draft, qty: e.target.value })} />
          </label>
          <button type="submit" className="btn-big box-add" disabled={!draft.contents.trim()}>+ Add box</button>
        </div>
      </form>

      <section className="panel">
        {boxes.length === 0 ? (
          <p className="rp-empty">No boxes added yet. Pick a size above, describe the contents, and add as many as you need.</p>
        ) : (
          <ul className="box-list">
            {boxes.map((b, i) => (
              <li key={i}>
                <span className="box-tag">{b.size}</span>
                <span className="grow">
                  <span className="strong">{BOX_SIZES[b.size].label} box: {b.contents}</span>
                  <span className="small muted block">× {b.qty} · {b.weight} kg each · {(b.qty * boxVolume(b.size)).toFixed(2)} m³ · {cft(b.qty * boxVolume(b.size))} cft</span>
                </span>
                <button type="button" className="link" onClick={() => remove(i)} aria-label={`Remove ${b.contents}`}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flow-nav">
        <button type="button" className="btn-out" onClick={onBack}>← Your move</button>
        <button type="button" className="btn-big only-desktop" onClick={onNext} disabled={boxes.length === 0}>Next: quotation <span aria-hidden="true">→</span></button>
      </div>
    </>
  );
}
