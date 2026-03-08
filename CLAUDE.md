# Development Rules

## Git
- Always branch from `dev` for new features
- Never commit directly to `main`
- Current active branch: `dev`
- When asked to "push and merge": push dev, checkout main, merge dev (fast-forward), push main, checkout dev

## Tech Stack
- Next.js 14 (App Router) + Supabase + Tailwind CSS v3 + TypeScript
- No API routes — Supabase queried directly from server/client components
- PostCSS config: `postcss.config.js` (CommonJS, not .mjs)

## Workflow
- Always commit changes automatically at the end of a task — don't ask first
- Only ask before pushing or merging

## Troubleshooting
- If CSS/styles not loading: `rm -rf .next` and restart dev server (stale Tailwind cache)
