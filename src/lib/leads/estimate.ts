import { openai } from "@/lib/openai";

// ─── Rate limiting ────────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ─── AI photo summary ─────────────────────────────────────────────────────────

const SUMMARY_SYSTEM_PROMPT = `You are an assistant helping a professional painting contractor review a job lead.

The homeowner has uploaded photos of the space they want painted. Write a 2-3 sentence professional assessment of what you see.
Focus on: surface condition, any prep work likely needed, notable features (high ceilings, complex trim, staining, peeling, wood rot, etc.).
Keep it factual and concise — the painter will read this before calling the homeowner.

Also assess whether the photos suggest the surface condition is significantly worse than "good". If so, flag it.

Return ONLY valid JSON:
{
  "summary": "<2-3 sentence professional assessment>",
  "conditionFlag": "<null | 'fair' | 'poor'>"
}`;

export async function runAiPhotoSummary(
  description: string,
  serviceType: string | undefined,
  photos: string[]
): Promise<{ summary: string; conditionFlag: string | null } | null> {
  if (photos.length === 0) return null;

  const userMessage = `Service type: ${serviceType ?? "not specified"}\n\nProject description: ${description}`;
  const imageContent = photos.map((photo) => ({
    type: "image_url" as const,
    image_url: { url: photo, detail: "high" as const },
  }));

  const aiResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SUMMARY_SYSTEM_PROMPT },
      {
        role: "user",
        content: [...imageContent, { type: "text" as const, text: userMessage }],
      },
    ],
    max_tokens: 300,
    temperature: 0.3,
  });

  const content = aiResponse.choices[0]?.message?.content;
  if (!content) return null;

  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(cleaned);
  return {
    summary: parsed.summary ?? "",
    conditionFlag: parsed.conditionFlag ?? null,
  };
}

