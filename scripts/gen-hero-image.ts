/**
 * One-off hero image generator for the landing page. Produces several
 * variations of the "worried homeowner, after-hours emergency call" concept so
 * we can pick the most photoreal one before wiring it into the hero.
 *
 *   npx tsx --env-file=.env.local scripts/gen-hero-image.ts
 *
 * NOT part of the Next build. Writes candidates to a scratch dir for review;
 * the chosen one gets copied into public/hero/ and committed. Trade-agnostic on
 * purpose (no tools, no uniforms, no visible emergency props) so it reads for
 * every trade, not one. Cost is a few cents per image.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import sharp from "sharp";

const OUT_DIR = process.argv[2] || path.join(process.cwd(), "hero-candidates");

// Shared photoreal style — pushes away from cheesy/uncanny stock-AI look.
const STYLE =
  "Photorealistic editorial photograph, shot on a full-frame camera with a 35mm lens, shallow depth of field, " +
  "cinematic color grade, high dynamic range, subtle natural film grain, authentic candid documentary moment. " +
  "Realistic natural skin texture and correct human anatomy. Warm interior lamp light mixed with cool blue " +
  "evening light from dark windows, establishing an after-hours mood. An ordinary, comfortable suburban home " +
  "interior. NOT a posed smiling stock photo. No text, no logos, no watermarks, no on-screen phone graphics.";

// Composition note — subject right-of-center, darker negative space camera-left
// for the headline overlay; the call-UI card will float over the right side.
const COMPOSITION =
  "Wide landscape composition, the person positioned slightly right of center, leaving darker quieter negative " +
  "space on the left third of the frame for text. Room to the right of the subject as well.";

// The universal figure is the CALLER, not a tradesperson — identical across
// every trade, so it never pins the product to plumbing/HVAC/etc.
const CONCEPT =
  "A relatable, ordinary-looking homeowner in their 40s standing in their home in the evening, holding a " +
  "smartphone to their ear mid phone call, with a genuinely worried, tense, concerned expression — the moment " +
  "of calling a home-service business about an urgent problem. One hand holds the phone to the ear; the other " +
  "arm is relaxed or crossed. The tension lives only in the face and body language. Absolutely no tools, no " +
  "tradespeople, no water damage, no visible broken appliance or emergency props.";

const VARIANTS = [
  { name: "hero-a-man-kitchen", who: "A man in his mid-40s, short hair, casual sweater", room: "in a warm modern kitchen" },
  { name: "hero-b-woman-living", who: "A woman in her early 40s, hair tied back, casual cardigan", room: "in a cozy living room" },
  { name: "hero-c-man-hallway", who: "A man in his early 50s, greying hair, plain t-shirt", room: "in a home hallway near the front door at night" },
  { name: "hero-d-woman-kitchen", who: "A woman in her late 40s, glasses, casual top", room: "leaning on a kitchen counter" },
];

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set. Run: npx tsx --env-file=.env.local scripts/gen-hero-image.ts");
    process.exit(1);
  }
  const openai = new OpenAI();
  await mkdir(OUT_DIR, { recursive: true });

  for (const v of VARIANTS) {
    const prompt = `${v.who} ${v.room}. ${CONCEPT}\n\n${COMPOSITION}\n\n${STYLE}`;
    console.log(`gen    ${v.name} ...`);
    try {
      const res = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1536x1024",
        quality: "high",
        n: 1,
      });
      const b64 = res.data?.[0]?.b64_json;
      if (!b64) { console.error(`  no image data for ${v.name}`); continue; }
      const outPath = path.join(OUT_DIR, `${v.name}.jpg`);
      // Keep the full 1536x1024 frame; the hero crops responsively via object-cover.
      await sharp(Buffer.from(b64, "base64")).jpeg({ quality: 88, mozjpeg: true }).toFile(outPath);
      console.log(`write  ${outPath}`);
    } catch (e) {
      console.error(`  failed ${v.name}:`, (e as Error).message);
    }
  }
  console.log("done");
}

main().catch((e) => { console.error(e); process.exit(1); });
