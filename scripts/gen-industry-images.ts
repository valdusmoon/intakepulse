/**
 * Industry-card image generator for the /v2 landing mock. Produces one bright,
 * photoreal image per trade for the "Built for your trade" grid, cropped to the
 * card aspect (900x424, ~2.12:1 — matches the h-44 3-col slot).
 *
 *   npx tsx --env-file=.env.local scripts/gen-industry-images.ts
 *
 * NOT part of the Next build. Writes final assets straight into
 * public/industries/. Each card is explicitly labeled with its trade, so
 * trade-specific imagery is correct here (unlike the trade-agnostic hero). The
 * "your-trade" catch-all card stays trade-agnostic (a homeowner on a call).
 * Cost: ~$0.06/image at medium quality, 6 images ≈ $0.35.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "industries");

// Shared bright, photoreal style — landing-page friendly, no AI-stock cheese,
// no text/logos. Calmer space toward the bottom for the label gradient overlay.
const STYLE =
  "Candid documentary photograph shot on a full-frame DSLR with a 35mm prime lens, natural shallow depth of field. " +
  "Believable, lived-in reality — NOT a glossy hyper-perfect AI stock render. Bright and airy with abundant natural " +
  "daylight and a clean, gently high-key color grade, but keep it grounded: subtle film grain, natural asymmetry, " +
  "relaxed candid posture caught mid-task, slightly imperfect framing. Real non-plastic skin with visible pores, " +
  "fine lines and texture; correct human anatomy. Hands should be busy with a natural task or partly out of frame — " +
  "never splayed flat toward the camera. Modern, tidy, professional setting. Keep the lower portion of the frame " +
  "calmer and less busy for a caption overlay. Absolutely no text, no logos, no watermarks, no on-screen graphics.";

const VARIANTS = [
  {
    name: "restoration",
    concept:
      "An experienced White male water-damage restoration technician in his 50s, close-cropped graying hair and " +
      "some gray stubble, wearing a charcoal-gray work polo. He is crouched, setting down a professional bright " +
      "yellow air-mover drying fan onto the light hardwood floor of a bright, sunlit modern living room; large " +
      "windows pour daylight in; the scene is clean and controlled, not chaotic. His hands are on the fan handle.",
  },
  {
    name: "hvac",
    concept:
      "A confident Latina woman HVAC technician in her 30s, dark hair tied back, wearing a burgundy / deep-red work " +
      "shirt with a tool pouch on her hip. She is kneeling beside an outdoor air-conditioning condenser unit next " +
      "to a tidy suburban home on a clear bright day, blue sky and green lawn; she is reaching a hand to inspect the " +
      "unit, focused and competent.",
  },
  {
    name: "plumbing",
    concept:
      "A Latino man plumber in his late 30s to early 40s, short dark hair, wearing a forest-green work shirt. He is " +
      "kneeling and leaning in to work on the plumbing beneath the sink of a bright, modern white-cabinet kitchen " +
      "with a large sunny window; a small set of tools is laid out neatly on the floor; clean workspace, hands at " +
      "the pipe.",
  },
  {
    name: "electrical",
    concept:
      "A South Asian man electrician in his 40s, wearing a tan / khaki work shirt. He is calmly working at an open " +
      "residential electrical breaker panel in a bright, clean utility area of a modern home; soft daylight from a " +
      "nearby window; one hand steadying the panel door, focused and safe — absolutely no sparks or drama.",
  },
  {
    name: "general-contracting",
    concept:
      "A Black woman general contractor in her 40s, natural hair, wearing a heather-gray henley, standing in a bright " +
      "home under active renovation. She holds a tablet up at chest height in both hands and glances down at the " +
      "renovation plans on its screen. Clearly a job site: exposed wood wall-stud framing and sheets of fresh " +
      "unpainted drywall behind her, a level and a couple of tools resting on a sawhorse, large windows with daylight. " +
      "A yellow hard hat sits on the bench. Unmistakably a construction-in-progress interior.",
  },
  {
    name: "your-trade",
    concept:
      "A relatable White woman homeowner in her mid-50s, silver-gray shoulder-length hair, wearing a soft " +
      "chambray-blue casual top, standing at ease in a bright, sunny modern kitchen and talking on a smartphone held " +
      "to her ear; a calm, relieved half-smile — the everyday moment of finally reaching a business that actually " +
      "picks up. No tools, no tradesperson, no specific trade.",
  },
];

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set. Run: npx tsx --env-file=.env.local scripts/gen-industry-images.ts");
    process.exit(1);
  }
  const openai = new OpenAI();
  await mkdir(OUT_DIR, { recursive: true });

  for (const v of VARIANTS) {
    const prompt = `${v.concept}\n\n${STYLE}`;
    console.log(`gen    ${v.name} ...`);
    try {
      const res = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1536x1024",
        quality: "medium",
        n: 1,
      });
      const b64 = res.data?.[0]?.b64_json;
      if (!b64) { console.error(`  no image data for ${v.name}`); continue; }
      const outPath = path.join(OUT_DIR, `${v.name}.jpg`);
      // Cover-crop the 1536x1024 frame to the exact card aspect (900x424).
      await sharp(Buffer.from(b64, "base64"))
        .resize(900, 424, { fit: "cover", position: "attention" })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(outPath);
      console.log(`write  ${outPath}`);
    } catch (e) {
      console.error(`  failed ${v.name}:`, (e as Error).message);
    }
  }
  console.log("done");
}

main();
