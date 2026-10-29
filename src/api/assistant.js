// Free questions in "Talk to AI" that have no fixed answer: the Moversly
// server on AWS (same address as the survey) answers them with Claude on
// Amazon Bedrock, using this site's instructions (moversely ai/survey/sites/india.txt).
//   POST /chat/ask  { site, chat_id, messages: [{role, text}], context } -> { answer }
// answer is null when the AI can't reply (daily limit, or an error).
import { SURVEY_API_URL } from "./survey";

export async function askAssistant(chatId, messages, context) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(`${SURVEY_API_URL}/chat/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site: "india",
        chat_id: chatId,
        messages: messages.slice(-8).map((m) => ({ role: m.role, text: m.text.slice(0, 1500) })),
        context: context.slice(0, 300),
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return (await res.json()).answer || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
