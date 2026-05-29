# CraftCapture Landing Page Redesign Plan

## What PaintScout Does Right (Key Takeaways)

### 1. Hero — Visual + Credible Immediately
- **Real photo of a painter** (holding a tablet/clipboard) anchors the page in the industry
- **Actual UI mockup** shown in the hero — visitors see the product before reading a word
- **Social proof badge in the hero** — "4.7 Stars on Google" right next to the headline
- **Two CTAs** — "Book a Demo" (low commitment) + "Start a Trial" (action)
- **Stats bar directly below hero** — "2B+ dollars sold", "23% increase in win rate", "5min per estimate" — instant credibility

### 2. Feature Sections — Bento Grid with Real UI
- Large colorful **bento-style card grid** — each card shows an actual screenshot of the UI
- Each card has: small category eyebrow, bold 1-line headline, real product screenshot
- You can see exactly what the software looks like — no imagination required
- Different accent color per section (blue, green, teal, purple) keeps it visually interesting
- Feature sections are grouped by theme (Sales, CRM) with a heading introducing each group

### 3. Social Proof — Video + Real Reviews
- **Video testimonials** with contractor headshots — "the secret behind our 10x growth" case study video
- Written testimonials use **real business names** (Morson Painting & Renovations, Kennedy Painting, Harbor Painting Co.)
- Google review format (G icon, 5 stars) with link to the real review — verifiable
- 4.9 Stars badge in the testimonials section header

### 4. FAQ — Split Layout
- Left: section heading + "Contact Support" button
- Right: accordion — clean, not a wall of text

### 5. Final CTA — Contained Card
- CTA at the bottom is a contained blue card floating on a dark background
- Two options again: "Start a Trial" + "Book a Demo"
- Feels like a natural close, not an afterthought

### 6. Footer — Legitimacy
- Multi-column (Platform / Resources / Features) shows product depth
- **PCA (Painting Contractors Association) badge** — industry legitimacy signal
- Social links (Facebook, Instagram, LinkedIn, YouTube, TikTok)

---

## What CraftCapture's Current Page Lacks

| Gap | Current State | PaintScout |
|-----|--------------|------------|
| Product visuals | Text descriptions only | Real UI screenshots in every feature card |
| Painter imagery | None | Real painter with tablet in hero |
| Bento feature grid | Text card list | Colorful bento cards with screenshots |
| Social proof | City pills ("Dallas, TX") | Real testimonials with names + video |
| Stats credibility | Made-up/generic stats | Grounded stats (2B+ dollars, specific %) |
| Demo-able content | QuoteWidget (good) | Product UI visible throughout |
| CTA footer | Inline text section | Contained floating card |

---

## CraftCapture Redesign Blueprint

### Section Order
1. **Nav** — Logo / How it works / Features / Pricing / FAQ | Login / Start free trial
2. **Hero** — Painter-centric image + headline + live widget demo or UI mockup
3. **Stats bar** — 3 punchy stats grounded in real value
4. **Problem** — 3–4 pain cards (keep current content, improve visually)
5. **How it works** — 3 steps (keep current, make visual)
6. **Features (bento grid)** — 6 cards with real UI screenshots
7. **Testimonials** — 2–3 real quotes from contractors if available, else placeholder-ready
8. **Pricing** — Single card (keep, it's clean)
9. **FAQ** — Split layout (keep accordion, improve layout)
10. **Final CTA** — Contained card, dark background
11. **Footer** — Logo / links / legal

---

## Hero Section Redesign

### Headline options
- "Stop chasing customers. Quote faster." *(current — good)*
- "The lead-to-review platform for painting contractors." *(more complete)*
- "Every quote organized. Every job tracked." *(workflow focus)*

### What to show in the hero (visual side)
Option A: **Live embedded QuoteWidget** (we already have this — keep it, it's interactive and unique)
Option B: **Split mockup** — phone notification "New Lead: Sarah M." on the left, dashboard pipeline on the right
Option C: **Animated step through** — form → lead card → quote → signed contract

Recommendation: **Keep the QuoteWidget** (it's a real differentiator — visitors can actually try it). Add a painter photo or illustrated painter element behind/around it.

### Stats bar (below hero)
Replace generic stats with grounded, specific ones:
- **"14 days"** — Full free trial, no card tricks
- **"$2,800"** — Average job value. One booking = 35 months of CraftCapture
- **"60 sec"** — Homeowner gets an instant estimate, you get a structured lead
- **"5 min"** — From signup to your first quote link live

---

## Feature Bento Grid (Core Section)

Six cards, each showing a real UI screenshot or mockup. Recommended card layout:

| Card | Headline | UI to show |
|------|----------|-----------|
| Lead Capture | "Every inquiry, organized from the first message." | Quote form step / lead card with photo |
| Instant Estimate | "Homeowners get a ballpark. You get context." | Estimate result screen |
| Quotes | "Send a professional quote in minutes." | Quote PDF / line item editor |
| Contracts | "Get the signature from anywhere." | Contract signing page / signature UI |
| Pipeline | "See every job at a glance." | Kanban board screenshot |
| Review Requests | "Close the job. Get the review. Automatically." | Review request email preview |

Visual approach: 2-column bento on desktop. Each card = colored background + bold headline + real screenshot of that feature. Use CraftCapture's orange as primary, with dark/slate cards for contrast.

---

## Social Proof Section

### Ideal format (PaintScout-style)
- Dark background section
- 2–3 cards: real contractor name, business name, headshot, quote text
- Google review format (star icons, G badge)
- If no reviews yet: placeholder-ready design with "Join painters across the US" messaging

### Stats to pair with testimonials
"$X in jobs tracked" / "X leads captured this month" — use real numbers if available, else launch without

---

## Things to Build / Source for the Redesign

### Assets needed
- [ ] Painter photo or illustration (royalty-free stock: Unsplash, Pexels — search "painting contractor", "house painter")
- [ ] UI screenshots of the actual CraftCapture dashboard (kanban, lead detail, quote editor, contract signing)
- [ ] Review request email screenshot (we can generate this)
- [ ] Real testimonials from early users (or placeholder text ready to swap in)

### Code/Design work
- [ ] Bento grid CSS — 2-col responsive grid with colorful cards
- [ ] Replace text feature section with screenshot cards
- [ ] Add painter image to hero (alongside or behind QuoteWidget)
- [ ] Stats bar — update with grounded numbers
- [ ] Testimonials section — dark background, Google-style cards
- [ ] Final CTA — floating contained card on dark background
- [ ] Footer — expand to multi-column (company / legal / support)

### Tools that can help
- **Figma / v0.dev** — generate the bento grid layout visually first
- **AI image generation** (Midjourney, DALL-E, Ideogram) — generate a painter-at-work hero image in CraftCapture brand style if no stock photo fits
- **Framer Motion** — subtle scroll animations (already have RevealOnScroll)
- **Real screenshots** — just take them from the live dashboard, clean up with browser zoom

---

## Brand / Style Direction

### Current: orange on white, text-heavy, scrappy
### Target: Professional, painter-trade credible, visually rich

- **Keep orange** — it's distinctive and warm, good for the trade industry
- **Add a dark section** (navy or near-black) for testimonials + final CTA — creates visual rhythm
- **Use slate/gray cards** with orange accents for bento features — not all white
- **Typography** — current is fine; consider slightly larger hero headline
- **Photography style** — warm, on-the-job, real contractors (not stock suits)

---

## Priority Order for Implementation

1. **Source assets first** — painter image, UI screenshots — nothing else can start without these
2. **Bento feature grid** — biggest visual upgrade, highest impact
3. **Hero update** — add imagery around the QuoteWidget
4. **Stats bar** — simple copy update
5. **Testimonials section** — build the section even with placeholder content
6. **Footer** — expand to multi-column
7. **Final CTA card** — floating contained card
