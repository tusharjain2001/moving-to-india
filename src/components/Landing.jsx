import { useState } from "react";
import customsPhoto from "../assets/customs.jpeg";
import familyPhoto from "../assets/family-packing.jpeg";
import logo from "../assets/logo.png";
import checklistPhoto from "../assets/packing-checklist.jpeg";
import bengaluruArt from "../assets/cities/bengaluru.webp";
import chennaiArt from "../assets/cities/chennai.webp";
import delhiArt from "../assets/cities/delhi.webp";
import hyderabadArt from "../assets/cities/hyderabad.webp";
import mumbaiArt from "../assets/cities/mumbai.webp";
import puneArt from "../assets/cities/pune.webp";
import {
  CITIES, FAQS, HOW_STEPS, INDIA_IMPORT, REVIEWS, SERVICES_4, SERVICES_6, SG_EXPORT,
  SG_EXPORT_LINES, STATS, TIMELINE, TRUST, VISAS, cityByName,
} from "../data/content";
import { placeCode } from "../lib/move";
import { HeroMap } from "./HeroArt";
import MoveForm from "./MoveForm";

// City photos from Unsplash, free under the Unsplash License (commercial use, no
// attribution required). Photographers are credited in README.md.
const CITY_ART = {
  Mumbai: [mumbaiArt, "The Gateway of India in Mumbai at sunset"],
  Bengaluru: [bengaluruArt, "The Bengaluru skyline over green trees"],
  "Delhi NCR": [delhiArt, "India Gate in New Delhi at dusk"],
  Chennai: [chennaiArt, "The colourful tower of Vadapalani Murugan Temple, Chennai"],
  Hyderabad: [hyderabadArt, "Charminar and the street market in Hyderabad"],
  Pune: [puneArt, "The gate of Shaniwar Wada fort in Pune"],
};

const scrollToForm = () => {
  const el = document.getElementById("start");
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 88, behavior: "smooth" });
};

/** The "Moving to India" landing page, built from Claude Design "India Landing v4". */
export default function Landing({ values, setValues, onSubmitted }) {
  const [faq, setFaq] = useState(0);
  const [sent, setSent] = useState(false);
  // "Talk to AI" opens the full-page assistant, as on instant-booking.moversly.com.
  const openChat = () => {
    window.location.hash = "/chat";
  };

  const city = cityByName(values.toChoice);
  const fromCode = values.fromChoice === "Singapore" ? "SIN" : placeCode(values.fromPlace || "Kuala Lumpur");
  const barRoute = `${fromCode} → ${city ? city.code : "IND"} · ${city ? city.name : "India"}`;

  return (
    <div className="lp">
      <a href="#start" className="skip-link">Skip to the form</a>

      <header className="lp-header">
        <div className="lp-wrap lp-header-in">
          <a href="#top" className="lp-logo"><img src={logo} alt="APAC Relocation" /></a>
          <nav className="lp-nav only-desktop" aria-label="Main">
            <a href="#services">Services</a>
            <a href="#how">How it works</a>
            <a href="#visas">Visas</a>
            <a href="#cities">Cities</a>
            <a href="#customs">Customs</a>
            <a href="#faq">FAQ</a>
          </nav>
          <span className="grow only-phone" />
          <button type="button" className="ghost-link only-desktop" onClick={openChat}>Talk to AI</button>
          <button type="button" className="chat-icon only-phone" onClick={openChat} aria-label="Talk to AI">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          </button>
          <a href="#start" className="pill pill-sm">
            <span className="only-desktop">Get an instant quote</span>
            <span className="only-phone">Get a quote</span>
          </a>
        </div>
      </header>

      <main>
        <section id="top" className="lp-hero">
          <div className="hero-panel">
            <HeroMap />
            <div className="hero-text">
              <span className="hero-kicker"><i aria-hidden="true" />Singapore and Malaysia to India</span>
              <h1>
                <span className="h1-a">Book your move to</span>
                <span className="rot"><span className="rot-word">India</span></span>
                <span className="h1-b">in minutes, with an AI room survey.</span>
              </h1>
              <p className="hero-lede">
                Record each room on your phone. The AI measures every item, you see a door-to-door price, and our own
                office in India clears customs.
              </p>
              <ul className="ticks hero-ticks only-desktop">
                {TRUST.map((t) => <li key={t}><span aria-hidden="true">✓</span>{t}</li>)}
              </ul>
            </div>
          </div>
          <div className="lp-wrap hero-form">
            <MoveForm values={values} setValues={setValues} onSubmitted={onSubmitted} />
          </div>
        </section>

        <section className="only-phone phone-intro">
          <ul className="ticks">
            {TRUST.map((t) => <li key={t}><span aria-hidden="true">✓</span>{t}</li>)}
          </ul>
        </section>

        <section className="lp-pad">
          <div className="lp-wrap">
            <div className="hero-photo">
              <img src={familyPhoto} alt="A family packing APAC Relocation boxes at home" />
            </div>
            <div className="stats">
              {STATS.map(([v, l]) => (
                <div key={l}><div className="stat-v">{v}</div><div className="stat-l">{l}</div></div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="lp-section">
          <div className="lp-wrap">
            <span className="kicker">How it works</span>
            <h2 className="lp-h2 narrow">Five steps, one sitting, any phone</h2>
            <ol className="how">
              {HOW_STEPS.map(([n, t, b]) => (
                <li key={n}><span className="how-n">{n}</span><h3>{t}</h3><p>{b}</p></li>
              ))}
            </ol>
            <div className="links">
              <a href="#start">Start step 1 →</a>
              <button type="button" onClick={openChat}>Ask our AI how it works</button>
            </div>
          </div>
        </section>

        <section id="services" className="lp-section">
          <div className="lp-wrap split">
            <div className="split-main">
              <span className="kicker">Door to door</span>
              <h2 className="lp-h2">One team and one contract, from your flat to your new home</h2>
              <p className="lp-lede">Our Singapore or Malaysia team packs and ships. Our India office clears customs and delivers.</p>
              <div className="numbered">
                {SERVICES_4.map(([n, t, b]) => (
                  <div key={n}><span>{n}</span><div><h3>{t}</h3><p>{b}</p></div></div>
                ))}
              </div>
              <div className="links"><a href="#start">Get an instant quote →</a></div>
            </div>
            <div className="split-photo">
              <img src={checklistPhoto} alt="Export-grade packing checklist" />
            </div>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-wrap">
            <span className="kicker">Our services</span>
            <h2 className="lp-h2">Everything a move to India needs</h2>
            <div className="cards6">
              {SERVICES_6.map(([t, b]) => (
                <article key={t}><h3>{t}</h3><p>{b}</p></article>
              ))}
            </div>
            <div className="links">
              <a href="#start">Get an instant quote →</a>
              <button type="button" onClick={openChat}>Ask our AI about a service</button>
            </div>
          </div>
        </section>

        <section id="guide" className="lp-section">
          <div className="lp-wrap split top">
            <div className="split-side">
              <span className="kicker">Step by step</span>
              <h2 className="lp-h2">Twelve weeks from quote to delivery</h2>
              <p className="lp-lede">A typical move to India and what we handle at each point.</p>
              <div className="links"><a href="#start">Start at T − 12 weeks →</a></div>
            </div>
            <ol className="timeline">
              {TIMELINE.map(([w, t, b]) => (
                <li key={w}><span>{w}</span><div><h3>{t}</h3><p>{b}</p></div></li>
              ))}
            </ol>
          </div>
        </section>

        <section id="visas" className="lp-section">
          <div className="lp-wrap">
            <span className="kicker">Visas for India</span>
            <h2 className="lp-h2">Know your visa before you pack</h2>
            <p className="lp-lede wide">Indian passport holders need no visa. Lead times are samples*; confirm with the Indian mission.</p>
            <div className="visas">
              {VISAS.map(([code, name, lead, body]) => (
                <div key={code}>
                  <div className="visa-top"><span className="visa-code">{code}</span><h3>{name}</h3></div>
                  <p>{body}</p>
                  <span className="visa-lead">Typical lead time {lead}</span>
                </div>
              ))}
            </div>
            <div className="callout">
              <h3>Your visa decides your duty relief</h3>
              <p>
                India's import checklist asks for a "{INDIA_IMPORT.documents[1]}" and an "{INDIA_IMPORT.documents[2]}". We
                check your case before you ship.
              </p>
            </div>
            <div className="links">
              <button type="button" className="accent" onClick={openChat}>Ask our AI which visa applies →</button>
              <a href="#start" className="ink">Get an instant quote</a>
            </div>
          </div>
        </section>

        <section id="cities" className="lp-section">
          <div className="lp-wrap">
            <span className="kicker">Popular cities</span>
            <h2 className="lp-h2">Where our customers land</h2>
            <div className="cities">
              {CITIES.map((c) => {
                const pick = () => {
                  setValues((v) => ({ ...v, dest: c.place, toChoice: c.name, toPlace: "" }));
                  scrollToForm();
                };
                return (
                  <article key={c.name} className="ticket">
                    <div className="city-photo">
                      <img src={CITY_ART[c.name][0]} alt={CITY_ART[c.name][1]} loading="lazy" />
                    </div>
                    <div className="ticket-body">
                      <h3>{c.name}</h3>
                      <div className="ticket-state">{c.state}</div>
                      <div className="ticket-port">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="5" r="2.5" /><path d="M12 7.5V21" /><path d="M5 12H3a9 9 0 0 0 18 0h-2" /><path d="M8 11h8" /></svg>
                        {c.port}
                      </div>
                      <div className="ticket-tags">
                        <span>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 17l1.5 3h15L21 17" /><path d="M5 17V9h14v8" /><path d="M12 4v5" /><path d="M9 9h6" /></svg>
                          Sea {c.sea}
                        </span>
                        <span>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
                          Air {c.air}*
                        </span>
                      </div>
                    </div>
                    <div className="ticket-tear" aria-hidden="true"><span /></div>
                    <div className="ticket-foot">
                      <div>
                        <div className="ticket-k">Door to door from</div>
                        <div className="ticket-price">{c.price}*</div>
                      </div>
                      <button type="button" className="ticket-go" onClick={pick} aria-label={`Get a quote for ${c.name}`}>
                        <span>Get a quote</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="fine">Sea transit is port to port. *Sample, to be confirmed by APAC Relocation. Prices for a 2-bedroom flat by sea from Singapore.</p>
          </div>
        </section>

        <section id="customs" className="lp-section customs-pad">
          <div className="customs">
            <div className="customs-top">
              <div className="customs-intro">
                <span className="kicker light">India customs</span>
                <h2 className="lp-h2">Arriving under Transfer of Residence</h2>
                <p>
                  From the FIDI customs guides for India (updated {INDIA_IMPORT.updated}) and Singapore (updated{" "}
                  {SG_EXPORT.updated}). Rules change; we confirm yours before shipping.
                </p>
              </div>
              <div className="customs-photo"><img src={customsPhoto} alt="Customs officer checking APAC Relocation cartons" /></div>
            </div>
            <div className="customs-cols">
              <div>
                <h3>Documents for India</h3>
                <ul>{INDIA_IMPORT.documents.map((d) => <li key={d}>{d}</li>)}</ul>
              </div>
              <div>
                <h3>Duty relief</h3>
                <ul>{INDIA_IMPORT.dutyFree.map((d) => <li key={d}>{d}</li>)}</ul>
                <h3 className="mt">Good to know</h3>
                <ul>{INDIA_IMPORT.notes.map((d) => <li key={d}>{d}</li>)}</ul>
              </div>
              <div>
                <h3>Restricted or special paperwork</h3>
                <ul>{INDIA_IMPORT.restricted.map((d) => <li key={d}>{d}</li>)}</ul>
                <h3 className="mt">Leaving Singapore</h3>
                <ul>{SG_EXPORT_LINES.map((d) => <li key={d}>{d}</li>)}</ul>
              </div>
            </div>
            <div className="links customs-links">
              <a href="#start">Get your India customs checklist →</a>
              <button type="button" onClick={openChat}>Ask our AI about duty</button>
            </div>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-wrap">
            <span className="kicker">Customers</span>
            <h2 className="lp-h2">Moved to India with us</h2>
            <div className="reviews">
              {REVIEWS.map(([q, name, route]) => (
                <figure key={route}>
                  <span className="stars" aria-label="5 stars">★★★★★</span>
                  <blockquote>“{q}”</blockquote>
                  <figcaption><b>{name}</b><br /><span>{route}</span></figcaption>
                </figure>
              ))}
            </div>
            <p className="fine">Sample testimonials. Replace with verified reviews before launch.</p>
          </div>
        </section>

        <section id="faq" className="lp-section">
          <div className="lp-wrap split top">
            <div className="split-side">
              <span className="kicker">FAQ</span>
              <h2 className="lp-h2">Questions about moving to India</h2>
              <div className="btn-row">
                <button type="button" className="pill pill-outline" onClick={openChat}>Ask our AI</button>
                <a href="#start" className="pill">Get an instant quote</a>
              </div>
            </div>
            <div className="faq">
              {FAQS.map(([q, a], i) => (
                <div key={q}>
                  <button type="button" aria-expanded={faq === i} onClick={() => setFaq(faq === i ? -1 : i)}>
                    {q}<span aria-hidden="true">{faq === i ? "–" : "+"}</span>
                  </button>
                  {faq === i && <p>{a}</p>}
                </div>
              ))}
              <p className="fine">*Sample, to be confirmed by APAC Relocation. Quoted customs text is from the FIDI India guide.</p>
            </div>
          </div>
        </section>

        <section id="contact" className="lp-section lp-last">
          <div className="lp-wrap split top">
            <div className="split-side wide">
              <span className="kicker">Contact</span>
              <h2 className="lp-h2">Ready when you are</h2>
              <p className="lp-lede">Get a price now with the form, or talk to a coordinator in Singapore or India.</p>
              <div className="offices">
                <div><h3>Singapore</h3><p>[Office address]<br />[Phone]<br />[Email]</p></div>
                <div><h3>India</h3><p>[Office address]<br />[Phone]<br />[Email]</p></div>
              </div>
              <div className="btn-row">
                <a href="#start" className="pill pill-lg">Get my quote →</a>
                <a href="https://wa.me/" className="pill pill-lg pill-outline">WhatsApp us</a>
              </div>
            </div>
            {/* Not connected yet: no backend receives these messages. See README. */}
            <form
              className="contact-form"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <h3>Send us a message</h3>
              {sent && <p className="sent">Thanks. A coordinator will reply within one working day.</p>}
              <label className="f-label">Name<input className="f-input" /></label>
              <label className="f-label">Email or phone<input className="f-input" /></label>
              <label className="f-label">Message<textarea className="f-input" rows="3" /></label>
              <button type="submit" className="pill pill-dark pill-lg">Send message</button>
            </form>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap foot-row">
          <div className="foot-brand">
            <img src={logo} alt="APAC Relocation" />
            <p>International moving from Singapore and Malaysia, with our own office in India. Est. 2012.</p>
          </div>
          <nav><a href="#top">Moving from Singapore</a><a href="#top">Moving from Malaysia</a><a href="#top">Moving to India</a></nav>
          <nav><a href="#services">Services</a><a href="#customs">India customs</a><a href="#faq">FAQ</a></nav>
        </div>
        <div className="lp-wrap foot-base">
          <span>© APAC Relocation</span>
          <span>Values marked * are samples, to be confirmed by APAC Relocation.</span>
        </div>
      </footer>

      <div className="lp-bar only-phone">
        <div>
          <div className="strong">{barRoute}</div>
          <div className="bar-sub">{city ? `from ${city.price}* · ` : ""}own office in India</div>
        </div>
        <a href="#start" className="pill">Get my quote</a>
      </div>
    </div>
  );
}
