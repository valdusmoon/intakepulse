# CLAUDE.md

This file contains guidance for Claude Code when working in this repository.

## Standard Workflow

1. Read `dev-plan.md` to find the next unchecked `- [ ]` task in order.
2. Think through how to execute it.
3. Check in with the user before beginning — confirm the task.
4. Work on the task. Mark it complete (`- [x]`) in `dev-plan.md` when done.
5. Confirm with user before committing and pushing to GitHub.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Turbopack)
- **Auth:** Clerk
- **Database:** Supabase PostgreSQL + Drizzle ORM
- **Payments:** Stripe
- **Background jobs:** Inngest
- **Email:** Resend
- **AI:** OpenAI (GPT-4o vision)
- **Storage:** Supabase Storage
- **Deployment:** Vercel
- **UI:** Tailwind CSS v4 + Shadcn

## Key Conventions

- All authenticated routes live under `src/app/(authenticated)/`
- Public routes (lead form, marketing) live at root `src/app/`
- API routes live under `src/app/api/`
- DB schema files in `src/lib/db/schema/`, queries in `src/lib/db/queries/`
- Inngest functions in `src/lib/inngest/functions/`
- Use server components by default; add `"use client"` only when needed
- All API routes validate auth via Clerk before touching DB
- Public API routes (`/api/leads/public`) are rate-limited, no auth required
