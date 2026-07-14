/**
 * Founder headshot for the /v4 landing "Set up by a person" section.
 *
 * MASKED inpaint: we keep the founder's real photo pixels for the face/head and
 * only let gpt-image-1 repaint the SHIRT area (the lower part of the frame). The
 * mask is opaque (kept) over the face and transparent (editable) over the shirt,
 * so his face stays exactly the same — only the gray sweater becomes a shirt.
 *
 *   npx tsx --env-file=.env.local scripts/gen-founder-headshot.ts
 *
 * Writes public/team/nile.jpg. ~$0.06-0.17 for one high-quality edit.
 */
import { createReadStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import OpenAI, { toFile } from "openai";
import sharp from "sharp";

const SRC = "/home/nile/Downloads/Online Pics/final2/photofeeler_v2/buzznano.png";
const OUT_DIR = path.join(process.cwd(), "public", "team");

const SIZE = 1024;
// Everything ABOVE this y stays locked (face, hair, neck, background). Below it
// (the shirt) is repainted. ~59% down = just under the neck.
const KEEP_ABOVE = 604;

const PROMPT =
  "Replace the person's gray sweater with a clean, well-fitted dark navy collared button-up shirt (modern startup-founder look, top button open, no tie). Keep the same lighting and neutral background. Photorealistic fabric, natural folds. Do not change anything above the shoulders.";

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set. Run: npx tsx --env-file=.env.local scripts/gen-founder-headshot.ts");
    process.exit(1);
  }
  const openai = new OpenAI();
  await mkdir(OUT_DIR, { recursive: true });

  // 1) Square head-and-shoulders crop of the ORIGINAL (kept verbatim as base).
  const base = await sharp(SRC).resize(SIZE, SIZE, { fit: "cover", position: "top" }).png().toBuffer();

  // 2) Mask: opaque black over the kept region (top), transparent over the shirt
  //    (bottom). Transparent = editable for the OpenAI edit API. Soft edge.
  const mask = await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: { create: { width: SIZE, height: KEEP_ABOVE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } } }, top: 0, left: 0 }])
    .png()
    .blur(6)
    .toBuffer();

  console.log("inpainting shirt only (face locked) ...");
  const res = await openai.images.edit({
    model: "gpt-image-1",
    image: await toFile(base, "base.png", { type: "image/png" }),
    mask: await toFile(mask, "mask.png", { type: "image/png" }),
    prompt: PROMPT,
    size: `${SIZE}x${SIZE}` as "1024x1024",
    quality: "high",
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) { console.error("no image data returned"); process.exit(1); }

  const outPath = path.join(OUT_DIR, "nile.jpg");
  await sharp(Buffer.from(b64, "base64"))
    .resize(512, 512, { fit: "cover", position: "top" })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(outPath);
  console.log("write ", outPath);
}

main().catch((e) => { console.error(e); process.exit(1); });
