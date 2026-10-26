import { useEffect, useRef, useState } from "react";
import { confirmRegistration, resendConfirmationCode } from "../api/moversly";
import Icon from "./Icons";

const LEN = 6;

/**
 * Email check after the form (same as the Malaysia project's OtpGate):
 * a 6-digit code from api.moversly.com, with resend after 30 seconds.
 */
export default function OtpGate({ email, onVerified, onBack }) {
  const [digits, setDigits] = useState(() => Array(LEN).fill(""));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [seconds, setSeconds] = useState(30);
  const [verifying, setVerifying] = useState(false);
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const masked = (() => {
    const [user, domain] = (email || "").split("@");
    if (!domain) return "your email";
    return (user.length <= 2 ? user.slice(0, 1) : user.slice(0, 2)) + "•••@" + domain;
  })();

  const setDigit = (i, v) => {
    const c = v.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const n = [...prev];
      n[i] = c;
      return n;
    });
    setError("");
    if (c && i < LEN - 1) refs.current[i + 1]?.focus();
  };
  const onKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1].focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1].focus();
    if (e.key === "ArrowRight" && i < LEN - 1) refs.current[i + 1].focus();
  };
  const onPaste = (e) => {
    const txt = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, LEN);
    if (!txt) return;
    e.preventDefault();
    const n = Array(LEN).fill("");
    txt.split("").forEach((d, i) => (n[i] = d));
    setDigits(n);
    setError("");
    refs.current[Math.min(txt.length, LEN - 1)]?.focus();
  };

  const code = digits.join("");
  const full = code.length === LEN;

  const verify = async (e) => {
    e.preventDefault();
    if (!full || verifying) return;
    setVerifying(true);
    setError("");
    try {
      await confirmRegistration(code, email);
      onVerified();
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      // Already confirmed on an earlier visit: nothing left to check.
      if (msg.includes("already") && msg.includes("confirm")) return onVerified();
      setError(err.message || "That code doesn't match. Check your email and try again.");
      setDigits(Array(LEN).fill(""));
      refs.current[0]?.focus();
      setVerifying(false);
    }
  };

  const resend = async () => {
    setDigits(Array(LEN).fill(""));
    setError("");
    setNotice("");
    try {
      await resendConfirmationCode(email);
      setNotice("A new code is on its way to your inbox.");
      setSeconds(30);
    } catch (err) {
      setError(err.message || "Couldn't resend the code. Please try again.");
    }
    refs.current[0]?.focus();
  };

  return (
    <form className="otp-card" onSubmit={verify}>
      <span className="otp-icon">
        <Icon name="mail" size={24} />
      </span>
      <p className="kicker">Secure verification</p>
      <h1 className="otp-title">Check your email</h1>
      <p className="otp-sub">
        We sent a 6-digit code to <span className="mono">{masked}</span>. Enter it to start your AI survey.
      </p>

      <div className="otp-inputs" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            className={`otp-box ${error ? "err" : ""} ${d ? "filled" : ""}`}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1}`}
            maxLength={1}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
          />
        ))}
      </div>

      {error && <p className="plan-error" role="alert">{error}</p>}
      {notice && !error && <p className="otp-notice">{notice}</p>}

      <button className="pill-cta" disabled={!full || verifying}>
        {verifying ? "Checking…" : "Verify and scan your rooms"} <span aria-hidden="true">→</span>
      </button>

      <div className="otp-foot">
        <button type="button" className="link" onClick={onBack}>← Edit details</button>
        {seconds > 0 ? (
          <span className="muted">Resend in 0:{String(seconds).padStart(2, "0")}</span>
        ) : (
          <button type="button" className="link" onClick={resend}>Resend code</button>
        )}
      </div>
    </form>
  );
}
