import { useCallback, useEffect, useRef, useState } from "react";
import { getCatalog } from "../api/survey";
import { formatVolume, roomVolume } from "../lib/units";
import CameraRecorder from "./CameraRecorder";
import Icon from "./Icons";
import ItemRow from "./ItemRow";

const TIPS = [
  "Walk slowly around the room",
  "Keep each item fully in view for a moment",
  "Include a door — it calibrates the size",
  "Point slightly down so the floor is visible",
];

/** One room, opened inline in place of the room grid (v4 design). */
export default function RoomSheet({ room, survey, onClose }) {
  const [camera, setCamera] = useState(false);
  const [adding, setAdding] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const fileRef = useRef(null);

  useEffect(() => {
    if (adding && !catalog.length) getCatalog().then(setCatalog);
  }, [adding, catalog.length]);

  const busy = room.status === "uploading" || room.status === "processing";
  const count = room.items.reduce((n, it) => n + it.qty, 0);
  const meta =
    room.status === "done" || room.items.length
      ? `${count} item${count === 1 ? "" : "s"} · ${formatVolume(roomVolume(room), "metric")}`
      : busy ? "Measuring…" : "Not recorded yet";

  const onVideo = useCallback(
    (video, filename) => {
      setCamera(false);
      survey.scanRoom(room.id, video, filename);
    },
    [room.id, survey],
  );
  // eslint-disable-next-line no-unused-vars -- kept for when upload is turned back on
  const openPicker = useCallback(() => {
    setCamera(false);
    fileRef.current?.click();
  }, []);
  // Without upload, a browser that can't record shows a message instead of the file picker.
  const [noCamera, setNoCamera] = useState("");
  const cameraUnsupported = useCallback(() => {
    setCamera(false);
    setNoCamera("This browser can't record video. Please open this page on your phone to record the room.");
  }, []);

  return (
    <section className="room-panel" aria-labelledby="room-title">
      <div className="rp-head">
        <button type="button" className="rp-back" onClick={onClose} aria-label="Back to rooms">
          <Icon name="arrowLeft" size={18} strokeWidth={2.2} />
        </button>
        <div className="rp-title">
          <h2 id="room-title">{room.name}</h2>
          <div className="muted small">{meta}</div>
        </div>
        {room.status === "done" && (
          <button type="button" className="btn-line" onClick={() => survey.resetRoom(room.id)}>{room.manual ? "Start over" : "Rescan"}</button>
        )}
      </div>

      {(room.status === "empty" || room.status === "error") && (
        <div className="rp-pad stack">
          {room.status === "error" && <p className="rp-alert" role="alert">{room.error}</p>}
          <button type="button" className="choice primary" onClick={() => setCamera(true)}>
            <span className="choice-icon"><span className="rec-dot" /></span>
            <span><span className="choice-t">Record the room</span><span className="choice-s">Walk around slowly for 20–60 seconds</span></span>
          </button>
          <button type="button" className="choice" aria-expanded={adding} onClick={() => setAdding(true)}>
            <span className="choice-icon soft"><Icon name="plus" size={22} strokeWidth={2} /></span>
            <span><span className="choice-t">Add items without recording</span><span className="choice-s">Pick your furniture from a list, then check the sizes</span></span>
          </button>
          {adding && <AddBox catalog={catalog} onPick={(c) => survey.addItem(room.id, c)} onClose={() => setAdding(false)} />}
          {/* Upload turned off for now: recording only. Uncomment to bring it back
              (and use openPicker again as the camera fallback below).
          <button type="button" className="choice" onClick={openPicker}>
            <span className="choice-icon soft"><Icon name="upload" size={22} strokeWidth={2} /></span>
            <span><span className="choice-t">Upload a video</span><span className="choice-s">From your gallery or files</span></span>
          </button>
          */}
          {noCamera && <p className="rp-alert" role="alert">{noCamera}</p>}
          <div className="tips">
            <div className="caps">For the best result</div>
            <ul>{TIPS.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>
      )}

      {busy && <Progress room={room} onClose={onClose} />}

      {room.status === "done" && (
        <>
          {room.calibration && (
            <p className="rp-calib">
              {room.calibration.method === "none"
                ? "Tip: include a door in the video next time. It lets the AI calibrate sizes precisely."
                : `Sizes calibrated using a ${room.calibration.method} (standard size).`}
            </p>
          )}
          {room.items.length === 0 && (
            <p className="rp-empty">
              {room.manual ? "No items yet. Add your furniture below." : "No furniture found in this video. Record again with better light, or add items yourself."}
            </p>
          )}
          <ul className="irows">
            {room.items.map((it) => (
              <ItemRow
                key={it.id}
                item={it}
                onChange={(f) => survey.updateItem(room.id, it.id, f)}
                onRemove={() => survey.removeItem(room.id, it.id)}
              />
            ))}
          </ul>
          <div className="rp-pad">
            {adding ? (
              <AddBox catalog={catalog} onPick={(c) => survey.addItem(room.id, c)} onClose={() => setAdding(false)} />
            ) : (
              <button type="button" className="dashed" onClick={() => setAdding(true)}>
                {room.manual ? "+ Add more items" : "+ Add an item the camera missed (boxes, lamps…)"}
              </button>
            )}
          </div>
          <div className="rp-foot">
            <span className="muted small">Check each item. Change a quantity to zero to remove it.</span>
            <button type="button" className="btn-solid" onClick={onClose}>Done</button>
          </div>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) survey.scanRoom(room.id, f, f.name);
          e.target.value = "";
        }}
      />
      {camera && <CameraRecorder roomName={room.name} onDone={onVideo} onCancel={() => setCamera(false)} onUnsupported={cameraUnsupported} />}
    </section>
  );
}

/**
 * Pick items from the catalog (typical sizes), or type any other item with its size.
 * Stays open so several items can be added in a row; each one appears in the room's list.
 */
function AddBox({ catalog, onPick, onClose }) {
  const [other, setOther] = useState({ name: "", l: "", w: "", h: "" });
  const dims = [other.l, other.w, other.h].map((v) => Number(v) / 100);
  const otherOk = other.name.trim() && dims.every((d) => d > 0);
  const addOther = (e) => {
    e.preventDefault();
    if (!otherOk) return;
    onPick({ key: "other", label: other.name.trim(), typical: dims });
    setOther({ name: "", l: "", w: "", h: "" });
  };
  return (
    <div className="add-box">
      <div className="between"><span className="strong">Add an item</span><button type="button" className="link" onClick={onClose}>Close</button></div>
      <div className="chips">
        {catalog.length === 0 && <span className="muted small">Loading items…</span>}
        {catalog.map((c) => (
          <button type="button" key={c.key} onClick={() => onPick(c)}>{c.label}</button>
        ))}
      </div>
      <form className="other-item" onSubmit={addOther}>
        <div className="small strong">Something else?</div>
        <div className="other-fields">
          <input className="f-input other-name" maxLength={60} placeholder="Item, e.g. Piano" aria-label="Item name" value={other.name} onChange={(e) => setOther({ ...other, name: e.target.value })} />
          {[["l", "Length"], ["w", "Width"], ["h", "Height"]].map(([k, label]) => (
            <input key={k} className="f-input" type="number" min="1" inputMode="numeric" placeholder={`${label} cm`} aria-label={`${label} in cm`} value={other[k]} onChange={(e) => setOther({ ...other, [k]: e.target.value })} />
          ))}
          <button type="submit" className="btn-line" disabled={!otherOk}>Add</button>
        </div>
      </form>
    </div>
  );
}

function Progress({ room, onClose }) {
  const uploading = room.status === "uploading";
  // Upload is the first 15% of the bar, analysis the rest.
  const pct = Math.round(uploading ? room.progress * 15 : 15 + room.progress * 85);
  return (
    <div className="rp-busy">
      <span className="spinner" aria-hidden="true" />
      <div className="strong lg">{uploading ? "Uploading your video" : "AI is measuring every item"}</div>
      <div className="muted small narrow">
        {uploading
          ? "Keep this page open until the upload finishes."
          : `${room.stage || "Finding furniture"}. The first room after a quiet spell can take about a minute while the AI starts.`}
      </div>
      <div className="busy-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="small strong accent">{pct}%</div>
      {!uploading && <button type="button" className="btn-line" onClick={onClose}>Scan another room meanwhile</button>}
    </div>
  );
}
