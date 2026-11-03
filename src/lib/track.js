// Events for paid-campaign tracking through Google Tag Manager. Events always go to
// window.dataLayer; the GTM container (VITE_GTM_ID in .env) is loaded only when set, and
// the client's marketing team turns these events into Google Ads / Meta conversions there.
//   lead_submitted  { lead_source: "form" | "chat", to_city }  the order (lead) was created
//   contact_click   { method: "whatsapp" | "phone" | "email" }
const GTM_ID = import.meta.env.VITE_GTM_ID;

export function track(event, data = {}) {
  try {
    (window.dataLayer = window.dataLayer || []).push({ event, ...data });
  } catch {
    // Tracking must never break the page.
  }
}

export function loadGtm() {
  if (!GTM_ID || document.getElementById("gtm")) return;
  track("gtm.js", { "gtm.start": Date.now() });
  const s = document.createElement("script");
  s.id = "gtm";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(s);
}
