/**
 * One-off generator for the closing-CTA lead-alert avatars. Run once:
 *
 *   npx tsx --env-file=.env.local scripts/gen-cta-avatars.ts          # only missing
 *   npx tsx --env-file=.env.local scripts/gen-cta-avatars.ts --force  # regenerate all
 *
 * NOT part of the Next build. Generates fictional, illustrative headshot avatars
 * with gpt-image-1 (so no real-person likeness / no third-party image license),
 * crops each to a small square, and writes public/avatars/lead-<n>.jpg. These are
 * decorative sample "New lead" notification faces on the homepage CTA — commit the
 * resulting JPGs so they serve as static assets (no runtime API call).
 */
import { writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "avatars");
const force = process.argv.includes("--force");

const STYLE =
  "Photorealistic professional headshot portrait, friendly natural smile, looking at the camera, " +
  "soft even studio lighting, plain softly-blurred neutral background, shoulders-up, centered face, " +
  "candid and approachable, not a stock-photo cliché. Fictional person, not a real individual.";

const AVATARS = [
  { file: "lead-1.jpg", prompt: "A woman in her early 40s with shoulder-length dark hair." },
  { file: "lead-2.jpg", prompt: "A man in his mid 40s with short brown hair and light stubble." },
  { file: "lead-3.jpg", prompt: "A man in his 50s with grey hair and a warm weathered face." },
  { file: "lead-4.jpg", prompt: "A woman in her 30s with curly hair, warm complexion." },
];

async function exists(p: string) {
  try { await access(p); return true; } catch { return false; }
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set. Run with: npx tsx --env-file=.env.local scripts/gen-cta-avatars.ts");
    process.exit(1);
  }
  const openai = new OpenAI();
  await mkdir(OUT_DIR, { recursive: true });

  for (const a of AVATARS) {
    const outPath = path.join(OUT_DIR, a.file);
    if (!force && (await exists(outPath))) {
      console.log(`skip   ${a.file} (exists; --force to regenerate)`);
      continue;
    }
    console.log(`gen    ${a.file} ...`);
    const res = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `${a.prompt}\n\n${STYLE}`,
      size: "1024x1024",
      quality: "medium",
      n: 1,
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) { console.error(`  no image data for ${a.file}`); continue; }

    // Small square avatar (displayed at ~36px) — 256px keeps it crisp on retina
    // while staying a few KB. Re-encode without metadata (strips EXIF + C2PA).
    await sharp(Buffer.from(b64, "base64"))
      .resize(256, 256, { fit: "cover", position: "attention" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(outPath);
    console.log(`write  ${outPath}`);
  }
  console.log("done");
}

main().catch((e) => { console.error(e); process.exit(1); });
