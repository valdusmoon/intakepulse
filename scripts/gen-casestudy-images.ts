/**
 * Case-study portraits for the /v4 landing. People-focused (owners), distinct
 * from the trade-scene photos in public/industries so no image repeats across
 * the page. Deliberately diverse — different ages, genders, backgrounds — each
 * in a branded work polo with a small embroidered chest patch (NO readable text,
 * to avoid garbled AI lettering; it just reads as company branding).
 *
 *   npx tsx --env-file=.env.local scripts/gen-casestudy-images.ts
 *
 * Writes to public/casestudy/. ~$0.06/image at medium quality.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "casestudy");

const STYLE =
  "Shot on a full-frame DSLR, 50mm prime, wide aperture with shallow depth of field. Real editorial documentary " +
  "photography, NOT CGI, NOT 3D render, NOT AI-stock. Authentic candid moment: natural relaxed half-smile, weight " +
  "shifted onto one leg, body angled and turned slightly away from the lens, eyeline just off-camera — not staring " +
  "dead-center into the lens, not arms stiffly crossed. Bright natural daylight, soft shadows. Lived-in realism: " +
  "genuine non-plastic skin texture with pores and fine lines, natural facial asymmetry, subtle fine film grain, " +
  "slightly imperfect natural styling. Avoid the over-rendered glossy over-smoothed plastic look entirely. " +
  "Landscape framing with the person to one side of the frame and their real work environment softly blurred " +
  "behind. Hands rendered correctly and naturally (five fingers, no distortion). The work shirt has a small " +
  "embroidered logo patch on the chest but NO readable text or letters. No signage text, no logos on vehicles, no " +
  "watermarks, no visible lettering anywhere.";

const VARIANTS = [
  {
    name: "northside",
    concept:
      "A woman in her mid-40s, White, restoration company owner, wearing a SLATE BLUE-GRAY work polo. She stands " +
      "at the open back of a clean white work van at a bright suburban home, one hand resting casually on the van " +
      "door, glancing slightly off to the side with a relaxed genuine half-smile as if mid-conversation. A yellow " +
      "air-mover drying fan sits softly out of focus near the home's doorway behind her.",
  },
  {
    name: "apex",
    concept:
      "A Black man in his early 50s with a warm genuine presence, HVAC company owner, wearing a WARM RUST " +
      "TERRACOTTA-ORANGE work shirt. He stands beside a residential outdoor air-conditioning condenser unit on a " +
      "bright clear day, one hand resting easily on top of the unit, weight on one leg, looking slightly off to " +
      "the side with an easy natural half-smile, mid-task and relaxed.",
  },
  {
    name: "blueline",
    concept:
      "A Latino man in his early-to-mid 30s, plumbing company owner, wearing a DEEP TEAL work polo. He stands in a " +
      "bright modern white kitchen by a sunny window, holding a tablet in one hand and looking down at it or " +
      "slightly off-camera with a relaxed half-smile, as if checking a job. A small canvas tool bag rests on the " +
      "white counter beside him, softly out of focus.",
  },
];

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set. Run: npx tsx --env-file=.env.local scripts/gen-casestudy-images.ts");
    process.exit(1);
  }
  const openai = new OpenAI();
  await mkdir(OUT_DIR, { recursive: true });

  for (const v of VARIANTS) {
    const prompt = `${v.concept}\n\n${STYLE}`;
    console.log(`gen    ${v.name} ...`);
    try {
      const res = await openai.images.generate({ model: "gpt-image-1", prompt, size: "1536x1024", quality: "medium", n: 1 });
      const b64 = res.data?.[0]?.b64_json;
      if (!b64) { console.error(`  no image data for ${v.name}`); continue; }
      const outPath = path.join(OUT_DIR, `${v.name}.jpg`);
      await sharp(Buffer.from(b64, "base64")).resize(900, 560, { fit: "cover", position: "attention" }).jpeg({ quality: 82, mozjpeg: true }).toFile(outPath);
      console.log(`write  ${outPath}`);
    } catch (e) {
      console.error(`  failed ${v.name}:`, (e as Error).message);
    }
  }
  console.log("done");
}

main();
