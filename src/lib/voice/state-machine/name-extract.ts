import { openai } from "@/lib/openai";
import { logger } from "@/lib/logger";

/**
 * Surgical GPT-4o-mini fallback for pulling a caller's name out of a messy spoken
 * answer, used ONLY when the deterministic cleanup (deterministic.ts) isn't
 * confident — so it never runs on a clean "Marcus Webb", only on the rambling
 * cases ("yeah it's Dolores Rivera and I've got State Farm"). Off the realtime
 * audio path; a few tokens, a fraction of a cent. Returns the extracted name, or
 * null if they declined / gave no usable name (caller proceeds on their phone #).
 */
export async function extractCallerNameLLM(transcript: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 20,
      messages: [
        {
          role: "user",
          content:
            `A caller was asked their name and replied: "${transcript}".\n` +
            `Reply with ONLY their name (first and/or last name), properly capitalized, nothing else. ` +
            `If they declined, gave no name, or it isn't a name, reply with exactly: NONE`,
        },
      ],
    });
    const out = res.choices[0]?.message?.content?.trim() ?? "";
    if (!out || /^none$/i.test(out) || out.length > 60) return null;
    return out.replace(/[.!?,]+$/, "").trim() || null;
  } catch (err) {
    logger.error("extractCallerNameLLM failed", { error: String(err) });
    return null;
  }
}
