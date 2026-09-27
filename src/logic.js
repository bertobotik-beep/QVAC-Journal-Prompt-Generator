// QVAC Journal Prompt Generator — core logic.
// completion() writes one open-ended, reflective journal prompt question
// that fits the user's stated mood or topic — never a generic prompt.

import { completion } from "@qvac/sdk";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "my", "me", "i", "am", "is", "are", "was", "were", "be", "been", "being",
  "that", "this", "it", "at", "as", "so", "very", "really", "just", "not",
  "have", "has", "had", "will", "would", "can", "could", "about", "into",
  "up", "out", "feeling", "feel", "today",
]);

function keywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

function looksUnusable(text) {
  if (!text || text.trim().length === 0) return true;
  if (text.length > 260) return true;
  const bad = ["i cannot", "i can't", "as an ai", "i'm not able", "i do not have", "please provide"];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

function isGrounded(text, moodOrTopic) {
  const words = keywords(moodOrTopic);
  if (words.length === 0) return true;
  const lower = text.toLowerCase();
  return words.some((w) => lower.includes(w));
}

const FALLBACK = (moodOrTopic) =>
  `What is it about "${moodOrTopic}" that you haven't fully let yourself feel or say yet?`;

export async function generate(modelId, moodOrTopic) {
  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "Write ONE thoughtful, open-ended journal reflection prompt (a single question, one sentence) " +
          "that fits the mood or topic the user gives. The prompt must clearly relate to their specific " +
          "mood/topic, not be a generic journaling question that could apply to anything. Reply with ONLY " +
          "the prompt question, no preamble, no numbering, no explanation.",
      },
      { role: "user", content: "Mood or topic: feeling overwhelmed at my new job" },
      { role: "assistant", content: "What part of this new job feels heaviest to carry right now, and who could you set it down with, even for a moment?" },
      { role: "user", content: `Mood or topic: ${moodOrTopic}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.8, maxTokens: 90 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = text
    .trim()
    .replace(/^here'?s[^:\n]*:\s*/i, "")
    .trim()
    .split("\n")[0]
    .trim()
    .replace(/^["'“]|["'”]$/g, "")
    .trim();

  if (text && !/[?？]\s*$/.test(text)) text = text.replace(/[.!]+$/, "") + "?";

  // Reject the model's output and use the deterministic fallback whenever it
  // refused, rambled, or drifted off-topic (no keyword overlap with the
  // user's input) — this guarantees the user always gets a usable, relevant
  // prompt even if the on-device model produces a bad completion.
  const prompt = looksUnusable(text) || !isGrounded(text, moodOrTopic) ? FALLBACK(moodOrTopic) : text;
  return { prompt };
}
