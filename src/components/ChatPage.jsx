import { useEffect, useRef, useState } from "react";
import { createOrderForPricing, deepGet } from "../api/moversly";
import logo from "../assets/logo.png";
import { GREETING, MOVE_TYPES, fromLabel, label, longDate, question, startState, toFormValues, turn } from "../lib/chat";
import Icon from "./Icons";

const KEY = "moving-to-india:chat";
const TYPING_MS = 450;

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved?.messages?.length && saved.state) return saved;
  } catch {
    // Fall through to a fresh chat.
  }
  return null;
}
const fresh = () => {
  const state = startState();
  return { state, messages: [{ role: "assistant", text: GREETING }, { role: "assistant", text: question(state.step, state.answers)[0] }] };
};

/**
 * "Talk to AI": the Moversly assistant's guided chat (from, to, what, when,
 * name, email, phone, with questions answered along the way), for moves to India.
 * At the end it creates the order on api.moversly.com exactly like the form.
 */
export default function ChatPage({ onBack, onSubmitted }) {
  const [chat, setChat] = useState(() => load() || fresh());
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [dateDraft, setDateDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const timer = useRef(null);

  const { state, messages } = chat;
  const widget = question(state.step, state.answers)[1];

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(chat));
    } catch {
      // Storage blocked: the chat still works until a reload.
    }
  }, [chat]);
  // Jump to the latest message on open (a resumed chat), then scroll smoothly.
  const opened = useRef(false);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: opened.current ? "smooth" : "auto", block: "end" });
    opened.current = true;
  }, [messages, busy, state.step]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const send = (text, value = "", shown = "") => {
    if (busy || !(text || value)) return;
    const said = text || shown || label(state.step, value);
    setChat((c) => ({ ...c, messages: [...c.messages, { role: "user", text: said }] }));
    setDraft("");
    setError("");
    setBusy(true);
    timer.current = setTimeout(() => {
      setChat((c) => {
        const [next, replies] = turn(c.state, text, value);
        const [q] = question(next.step, next.answers);
        const texts = replies.at(-1) === q ? replies : [...replies, q];
        return { state: next, messages: [...c.messages, ...texts.map((t) => ({ role: "assistant", text: t }))] };
      });
      setBusy(false);
      inputRef.current?.focus();
    }, TYPING_MS);
  };

  const restart = () => {
    clearTimeout(timer.current);
    setBusy(false);
    setError("");
    setChat(fresh());
  };

  const startSurvey = async () => {
    if (creating) return;
    setCreating(true);
    setError("");
    const values = toFormValues(state.answers);
    try {
      const res = await createOrderForPricing(values);
      const orderId = deepGet(res, ["order_id", "orderId", "orderID"]);
      if (!orderId) throw new Error("We couldn't create your booking. Please try again.");
      const exists = deepGet(res, ["user_exist", "userExist", "user_exists"]);
      onSubmitted(values, orderId, exists === true || exists === "true");
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
      setCreating(false);
    }
  };

  const inputType = widget.type === "text" ? widget.input : "text";

  return (
    <div className="cp">
      <header className="cp-head">
        <div className="cp-head-in">
          <button type="button" className="fh-icon" onClick={onBack} aria-label="Back">
            <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
          </button>
          <span className="cp-avatar" aria-hidden="true"><Icon name="sparkle" size={18} /><i /></span>
          <div className="cp-title">
            <h1>AI moving assistant</h1>
            <p className={busy ? "typing" : ""}>{busy ? "Typing…" : "Here to plan your move to India"}</p>
          </div>
          <a href="#/" className="cp-logo only-desktop"><img src={logo} alt="APAC Relocation" /></a>
          <button type="button" className="btn-line" onClick={restart} disabled={busy}>
            <Icon name="refresh" size={14} strokeWidth={2.2} /> Start over
          </button>
        </div>
      </header>

      <main className="cp-main">
        <div className="cp-list">
          <p className="cp-day">Today</p>
          {messages.map((m, i) =>
            m.role === "assistant" ? (
              <div key={i} className="cp-row bot">
                <span className="cp-bot" aria-hidden="true"><Icon name="sparkle" size={13} /></span>
                <p className="cp-bubble bot">{m.text}</p>
              </div>
            ) : (
              <div key={i} className="cp-row me"><p className="cp-bubble me">{m.text}</p></div>
            ),
          )}
          {busy && (
            <div className="cp-row bot" aria-label="The assistant is typing">
              <span className="cp-bot" aria-hidden="true"><Icon name="sparkle" size={13} /></span>
              <span className="cp-dots"><i /><i /><i /></span>
            </div>
          )}
          {!busy && widget.type === "summary" && (
            <Summary a={state.answers} creating={creating} onStart={startSurvey} onEdit={() => send("", "edit", "Change something")} />
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="cp-foot">
        <div className="cp-foot-in">
          {error && <p className="plan-error" role="alert">{error}</p>}
          {!busy && widget.type === "chips" && (
            <div className="cp-chips">
              {widget.options.map((o) => (
                <button type="button" key={o.value} onClick={() => send("", o.value, o.label)}>{o.label}</button>
              ))}
            </div>
          )}
          {!busy && widget.type === "date" && (
            <div className="cp-date">
              <input type="date" min={widget.min} value={dateDraft} onChange={(e) => setDateDraft(e.target.value)} aria-label="Moving date" />
              <button type="button" className="btn-solid" disabled={!dateDraft} onClick={() => send("", dateDraft, longDate(dateDraft))}>Confirm</button>
            </div>
          )}
          <form
            className="cp-form"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft.trim());
            }}
          >
            <input
              ref={inputRef}
              type={inputType}
              inputMode={inputType === "tel" ? "tel" : inputType === "email" ? "email" : undefined}
              autoComplete={inputType === "email" ? "email" : inputType === "tel" ? "tel" : state.step === "name" ? "name" : "off"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={widget.type === "text" ? widget.placeholder : "Type a message or ask a question…"}
              maxLength={500}
              aria-label="Your message"
            />
            <button type="submit" disabled={busy || !draft.trim()} aria-label="Send">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg>
            </button>
          </form>
          <p className="cp-note">Your details are sent to our team when you start the AI survey.</p>
        </div>
      </footer>
    </div>
  );
}

function Summary({ a, creating, onStart, onEdit }) {
  const rows = [
    ["Moving", MOVE_TYPES[a.move_type]],
    ["Date", longDate(a.date)],
    ["Name", a.name],
    ["Email", a.email],
    ["Phone", a.phone],
  ];
  const to = a.to === "Other city in India" ? a.toCity : `${a.to}, India`;
  return (
    <div className="cp-sum">
      <div className="cp-sum-top">
        <p className="caps light">Your move</p>
        <p className="cp-sum-route"><span>{fromLabel(a)}</span><span aria-label="to">✈</span><span>{to}</span></p>
      </div>
      <dl className="cp-sum-list">
        {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
      <div className="cp-sum-actions">
        <button type="button" className="btn-big block" onClick={onStart} disabled={creating}>
          {creating ? "Creating your move plan…" : "Start AI survey"} <span aria-hidden="true">→</span>
        </button>
        <button type="button" className="btn-out block-center" onClick={onEdit} disabled={creating}>Change something</button>
      </div>
    </div>
  );
}
