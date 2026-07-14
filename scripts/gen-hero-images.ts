/**
 * Hero background photos for the /v4 landing page. These replace the anxious /
 * distressed hero imagery with a POSITIVE, relief / confidence emotional tone —
 * the payoff of reaching a business that actually picks up, not the panic.
 * (The distressed pain-point images live elsewhere on the page and are untouched.)
 *
 *   npx tsx --env-file=.env.local scripts/gen-hero-images.ts
 *
 * These are full-bleed HERO BACKGROUNDS. A large white headline sits over the
 * LEFT third and a floating UI panel over the RIGHT, so:
 *   - the subject sits center-to-RIGHT of frame, large (roughly half-body),
 *   - the LEFT third stays calmer / less busy (open daylight, wall, window),
 *   - bright, airy, lots of natural daylight.
 *
 * Generated at 1536x1024 and cover-cropped to 1600x1067 (landscape) to match the
 * existing public/hero/emergency-caller-bright.jpg. NOT part of the Next build.
 * Cost ~$0.06/image at medium quality.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "hero");

// Shared bright, photoreal style. Documentary/candid, real DSLR look, natural
// skin and hands, no CGI gloss, no text/logos. Composition rules force the
// subject center-right and keep the LEFT side of the frame open for a headline.
const STYLE =
  "Candid documentary lifestyle photograph shot on a full-frame DSLR with a 35mm prime lens, natural shallow depth " +
  "of field. Believable, lived-in reality — NOT a glossy hyper-perfect AI stock render, NOT over-smoothed plastic " +
  "skin. Bright and airy with abundant natural daylight and a clean, gently high-key color grade, but grounded: " +
  "subtle film grain, natural asymmetry, relaxed candid posture, slightly imperfect framing. Real non-plastic skin " +
  "with visible pores, fine lines and texture; correct human anatomy; natural, correctly-formed hands (five fingers), " +
  "never splayed flat toward the camera. " +
  "COMPOSITION IS CRITICAL: this is a wide landscape hero background. Frame the subject LARGE, roughly half-body, and " +
  "position them CENTER-to-RIGHT of the frame. Keep the LEFT third of the frame calm, open and uncluttered — a plain " +
  "sunlit wall, a bright window, or soft out-of-focus daylight — with negative space where a big text headline will " +
  "go. Nothing distracting on the left. Absolutely no text, no logos, no watermarks, no on-screen graphics.";

const VARIANTS = [
  {
    name: "relieved-caller",
    concept:
      "A relieved, genuinely happy Black woman homeowner in her late 30s to mid-40s, natural hair, wearing a warm " +
      "mustard-yellow casual top, standing in a bright modern kitchen with a smartphone held to her ear. Her " +
      "expression is real relief and warmth — a soft exhale of 'oh good, someone actually picked up' — reassured, " +
      "her free hand relaxed near her chest. Sunlight floods in from large windows on the left, leaving open bright " +
      "space on the left side of the frame; she stands center-to-right. Warm, calm, NOT anxious or distressed.",
  },
  {
    name: "calm-caller",
    concept:
      "A calm, comfortable middle-aged White man homeowner in his early 50s, short salt-and-pepper hair, wearing a " +
      "soft sage-green henley, relaxed at ease in a bright sunlit living room, talking easily on a smartphone held to " +
      "his ear as he describes something to a helpful person on the other end. Content, unhurried, a faint pleasant " +
      "smile. He leans casually against a kitchen counter or sofa arm on the right side of the frame; the left side is " +
      "open, bright and airy with daylight from a window. Relaxed body language, nothing tense.",
  },
  {
    name: "confident-owner",
    concept:
      "A confident Latino home-service business owner / tradesperson in his late 30s, short dark hair and neat " +
      "stubble, wearing a clean forest-green work polo with a small blank embroidered chest patch (NO readable text), " +
      "standing relaxed and in control beside a clean white work van on a bright sunny driveway. He has a genuine, " +
      "easy smile and glances down at a smartphone in one hand, other arm relaxed at his side — competent and calm, " +
      "the picture of a business owner who is winning. He stands center-to-right; the left of the frame is open bright " +
      "daylight and soft out-of-focus background. Sunny, upbeat, confident — not staged or stiff.",
  },
];

async function generateOne(openai: OpenAI, v: (typeof VARIANTS)[number]) {
  const prompt = `${v.concept}\n\n${STYLE}`;
  console.log(`gen    ${v.name} ...`);
  const res = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1536x1024",
    quality: "medium",
    n: 1,
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) {
    console.error(`  no image data for ${v.name}`);
    return false;
  }
  const outPath = path.join(OUT_DIR, `${v.name}.jpg`);
  // Cover-crop the 1536x1024 frame to the exact hero aspect (1600x1067),
  // matching public/hero/emergency-caller-bright.jpg.
  await sharp(Buffer.from(b64, "base64"))
    .resize(1600, 1067, { fit: "cover", position: "attention" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outPath);
  console.log(`write  ${outPath}`);
  return true;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set. Run: npx tsx --env-file=.env.local scripts/gen-hero-images.ts");
    process.exit(1);
  }
  const openai = new OpenAI();
  await mkdir(OUT_DIR, { recursive: true });

  // Optional filter: pass variant names as CLI args to regenerate only those.
  const only = process.argv.slice(2);
  const targets = only.length ? VARIANTS.filter((v) => only.includes(v.name)) : VARIANTS;

  for (const v of targets) {
    try {
      await generateOne(openai, v);
    } catch (e) {
      console.error(`  failed ${v.name}:`, (e as Error).message);
    }
  }
  console.log("done");
}

main();
