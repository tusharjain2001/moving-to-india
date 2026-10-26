import { useState } from "react";
import { roomVolume } from "../lib/units";
import RoomSheet from "./RoomSheet";

const m3 = (v) => `${v.toFixed(v < 10 ? 2 : 1)} m³`;

function badgeOf(room) {
  const pct = Math.round(room.progress * 100);
  switch (room.status) {
    case "done": return { text: "✓ Measured", cls: "ok" };
    case "uploading": return { text: `Uploading ${pct}%`, cls: "busy" };
    case "processing": return { text: `Measuring ${pct}%`, cls: "busy" };
    case "error": return { text: "Try again", cls: "bad" };
    default: return { text: "Record", cls: "todo" };
  }
}

/** Step 2: volume banner, room cards, and the room opened inline (v4 design). */
export default function SurveyStep({ survey, info, onBack, onNext }) {
  const { rooms } = survey;
  const [openId, setOpenId] = useState(null);
  const [newRoom, setNewRoom] = useState("");
  const open = rooms.find((r) => r.id === openId);

  const openRoom = (id) => {
    setOpenId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <section className="volume">
        <div className="volume-main">
          <div className="volume-label">Estimated shipment volume</div>
          <div className={`volume-big ${info.total === 0 ? "dim" : ""}`}>{info.volume}</div>
          <div className="volume-sub">{info.ft3} · {info.itemCount} items · {info.scanned}/{rooms.length} rooms</div>
          <div className="volume-segs" aria-hidden="true">
            {rooms.map((r) => <span key={r.id} className={r.status} />)}
          </div>
        </div>
        <div className="ship">
          <span className="ship-ic">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="12" rx="1" /><path d="M6 7v12M10 7v12M14 7v12M18 7v12" /></svg>
          </span>
          <span><span className="caps">Suggested shipping</span><span className="ship-t">{info.shipping}</span></span>
        </div>
      </section>

      {open ? (
        <RoomSheet room={open} survey={survey} onClose={() => setOpenId(null)} />
      ) : (
        <>
          <div className="rooms-head">
            <h1>Your rooms</h1>
            <span>Tap a room to record or review it</span>
          </div>
          <ul className="rooms">
            {rooms.map((r) => {
              const b = badgeOf(r);
              const count = r.items.reduce((n, it) => n + it.qty, 0);
              return (
                <li key={r.id}>
                  <button type="button" className="room" onClick={() => openRoom(r.id)}>
                    <span className={`room-badge ${b.cls}`}>{b.text}</span>
                    <span className="room-name">{r.name}</span>
                    <span className="room-meta">
                      {r.status === "done" ? `${count} items · ${m3(roomVolume(r))}` : r.status === "empty" ? "Not recorded yet" : r.status === "error" ? "Upload or analysis failed" : "AI is measuring"}
                    </span>
                  </button>
                </li>
              );
            })}
            <li>
              <form
                className="room room-add"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newRoom.trim()) return;
                  openRoom(survey.addRoom(newRoom));
                  setNewRoom("");
                }}
              >
                <span className="room-badge todo">+ Room</span>
                <input className="f-input" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} placeholder="Add a room…" aria-label="Room name" />
                <button className="link-strong" disabled={!newRoom.trim()}>Add room</button>
              </form>
            </li>
          </ul>
          <div className="flow-nav">
            <button type="button" className="btn-out" onClick={onBack}>← Your move</button>
            <button type="button" className="btn-big only-desktop" onClick={onNext}>Next: quotation <span aria-hidden="true">→</span></button>
          </div>
          <p className="fine">Sizes are AI estimates from your video. Items marked “Check size” or “Estimate” are worth a quick look.</p>
        </>
      )}
    </>
  );
}
