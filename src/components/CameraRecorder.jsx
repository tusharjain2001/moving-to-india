import { useEffect, useRef, useState } from "react";
import Icon from "./Icons";

// Ported from moversely/web/src/components/CameraRecorder.tsx.
const MAX_SECONDS = 90;
const MIN_SECONDS = 5;

const TIPS = [
  "Walk slowly around the room",
  "Keep each item fully in view for a moment",
  "Include a door, it calibrates the size",
  "Point slightly down so the floor is visible",
];

function pickMimeType() {
  const types = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t));
}

/**
 * Full-screen in-browser recorder at 720p with a capped bitrate, so a
 * one-minute room is about 20 MB instead of the 150 MB a phone camera app makes.
 * The camera needs HTTPS (or localhost).
 */
export default function CameraRecorder({ roomName, onDone, onCancel, onUnsupported }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [tip, setTip] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia || !pickMimeType()) {
      onUnsupported();
      return;
    }
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError("Camera access was blocked. Allow camera access, or upload a video instead."));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onUnsupported]);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    const tips = setInterval(() => setTip((t) => (t + 1) % TIPS.length), 4000);
    return () => {
      clearInterval(timer);
      clearInterval(tips);
    };
  }, [recording]);

  useEffect(() => {
    if (recording && seconds >= MAX_SECONDS) recorderRef.current?.stop();
  }, [recording, seconds]);

  const start = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const mimeType = pickMimeType();
    // 1.5 Mbps is plenty: the AI scales frames down to 960 px anyway.
    const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1_500_000 });
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = () => {
      setRecording(false);
      const type = rec.mimeType || mimeType || "video/webm";
      const blob = new Blob(chunksRef.current, { type });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      onDone(blob, `${roomName.toLowerCase().replace(/\s+/g, "-")}.${type.includes("mp4") ? "mp4" : "webm"}`);
    };
    rec.start(1000);
    recorderRef.current = rec;
    setSeconds(0);
    setRecording(true);
  };

  const stop = () => recorderRef.current?.state === "recording" && recorderRef.current.stop();

  const cancel = () => {
    if (recording && recorderRef.current) {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    onCancel();
  };

  const elapsed = Math.min(1, seconds / MAX_SECONDS);
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="cam">
      <video ref={videoRef} autoPlay playsInline muted className="cam-video" />

      <div className="cam-top">
        <button type="button" className="cam-pill" onClick={cancel}>Cancel</button>
        <span className="cam-pill cam-room">{roomName}</span>
        <span className={`cam-pill cam-clock ${recording ? "rec" : ""}`}>
          {recording && <i aria-hidden="true" />}
          {clock}
        </span>
      </div>

      {recording && (
        <div className="cam-progress" aria-hidden="true">
          <div className="cam-track"><span style={{ width: `${elapsed * 100}%` }} /></div>
          <div className="cam-track-labels"><span>20–60 s ideal</span><span>1:30 max</span></div>
        </div>
      )}

      <div className="cam-guides" aria-hidden="true">
        <span className="g tl" /><span className="g tr" /><span className="g bl" /><span className="g br" />
      </div>

      <div className="cam-bottom">
        {error ? (
          <p className="cam-error">{error}</p>
        ) : (
          <p className="cam-tip">
            <Icon name="bulb" size={16} />
            {recording ? (seconds < MIN_SECONDS ? "Keep going…" : TIPS[tip]) : "Start in a corner. Pan slowly across the whole room."}
          </p>
        )}
        <button
          type="button"
          className={`cam-shutter ${recording ? "rec" : ""}`}
          aria-label={recording ? "Stop recording" : "Start recording"}
          disabled={!!error || (recording && seconds < MIN_SECONDS)}
          onClick={recording ? stop : start}
          style={{
            background: recording
              ? `conic-gradient(#fff 0 ${elapsed * 360}deg, rgba(255,255,255,.3) ${elapsed * 360}deg 360deg)`
              : "#fff",
          }}
        >
          <span className="cam-shutter-inner"><span /></span>
        </button>
        <p className="cam-hint">{recording ? "Tap to finish · stops automatically at 1:30" : "20–60 seconds is ideal"}</p>
      </div>
    </div>
  );
}
