# APAC Relocation: Moving to India

React + Vite website for moves to India. Same 5-step booking flow as instant-booking.moversly.com:
Your move → AI survey → Quotation → Payment → Documents.

All 5 steps are built. Screens use hash links: `#/` (form), `#/verify`, `#/survey`, `#/quote`,
`#/payment`, `#/pass` (Move Pass), `#/documents`.

| Step | What happens | Where it goes |
|---|---|---|
| 1. Your move (form) | Creates the order / lead, then a 6-digit email code for new users | `api.moversly.com`, same calls as the Malaysia project (`src/api/moversly.js`) |
| 2. AI survey | Record or upload a video per room; the AI lists every item with L × D × H and the total m³ | Moversly survey API on AWS EC2 (`instant-booking.moversly.com/ai`), which runs the AI on the Modal GPU (`src/api/survey.js`) |
| 3. Quotation | Sends the survey items to the order, looks up the price in the sales team's price sheet (band by CFT, "Quote Amount (SGD)"), saves it on the order. No sheet price (city without a tab, Malaysia origin, over 2,100 CFT): the customer sends a quote request instead | `api.moversly.com` `create-order-for-pricing` (items) and `create-pricing-with-split` (`src/api/moversly.js`); price from `src/api/pricing.js` |
| 4. Payment | Two agreement boxes, then a real Stripe payment (card or PayNow), as in the Malaysia project; then the Move Pass | `api.moversly.com` `survey-app/payment-intent`, Stripe Payment Element |
| 5. Documents | Customs checklist for leaving Singapore (or a note for Malaysia) and arriving in India; Save as PDF | Nothing is sent |

The booking reference is the Moversly order number from step 1.

**Prices** come from the sales team's Google Sheet "Singapore to India Export", read by the Moversly server
(`GET /prices?route=india&city=…&cft=…`, `moversely/ai/survey/prices.py`) with a Google service account and
refreshed hourly. Sales update the Freight tab; a new city = a new tab "Singapore to <City>". At 351–600 CFT
both Console (shared container, slower) and 20' FCL (own container, faster) fit: the quotation shows both, the
cheaper is selected first, and the customer's choice is saved on the order and charged.

**Payment is real.** The Stripe publishable key defaults to the live key the Malaysia project uses, so a real
card is charged. Set `VITE_STRIPE_PUBLISHABLE_KEY` to a test key once the Moversly team puts payment-intent in
test mode. The amount is sent by the browser, as in the Malaysia project.

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
- `VITE_STRIPE_PUBLISHABLE_KEY` (optional): defaults to the live key (see Payment above).

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
  duty, documents, arrival, cars/pets, services, privacy, the scan). Other free-typed questions go to
  `POST /chat/ask` on the Moversly server (`src/api/assistant.js`), which answers with Claude on Amazon
  Bedrock using this site's instructions (`moversely/ai/survey/sites/india.txt`), limited to 250-token
  answers, 15 AI answers per chat and a daily cap shared with Moversly. If there's no answer, the visitor
  sees "our team will help". The chat is kept in the browser only; the server stores nothing.
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
- Prices need the Moversly server with `GOOGLE_SERVICE_ACCOUNT_FILE` and `PRICE_SHEETS` set; until then the
  quotation shows "Prices are not available right now".
