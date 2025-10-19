# Cloudflare Pages SSR Setup (Next.js + next-on-pages)

This project now targets Server-Side Rendering on Cloudflare Pages so that API routes, authentication, and Stripe webhooks work correctly.

## Create a Cloudflare Pages Project

1. Go to https://dash.cloudflare.com/
2. Navigate to Workers & Pages → Pages
3. Click “Create a project”
4. Choose “Connect to Git” and select your repository

## Build Settings (Dashboard → Project → Settings → Builds & deployments)

- Project name: nv-mercantile
- Production branch: main
- Framework preset: None
- Build command: `yarn cf:build`
- Build output directory: `.vercel/output/static` (auto)
- Root directory: leave empty

Cloudflare will deploy the `.vercel/output` bundle produced by `@cloudflare/next-on-pages`, enabling SSR and functions.

## Required Environment Variables

- NEXTAUTH_URL
- NEXTAUTH_SECRET
- DATABASE_PROVIDER (postgresql/mysql)
- DATABASE_URL (managed DB connection string)
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

Optional:
- UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (rate limiting)
- RESEND_API_KEY / RESEND_FROM (email)

## Logs

View deployment logs and function runtime logs under Pages → Deployments → Logs.

## Stripe Webhook

Ensure STRIPE_WEBHOOK_SECRET is set. The webhook endpoint is:
- Production: https://your-domain.com/api/webhooks/stripe

Stripe dashboard → Webhooks → Add endpoint → use the above URL.

## Troubleshooting

- Prisma requires a remote DB; SQLite will not work in production on Cloudflare.
- If CSRF errors occur, ensure the browser sends `x-csrf-token` (the app fetch helpers do this).
- If a webhook signature error occurs, verify STRIPE_WEBHOOK_SECRET and do not modify the raw request body.

This setup runs SSR on Cloudflare without Workers configuration files. Use the provided `cf:build` script.
