import familyPhoto from "../assets/family-packing.jpeg";
import indiaGate from "../assets/cities/delhi.webp";
import logo from "../assets/logo.png";
import { CONTACT, HERO_BENEFITS, STATS, STEPS_4, WHY_US, cityByName } from "../data/content";
import { placeCode } from "../lib/move";
import { track } from "../lib/track";
import Icon from "./Icons";
import MoveForm from "./MoveForm";

// India Gate photo from Unsplash, free under the Unsplash License (credited in README.md).
const digits = (n) => n.replace(/\D/g, "");
const LINKS = {
  whatsapp: [`https://wa.me/${digits(CONTACT.whatsapp)}`, "chat", `WhatsApp: ${CONTACT.whatsapp}`],
  phone: [`tel:+${digits(CONTACT.phone)}`, "phone", `Call: ${CONTACT.phone}`],
  email: [`mailto:${CONTACT.email}`, "mail", CONTACT.email],
};

/** WhatsApp, call or email link; clicks are tracked as contact leads (see lib/track.js). */
function ContactLink({ method, className = "", iconOnly = false }) {
  const [href, icon, text] = LINKS[method];
  return (
    <a
      href={href}
      className={className}
      target={method === "whatsapp" ? "_blank" : undefined}
      rel={method === "whatsapp" ? "noopener noreferrer" : undefined}
      aria-label={iconOnly ? text : undefined}
      onClick={() => track("contact_click", { method })}
    >
      <Icon name={icon} size={iconOnly ? 18 : 16} strokeWidth={2} />
      {!iconOnly && <span>{text}</span>}
    </a>
  );
}

const scrollToForm = () => {
  const el = document.getElementById("start");
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 88, behavior: "smooth" });
};

/**
 * The "Moving to India" landing page for paid campaigns, laid out like the client's
 * reference: contacts, the hero with the booking form right under it, how it works,
 * why APAC Relocation, a last call to action and the contacts again.
 */
export default function Landing({ values, setValues, onSubmitted }) {
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
          <nav className="lp-contacts only-desktop" aria-label="Contact us">
            <ContactLink method="email" />
            <ContactLink method="whatsapp" />
            <ContactLink method="phone" />
          </nav>
          <span className="grow" />
          <ContactLink method="whatsapp" className="chat-icon only-phone" iconOnly />
          <ContactLink method="phone" className="chat-icon only-phone" iconOnly />
          <button type="button" className="ghost-link only-desktop" onClick={openChat}>Talk to AI</button>
          <a href="#start" className="pill pill-sm">
            <span className="only-desktop">Get an instant quote</span>
            <span className="only-phone">Get a quote</span>
          </a>
        </div>
      </header>

      <main>
        <section id="top" className="hero2">
          <div className="lp-wrap hero2-in">
            <div className="hero2-text">
              <span className="hero2-kicker">International moving</span>
              <h1>Move to India with <span className="accent-text">Confidence</span></h1>
              <p className="hero2-lede">
                Book your international move online and get an instant, transparent quote with our AI-powered room survey.
              </p>
              <ul className="benefits">
                {HERO_BENEFITS.map(([icon, text]) => (
                  <li key={text}><span><Icon name={icon} size={18} strokeWidth={2} /></span>{text}</li>
                ))}
              </ul>
            </div>
            <div className="hero2-photo only-desktop">
              <img src={indiaGate} alt="India Gate in New Delhi at dusk" />
            </div>
          </div>
          <div className="lp-wrap hero2-form">
            <MoveForm values={values} setValues={setValues} onSubmitted={onSubmitted} />
          </div>
        </section>

        <section id="how" className="lp-section">
          <div className="lp-wrap center">
            <span className="kicker">How it works</span>
            <h2 className="lp-h2">Book your move to India online</h2>
            <ol className="steps4">
              {STEPS_4.map(([icon, title, text]) => (
                <li key={title}>
                  <span className="steps4-ic"><Icon name={icon} size={24} strokeWidth={1.8} /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="about" className="lp-section">
          <div className="lp-wrap why">
            <div className="why-photo">
              <img src={familyPhoto} alt="A family packing APAC Relocation boxes at home" loading="lazy" />
            </div>
            <div>
              <span className="kicker">Why choose APAC Relocation</span>
              <h2 className="lp-h2">A hassle-free move to India</h2>
              <ul className="ticks why-list">
                {WHY_US.map((t) => <li key={t}><span aria-hidden="true">✓</span>{t}</li>)}
              </ul>
            </div>
          </div>
          <div className="lp-wrap">
            <div className="stats stats-card">
              {STATS.map(([v, l]) => (
                <div key={l}><div className="stat-v">{v}</div><div className="stat-l">{l}</div></div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-last">
          <div className="lp-wrap">
            <div className="cta-band">
              <div>
                <h2>Ready to move to India?</h2>
                <p>Get your instant quote, book your move online and let us handle the rest.</p>
              </div>
              <button type="button" className="pill pill-lg pill-light" onClick={scrollToForm}>
                Get instant quote &amp; book online <span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="links center">
              <button type="button" onClick={openChat}>Questions? Ask our AI assistant</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap contact-bar">
          <ContactLink method="email" className="contact-pill" />
          <ContactLink method="whatsapp" className="contact-pill" />
          <ContactLink method="phone" className="contact-pill" />
        </div>
        <div className="lp-wrap foot-base">
          <span>© APAC Relocation · International moving from Singapore and Malaysia, with our own office in India. Est. 2012.</span>
        </div>
      </footer>

      <div className="lp-bar only-phone">
        <div>
          <div className="strong">{barRoute}</div>
          <div className="bar-sub">Own office in India</div>
        </div>
        <ContactLink method="whatsapp" className="chat-icon" iconOnly />
        <a href="#start" className="pill">Get my quote</a>
      </div>
    </div>
  );
}
