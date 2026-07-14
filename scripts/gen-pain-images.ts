/**
 * Pain-point card images for the /v4 landing overhaul. Portrait photos meant to
 * sit UNDER real HTML text + floating UI chips (like ReviewHarvest's pain cards),
 * so they intentionally contain NO on-image text/UI — the upper area is kept
 * calmer/darker for a white headline overlay. Realistic/candid, not plasticky.
 *
 *   npx tsx --env-file=.env.local scripts/gen-pain-images.ts
 *
 * Writes to public/pain/. Cost ~$0.06/image at medium quality.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "pain");

const STYLE =
  "Photorealistic candid documentary photograph, full-frame camera, 35mm lens, shallow depth of field, natural " +
  "light, realistic skin texture and correct anatomy, believable and un-staged (NOT a plasticky AI stock look, " +
  "NOT glossy, NOT over-smoothed). Keep the UPPER third of the frame calmer and slightly darker so white text can " +
  "sit over it. Absolutely no text, no UI, no phone-screen graphics, no logos, no watermarks.";

const VARIANTS = [
  {
    name: "busy",
    concept:
      "A home-service tradesperson in a work polo kneeling and working intently with both hands on a job inside a " +
      "bright home (servicing an HVAC unit or working under a sink), fully occupied, while a smartphone resting on " +
      "the floor nearby lights up with a call he simply cannot stop to answer. Portrait orientation.",
  },
  {
    name: "afterhours",
    concept:
      "The dim interior of a parked work van at dusk, a smartphone resting face-up on the dashboard glowing softly, " +
      "warm out-of-focus streetlights through the windshield, no people, quiet after-hours mood, clean and moody " +
      "but not gloomy. Portrait orientation.",
  },
  {
    name: "nextcompany",
    concept:
      "A frustrated homeowner in their 40s standing in a bright modern kitchen, lowering a smartphone from their ear " +
      "with a disappointed, let-down expression, in the act of giving up on a call and about to try someone else. " +
      "Believable and human. Portrait orientation.",
  },
];

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set. Run: npx tsx --env-file=.env.local scripts/gen-pain-images.ts");
    process.exit(1);
  }
  const openai = new OpenAI();
  await mkdir(OUT_DIR, { recursive: true });

  for (const v of VARIANTS) {
    const prompt = `${v.concept}\n\n${STYLE}`;
    console.log(`gen    ${v.name} ...`);
    try {
      const res = await openai.images.generate({ model: "gpt-image-1", prompt, size: "1024x1536", quality: "medium", n: 1 });
      const b64 = res.data?.[0]?.b64_json;
      if (!b64) { console.error(`  no image data for ${v.name}`); continue; }
      const outPath = path.join(OUT_DIR, `${v.name}.jpg`);
      // Portrait card aspect ~ 3:4 (800x1040).
      await sharp(Buffer.from(b64, "base64")).resize(800, 1040, { fit: "cover", position: "attention" }).jpeg({ quality: 82, mozjpeg: true }).toFile(outPath);
      console.log(`write  ${outPath}`);
    } catch (e) {
      console.error(`  failed ${v.name}:`, (e as Error).message);
    }
  }
  console.log("done");
}

main();
