import { useState } from "react";
import { fieldUnit, formatDims, formatVolume, fromField, itemVolumeM3, toField } from "../lib/units";

const BADGES = {
  high: { label: "Measured", cls: "ok", hint: "Seen clearly from several angles" },
  medium: { label: "Check size", cls: "warn", hint: "Partly estimated, worth a quick check" },
  low: { label: "Estimate", cls: "bad", hint: "Seen briefly, please confirm the size" },
  manual: { label: "Added", cls: "neutral", hint: "Typical size for this item" },
};
const NAMES = ["Length", "Depth", "Height"];
const UNITS = "metric";

/**
 * One item in a room (v4 design): name, size and volume, confidence, and a
 * quantity stepper. Quantity zero removes it. "Edit size" opens L × D × H.
 */
export default function ItemRow({ item, onChange, onRemove }) {
  const [editing, setEditing] = useState(false);
  const badge = BADGES[item.confidence] || BADGES.manual;

  const setDim = (i, value) => {
    const v = Number(value);
    if (!Number.isFinite(v) || v <= 0) return;
    const dims = [...item.dims];
    dims[i] = fromField(v, UNITS);
    onChange({ dims, confidence: item.confidence === "manual" ? "manual" : "high", notes: [] });
  };

  return (
    <li className="irow">
      <div className="irow-main">
        <div className="irow-thumb">{item.thumbnail ? <img src={item.thumbnail} alt="" /> : null}</div>
        <div className="irow-text">
          <div className="irow-name">{item.label}</div>
          <div className="irow-meta">
            {formatDims(item.dims, UNITS)} · {formatVolume(itemVolumeM3(item), UNITS)}
            <button type="button" className="irow-edit" aria-expanded={editing} onClick={() => setEditing((e) => !e)}>
              {editing ? "Done" : "Edit size"}
            </button>
          </div>
        </div>
        <span className={`conf ${badge.cls}`} title={badge.hint}>{badge.label}</span>
        <div className="stepper">
          <button type="button" aria-label={`Fewer ${item.label}`} onClick={() => (item.qty <= 1 ? onRemove() : onChange({ qty: item.qty - 1 }))}>−</button>
          <span>{item.qty}</span>
          <button type="button" aria-label={`More ${item.label}`} onClick={() => onChange({ qty: item.qty + 1 })}>+</button>
        </div>
      </div>
      {editing && (
        <div className="irow-edit-box">
          {NAMES.map((name, i) => (
            <label key={name} className="f-label">
              {name} ({fieldUnit(UNITS)})
              <input type="number" inputMode="decimal" min={1} className="f-input" defaultValue={toField(item.dims[i], UNITS)} onBlur={(e) => setDim(i, e.target.value)} />
            </label>
          ))}
        </div>
      )}
    </li>
  );
}
