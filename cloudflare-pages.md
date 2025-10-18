# Cloudflare Pages SSR Configuration Instructions

This app requires SSR to support API routes, NextAuth, Prisma, and Stripe webhooks. Use `@cloudflare/next-on-pages` for Cloudflare Pages deployments.

## 1) Go to Cloudflare Pages Dashboard
- https://dash.cloudflare.com/
- Workers & Pages → Pages
- Select your `nv-mercantile` project (or create it)

## 2) Settings → Builds & deployments
Configure:

- Framework preset: None
- Build command: `yarn cf:build`
- Build output directory: `.vercel/output/static` (auto)
- Root directory: (leave empty)

## 3) Environment Variables
Add:
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DATABASE_PROVIDER` and `DATABASE_URL` (managed Postgres/MySQL)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Optional: Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`), Resend email (`RESEND_API_KEY`, `RESEND_FROM`)

## 4) Redeploy
Trigger a new deployment. Pages Functions will serve SSR, including `/api/webhooks/stripe`.

## 5) Logs
View build and runtime logs under Deployments → Logs.

If you previously configured static export, switch to the SSR flow above. Do not use `wrangler deploy` or static presets for this project.
