import logo from "../assets/logo.png";
import Icon from "./Icons";

export const STEPS = ["Your move", "AI survey", "Quotation", "Payment", "Documents"];

/**
 * Booking-flow header from the v4 design: logo and "Talk to AI", then a back
 * button and the 5-step stepper joined by lines. Phones get "Step 2 of 5" and bars.
 */
export default function StepHeader({ step, onBack, backLabel, right, onStep, canOpen = () => false }) {
  const next = step < STEPS.length - 1 ? `Next: ${STEPS[step + 1]}` : "Final step";
  return (
    <header className="fh">
      <div className="fh-phone only-phone">
        <div className="fh-phone-top">
          {onBack && (
            <button type="button" className="fh-icon" onClick={onBack} aria-label={backLabel}>
              <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
            </button>
          )}
          <a href="#/" className="fh-logo"><img src={logo} alt="APAC Relocation" /></a>
          {right}
          <a href="#/chat" className="fh-icon tint" aria-label="Talk to AI"><Icon name="sparkle" size={18} /></a>
        </div>
        <div className="fh-phone-text">
          <span><span className="muted">Step {step + 1} of 5 · </span><strong>{STEPS[step]}</strong></span>
          <span className="muted">{next}</span>
        </div>
        <div className="fh-bars" aria-hidden="true">
          {STEPS.map((s, i) => <span key={s} className={i <= step ? "on" : ""} />)}
        </div>
      </div>

      <div className="only-desktop">
        <div className="fh-top">
          <a href="#/"><img src={logo} alt="APAC Relocation" className="fh-logo-lg" /></a>
          <div className="fh-actions">
            {right}
            <a href="#/chat" className="fh-ai"><Icon name="sparkle" size={16} />Talk to AI</a>
          </div>
        </div>
        <div className="fh-row">
          <div className="fh-row-in">
            {onBack && (
              <button type="button" className="fh-back" onClick={onBack}>
                <Icon name="arrowLeft" size={16} strokeWidth={2.2} />
                {backLabel}
              </button>
            )}
            <ol className="fh-steps">
              {STEPS.map((label, i) => (
                <li key={label} className={i < step ? "done" : i === step ? "current" : ""} aria-current={i === step ? "step" : undefined}>
                  {onStep && canOpen(i) ? (
                    <button type="button" className="fh-step link-step" onClick={() => onStep(i)}>
                      <span className="fh-dot">{i < step ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}</span>
                      {label}
                    </button>
                  ) : (
                    <span className="fh-step">
                      <span className="fh-dot">{i < step ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}</span>
                      {label}
                    </span>
                  )}
                  {i < STEPS.length - 1 && <span className="fh-line" />}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </header>
  );
}
