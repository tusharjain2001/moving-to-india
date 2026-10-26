import { useCallback, useEffect, useRef, useState } from "react";
import { getJob, uploadVideo } from "../api/survey";

// Ported from moversely/web/src/lib/useSurvey.ts: rooms live in this browser,
// each video is uploaded to the AI server and the job is polled until done.
const STORAGE_KEY = "moving-to-india:survey";
const POLL_MS = 2000;
const DEFAULT_ROOMS = ["Living room", "Master bedroom", "Bedroom", "Kitchen", "Dining room", "Balcony"];

const uid = () => Math.random().toString(36).slice(2, 10);
const emptyRoom = (name) => ({ id: uid(), name, status: "empty", progress: 0, items: [] });

function fromResult(result) {
  return {
    status: "done",
    progress: 1,
    stage: undefined,
    error: undefined,
    calibration: result.calibration,
    stats: result.stats,
    items: result.items.map((it) => ({
      id: it.id || uid(),
      key: it.key,
      label: it.label,
      dims: it.dims_m,
      qty: 1,
      confidence: it.confidence,
      notes: it.notes || [],
      thumbnail: it.thumbnail,
      views: it.views,
    })),
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full (thumbnails are the bulk): retry without them.
    try {
      const slim = data.rooms.map((r) => ({ ...r, items: r.items.map((it) => ({ ...it, thumbnail: undefined })) }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, rooms: slim }));
    } catch {
      // Still blocked: the survey works until a reload.
    }
  }
}

function initialRooms() {
  const saved = load();
  if (!saved) return DEFAULT_ROOMS.map(emptyRoom);
  // An upload can't resume after a reload; a server-side job can.
  return saved.rooms.map((r) =>
    r.status === "uploading" ? { ...r, status: "error", error: "Upload was interrupted. Please try again." } : r,
  );
}

export function clearSurvey() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

export function useSurvey() {
  const [rooms, setRooms] = useState(initialRooms);
  const [units, setUnits] = useState(() => load()?.units ?? "metric");
  const roomsRef = useRef(rooms);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    save({ rooms, units });
  }, [rooms, units]);

  const patch = useCallback((id, fields) => {
    setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, ...fields } : r)));
  }, []);

  // Poll every room whose video is being analysed.
  useEffect(() => {
    const timer = setInterval(async () => {
      for (const room of roomsRef.current) {
        if (room.status !== "processing" || !room.jobId) continue;
        try {
          const job = await getJob(room.jobId);
          if (!job) patch(room.id, { status: "error", error: "The AI server lost this job. Please scan the room again." });
          else if (job.status === "done" && job.result) patch(room.id, fromResult(job.result));
          else if (job.status === "error") patch(room.id, { status: "error", error: job.error || "Analysis failed." });
          else patch(room.id, { stage: job.stage, progress: job.progress ?? 0 });
        } catch {
          // Network blip: keep polling.
        }
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [patch]);

  const scanRoom = useCallback(
    async (id, video, filename) => {
      const room = roomsRef.current.find((r) => r.id === id);
      if (!room) return;
      patch(id, { status: "uploading", progress: 0, stage: "Uploading video", error: undefined });
      try {
        const jobId = await uploadVideo(video, filename, room.name, (p) => patch(id, { progress: p }));
        patch(id, { status: "processing", jobId, progress: 0, stage: "Starting analysis" });
      } catch (e) {
        patch(id, { status: "error", error: e?.message || "Upload failed." });
      }
    },
    [patch],
  );

  const updateItem = useCallback((roomId, itemId, fields) => {
    setRooms((rs) =>
      rs.map((r) =>
        r.id === roomId ? { ...r, items: r.items.map((it) => (it.id === itemId ? { ...it, ...fields } : it)) } : r,
      ),
    );
  }, []);

  const removeItem = useCallback((roomId, itemId) => {
    setRooms((rs) => rs.map((r) => (r.id === roomId ? { ...r, items: r.items.filter((it) => it.id !== itemId) } : r)));
  }, []);

  const addItem = useCallback((roomId, c) => {
    const item = { id: uid(), key: c.key, label: c.label, dims: c.typical, qty: 1, confidence: "manual", notes: [] };
    setRooms((rs) =>
      rs.map((r) =>
        r.id === roomId ? { ...r, status: r.status === "empty" ? "done" : r.status, items: [...r.items, item] } : r,
      ),
    );
  }, []);

  const addRoom = useCallback((name) => {
    const room = emptyRoom(name.trim() || "Room");
    setRooms((rs) => [...rs, room]);
    return room.id;
  }, []);

  const resetRoom = useCallback(
    (id) =>
      patch(id, {
        status: "empty",
        progress: 0,
        items: [],
        stage: undefined,
        error: undefined,
        jobId: undefined,
        calibration: undefined,
        stats: undefined,
      }),
    [patch],
  );

  const resetAll = useCallback(() => setRooms(DEFAULT_ROOMS.map(emptyRoom)), []);

  return { rooms, units, setUnits, scanRoom, updateItem, removeItem, addItem, addRoom, resetRoom, resetAll };
}
