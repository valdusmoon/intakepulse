import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export const maxDuration = 60;

// 3 generations per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const colorName = formData.get("colorName") as string | null;
    const colorHex = formData.get("colorHex") as string | null;

    if (!imageFile || !colorName || !colorHex) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const colorText = `${colorName} (${colorHex})`;
    const prompt = [
      `Edit this photo by changing only the painted wall surfaces to ${colorText}.`,
      `Do not change trim, ceilings, windows, doors, flooring, furniture, fixtures, brick, stone, roof, landscaping, or other non-painted surfaces.`,
      `Preserve lighting, shadows, texture, perspective, and camera angle.`,
      `Keep the result photorealistic and realistic as an actual paint job.`,
    ].join(" ");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (openai.images as any).edit({
      model: "gpt-image-1.5",
      image: imageFile,
      prompt,
      size: "1024x1024",
      quality: "low",
      output_format: "webp",
      output_compression: 80,
      input_fidelity: "high",
      n: 1,
    });

    const resultBase64 = response.data?.[0]?.b64_json;
    if (!resultBase64) throw new Error("No result from OpenAI");

    return NextResponse.json({ result: `data:image/webp;base64,${resultBase64}` });
  } catch (error) {
    console.error("Visualize error:", error);
    return NextResponse.json({ error: "Failed to generate visualization" }, { status: 500 });
  }
}
