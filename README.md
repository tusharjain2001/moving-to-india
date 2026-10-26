# APAC Relocation: Moving to India

React + Vite website for moves to India. Same 5-step booking flow as instant-booking.moversly.com:
Your move → AI survey → Quotation → Payment → Documents.

All 5 steps are built. Screens use hash links: `#/` (form), `#/verify`, `#/survey`, `#/quote`,
`#/payment`, `#/pass` (Move Pass), `#/documents`.

| Step | What happens | Where it goes |
|---|---|---|
| 1. Your move (form) | Creates the order / lead, then a 6-digit email code for new users | `api.moversly.com`, same calls as the Malaysia project (`src/api/moversly.js`) |
| 2. AI survey | Record or upload a video per room; the AI lists every item with L × D × H and the total m³ | Moversly survey API on AWS EC2 (`instant-booking.moversly.com/ai`), which runs the AI on the Modal GPU (`src/api/survey.js`) |
| 3. Quotation | Illustrative estimate: city sample price + SGD 55 per m³ above 20 m³ (`src/lib/quote.js`), schedule, offices, terms | Nothing is sent |
| 4. Payment | Simulation: optional 3% insurance, two agreement boxes, no card details, no money taken; then the Move Pass | Saved in the browser only |
| 5. Documents | Customs checklist for leaving Singapore (or a note for Malaysia) and arriving in India; Save as PDF | Nothing is sent |

The booking reference is the Moversly order number from step 1. Prices are samples from the
design until live pricing is connected (the Malaysia project's `updateOrderWithItems` and
`getSeaPricing` calls) and a licensed payment provider replaces the simulation.

The survey API accepts calls from any website (CORS `*`), so no proxy or server change is needed.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

Settings go in `.env` (see `.env.example`):

- `VITE_GOOGLE_PLACES_API_KEY`: Google key for the "Moving from" and "Moving to" search boxes.
  If the key is restricted by website, add `localhost:5173` and the live domain.
- `VITE_SURVEY_API_URL` (optional): defaults to the live survey API.

The phone camera needs HTTPS. On localhost, test the survey with "Upload a video".

## Files

```
src/api/moversly.js     order + OTP (copied logic from malaysia-project/src/api/client.js)
src/api/survey.js       upload video, poll the job, item catalog (from moversely/web/src/lib/api.ts)
src/lib/useSurvey.js    rooms, polling, edits (from moversely/web/src/lib/useSurvey.ts)
src/lib/move.js         saves the form details and order_id in the browser
src/lib/units.js        sizes, volumes, container guide
src/components/         Landing, MoveForm, OtpGate, StepHeader, SurveyPage, RoomSheet, ItemRow, CameraRecorder
```

## Design

The look and copy come from the Claude Design file "India booking flow design" (v4 of
"India Landing" and "India Booking Flow"): Archivo font, APAC teal, warm off-white ground.
Page copy lives in `src/data/content.js`; customs lists come from `src/data/customs/*.json`
(the same FIDI summaries the Moversly site uses). Values marked * are samples to be confirmed
by APAC Relocation.

Not connected yet (the design shows them, nothing sends data):

- "Send us a message" contact form: shows a thank-you but sends nothing.
- "Talk to AI" (`#/chat`, `src/lib/chat.js`): the same guided chat as instant-booking.moversly.com
  (from, to, what, when, name, email, phone, change answers, summary, then "Start AI survey", which creates
  the order on api.moversly.com like the form). Questions get fixed answers from our data (cost, timing,
  duty, documents, arrival, cars/pets, services, privacy, the scan). Unlike Moversly, other free-typed
  questions are not sent to the Qwen model on the server; they get "our team will help". The chat is kept
  in the browser only.
- WhatsApp link has no number; office addresses are placeholders.

City card photos (`src/assets/cities/*.webp`) are from Unsplash, free to use under the
[Unsplash License](https://unsplash.com/license): commercial use allowed, no attribution required
(credited here anyway). Checked on 26 Oct 2026 that none is an Unsplash+ (paid) photo.

| City | Photo | Photographer |
|---|---|---|
| Mumbai | [Gateway of India](https://unsplash.com/photos/k3SHcT9zGkE) | Sarang Pande |
| Bengaluru | [City skyline](https://unsplash.com/photos/sEDewKyq6YM) | Mahadev Ittina |
| Delhi NCR | [India Gate](https://unsplash.com/photos/XjKaPInYVCM) | shalender kumar |
| Chennai | [Vadapalani Murugan Temple](https://unsplash.com/photos/a-very-tall-colorful-building-with-a-clock-on-its-side-MvXeYx6rzKg) | kaarthy madhan |
| Hyderabad | [Charminar](https://unsplash.com/photos/BgF8HUIg2JY) | Shiv Prasad |
| Pune | [Shaniwar Wada](https://unsplash.com/photos/ancient-stone-gateway-with-ornate-architectural-details-e7XGs_ldZHo) | Vikram Pataskar |

## Notes

- `TEST_LEAD = true` in `src/api/moversly.js`, as in the Malaysia project. Set it to false when the backend team says testing is done.
- The destination must be a city in India (the backend rejects a country-only destination).
- Next step to build: quotation. It will send the survey items to the same order
  (`updateOrderWithItems` in the Malaysia project) and then fetch live pricing.
