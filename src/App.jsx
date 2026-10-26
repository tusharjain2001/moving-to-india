import { useCallback, useEffect, useState } from "react";
import Landing from "./components/Landing";
import OtpGate from "./components/OtpGate";
import StepHeader from "./components/StepHeader";
import BookingFlow from "./components/BookingFlow";
import ChatPage from "./components/ChatPage";
import { EMPTY_MOVE, clearMove, loadMove, saveMove } from "./lib/move";
import { clearSurvey } from "./lib/useSurvey";

const FLOW_ROUTES = ["survey", "quote", "payment", "pass", "documents"];

// Screens: "#/" landing + form, "#/verify" email code, then the booking flow:
// "#/survey", "#/quote", "#/payment", "#/pass" (Move Pass), "#/documents".
// A hash keeps the browser back button working without a router package.
// In-page links such as "#start" or "#how" are not screens: they stay on the landing page.
const routeFromHash = () => {
  const h = window.location.hash;
  return h.startsWith("#/") ? h.slice(2).split("?")[0] || "home" : "home";
};
const go = (route) => {
  window.location.hash = route === "home" ? "/" : `/${route}`;
};

export default function App() {
  const [move, setMove] = useState(loadMove);
  const [route, setRoute] = useState(routeFromHash);
  // The form's fields live here so "Get a quote" on a city card can fill in "To".
  const [formValues, setFormValues] = useState(() => move?.values || EMPTY_MOVE);

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // New screen: start at the top, unless the link points at a section (e.g. "#faq").
  useEffect(() => {
    const h = window.location.hash;
    const target = h && !h.startsWith("#/") ? document.getElementById(h.slice(1)) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [route]);

  const update = useCallback((next) => {
    setMove(next);
    saveMove(next);
  }, []);

  // Step 1 done: order created on api.moversly.com.
  const onSubmitted = (values, orderId, userExists) => {
    // A different route is a different home: start the survey fresh.
    // Fixing a typo in the name or date keeps the rooms already scanned.
    if (move && (move.values.origin !== values.origin || move.values.dest !== values.dest)) clearSurvey();
    update({ values, orderId, verified: userExists });
    setFormValues(values);
    go(userExists ? "survey" : "verify");
  };

  const newMove = () => {
    if (!confirm("Start a different move? This clears your rooms and details on this device.")) return;
    clearMove();
    clearSurvey();
    setMove(null);
    setFormValues(EMPTY_MOVE);
    go("home");
  };

  // Guard the later screens: they need an order and a verified email; the
  // Move Pass and documents also need a (simulated) booking.
  let screen = FLOW_ROUTES.includes(route) || route === "verify" || route === "chat" ? route : "home";
  if (screen === "verify" && !move?.orderId) screen = "home";
  if (FLOW_ROUTES.includes(screen) && !(move?.orderId && move.verified)) screen = move?.orderId ? "verify" : "home";
  if ((screen === "pass" || screen === "documents") && !move?.booking) screen = "payment";

  if (screen === "verify")
    return (
      <div className="flow">
        <StepHeader step={0} onBack={() => go("home")} backLabel="Back to your move" />
        <div className="otp-wrap">
          <OtpGate
            email={move.values.email}
            onVerified={() => {
              update({ ...move, verified: true });
              go("survey");
            }}
            onBack={() => go("home")}
          />
        </div>
      </div>
    );

  if (screen === "chat")
    return <ChatPage onBack={() => (window.history.length > 1 ? window.history.back() : go("home"))} onSubmitted={onSubmitted} />;

  if (FLOW_ROUTES.includes(screen))
    return <BookingFlow step={screen} move={move} update={update} go={go} onNewMove={newMove} />;

  return <Landing values={formValues} setValues={setFormValues} onSubmitted={onSubmitted} />;
}
