// AI room survey API: the Moversly FastAPI server on AWS EC2
// (instant-booking.moversly.com/ai), which sends each video to the Modal GPU.
// Same calls as moversely/web/src/lib/api.ts:
//   POST /jobs        multipart video=<file>, room=<name>  -> { job_id }
//   GET  /jobs/{id}   -> { status: queued|running|done|error, stage, progress, result?, error? }
//   GET  /catalog     -> items for "Add an item"
// The server allows calls from any website (CORS *), so no proxy is needed.

export const SURVEY_API_URL = (
  import.meta.env.VITE_SURVEY_API_URL || "https://instant-booking.moversly.com/ai"
).replace(/\/$/, "");

/** Upload with progress events (fetch can't report upload progress). */
export function uploadVideo(video, filename, room, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("video", video, filename);
    form.append("room", room);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${SURVEY_API_URL}/jobs`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(body.job_id);
        else reject(new Error(body.detail || uploadError(xhr.status)));
      } catch {
        reject(new Error(uploadError(xhr.status)));
      }
    };
    xhr.onerror = () => reject(new Error("Couldn't reach the AI server. Check your connection and try again."));
    xhr.send(form);
  });
}

function uploadError(status) {
  if (status === 413) return "The video is too large. Please record a shorter clip (under a minute).";
  if (status >= 500) return "The upload didn't reach the AI server. Check your connection and try again, or record a shorter clip.";
  return `Upload failed (error ${status}). Please try again.`;
}

export async function getJob(jobId) {
  const res = await fetch(`${SURVEY_API_URL}/jobs/${jobId}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Status check failed (${res.status})`);
  return res.json();
}

let catalogPromise = null;
export function getCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch(`${SURVEY_API_URL}/catalog`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => list.sort((a, b) => a.label.localeCompare(b.label)))
      .catch(() => {
        catalogPromise = null;
        return [];
      });
  }
  return catalogPromise;
}
