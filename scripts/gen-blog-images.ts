/**
 * One-off blog header image generator. Run manually when a new post is added:
 *
 *   npx tsx --env-file=.env.local scripts/gen-blog-images.ts          # only missing
 *   npx tsx --env-file=.env.local scripts/gen-blog-images.ts --force  # regenerate all
 *
 * NOT part of the Next build. It reads POSTS, generates one editorial header per
 * post with gpt-image-1 (shared IMAGE_STYLE keeps the set visually consistent),
 * crops to a clean 1200x630, and writes public/blog/<slug>.jpg. Cost is a few
 * cents per image. Commit the resulting JPGs so they serve as static assets.
 */
import { writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import sharp from "sharp";
import { POSTS, IMAGE_STYLE } from "../src/lib/marketing/posts";

const OUT_DIR = path.join(process.cwd(), "public", "blog");
const force = process.argv.includes("--force");

async function exists(p: string) {
  try { await access(p); return true; } catch { return false; }
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set. Run with: npx tsx --env-file=.env.local scripts/gen-blog-images.ts");
    process.exit(1);
  }
  const openai = new OpenAI();
  await mkdir(OUT_DIR, { recursive: true });

  for (const post of POSTS) {
    const outPath = path.join(process.cwd(), "public", post.image.replace(/^\//, ""));
    if (!force && (await exists(outPath))) {
      console.log(`skip   ${post.slug} (exists; --force to regenerate)`);
      continue;
    }

    const prompt = `${post.imagePrompt}\n\n${IMAGE_STYLE}`;
    console.log(`gen    ${post.slug} ...`);
    const res = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1536x1024",   // gpt-image-1 has no 1200x630; crop below
      quality: "medium",
      n: 1,
    });

    const b64 = res.data?.[0]?.b64_json;
    if (!b64) { console.error(`  no image data for ${post.slug}`); continue; }

    // Center-crop 1536x1024 -> 1200x630 (the standard OG ratio, doubles as the
    // on-page banner), then encode as a reasonably compressed JPEG.
    await sharp(Buffer.from(b64, "base64"))
      .resize(1200, 630, { fit: "cover", position: "attention" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(outPath);

    console.log(`write  ${outPath}`);
  }
  console.log("done");
}

main().catch((e) => { console.error(e); process.exit(1); });
