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
  const openPicker = useCallback(() => {
    setCamera(false);
    fileRef.current?.click();
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
          <button type="button" className="btn-line" onClick={() => survey.resetRoom(room.id)}>Rescan</button>
        )}
      </div>

      {(room.status === "empty" || room.status === "error") && (
        <div className="rp-pad stack">
          {room.status === "error" && <p className="rp-alert" role="alert">{room.error}</p>}
          <button type="button" className="choice primary" onClick={() => setCamera(true)}>
            <span className="choice-icon"><span className="rec-dot" /></span>
            <span><span className="choice-t">Record the room</span><span className="choice-s">Walk around slowly for 20–60 seconds</span></span>
          </button>
          <button type="button" className="choice" onClick={openPicker}>
            <span className="choice-icon soft"><Icon name="upload" size={22} strokeWidth={2} /></span>
            <span><span className="choice-t">Upload a video</span><span className="choice-s">From your gallery or files</span></span>
          </button>
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
            <p className="rp-empty">No furniture found in this video. Record again with better light, or add items yourself.</p>
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
              <div className="add-box">
                <div className="between"><span className="strong">Add an item</span><button type="button" className="link" onClick={() => setAdding(false)}>Close</button></div>
                <div className="chips">
                  {catalog.length === 0 && <span className="muted small">Loading items…</span>}
                  {catalog.map((c) => (
                    <button type="button" key={c.key} onClick={() => { survey.addItem(room.id, c); setAdding(false); }}>{c.label}</button>
                  ))}
                </div>
              </div>
            ) : (
              <button type="button" className="dashed" onClick={() => setAdding(true)}>+ Add an item the camera missed (boxes, lamps…)</button>
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
      {camera && <CameraRecorder roomName={room.name} onDone={onVideo} onCancel={() => setCamera(false)} onUnsupported={openPicker} />}
    </section>
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
