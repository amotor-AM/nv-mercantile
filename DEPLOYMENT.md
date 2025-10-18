# Cloudflare Pages SSR Deployment Guide (Next.js + next-on-pages)

This guide explains how to deploy the NV Mercantile application to Cloudflare Pages using Server-Side Rendering (SSR) powered by `@cloudflare/next-on-pages`. This enables API routes, authentication, and Stripe webhooks to work properly on Cloudflare.

## Prerequisites

- GitHub repository connected to Cloudflare Pages
- Node.js version 18.x or 20.x (Cloudflare recommends 18; `.nvmrc` uses 22 which is fine locally)
- A managed database (Postgres or MySQL) for production (Prisma does not support SQLite on Cloudflare)

## Build Settings (in Cloudflare Pages dashboard)

- Project name: nv-mercantile
- Production branch: main
- Framework preset: None (we will specify a custom build command)
- Build command: `yarn cf:build`
- Build output directory: `.vercel/output/static` (auto-detected)
- Root directory: leave empty

## Environment Variables (Pages → Settings → Environment variables)

Required:
- `NEXTAUTH_URL` → https://your-domain.com
- `NEXTAUTH_SECRET` → a strong random secret (32+ chars)
- `DATABASE_PROVIDER` → `postgresql` or `mysql`
- `DATABASE_URL` → connection string to your managed DB
- `STRIPE_SECRET_KEY` → from Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` → for `/api/webhooks/stripe`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → from Stripe dashboard

Optional:
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (for rate limiting)
- `RESEND_API_KEY` and `RESEND_FROM` (email)
- `ALLOW_BACKORDER` (defaults to false)

## Package.json changes

A new script is provided for Cloudflare builds:

- `cf:build`: runs the `@cloudflare/next-on-pages` build, producing the `.vercel/output` bundle compatible with Pages Functions.

Use this as your Cloudflare Pages build command: `yarn cf:build`.

## Notes on SSR vs Static

- We removed static export references. This app uses API routes, NextAuth, Stripe integration, and Prisma, so SSR is required.
- The Stripe webhook is served at `/api/webhooks/stripe`, and Cloudflare Pages Functions will route it correctly.

## Logs and Observability

- Function logs are available per deployment under Pages → Deployments → Logs.
- Stripe webhook delivery logs can be viewed in your Stripe dashboard to verify calls reach your endpoint.

## After Deployment

- Test authentication flows (sign in/out).
- Verify `/api/products` returns data (rate-limited).
- Create an order and confirm Stripe PaymentIntent can be created.
- Confirm Stripe webhook hits `/api/webhooks/stripe` and order transitions to PAID.

## Troubleshooting

- If Prisma fails on Cloudflare, ensure you are using a managed DB (not SQLite).
- If requests hit CSRF errors from the browser, confirm the `nv_csrf` cookie exists and is being sent via `x-csrf-token` header (the app does this automatically).
- If Stripe webhook errors with raw body parsing, verify `STRIPE_WEBHOOK_SECRET` and that the route is reachable publicly.

## Support

- Check Pages build logs and function logs.
- Verify environment variables and secrets in Cloudflare.
- Ensure the build command uses `yarn cf:build`.
