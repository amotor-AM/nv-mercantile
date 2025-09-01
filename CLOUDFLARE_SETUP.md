# 🚀 Cloudflare Pages Setup Guide - NV Mercantile

## CRITICAL: Manual Configuration Required

Cloudflare Pages **MUST** be configured manually in the dashboard. Auto-detection is not working.

## Step 1: Create New Cloudflare Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Pages**
3. Click **Create a project**
4. Choose **Connect to Git**
5. Select your GitHub repository: `amotor-AM/nv-mercantile`

## Step 2: Configure Build Settings

**CRITICAL:** Set these exact values in the build configuration:

- **Project name**: `nv-mercantile`
- **Production branch**: `main`
- **Framework preset**: `Next.js (Static HTML Export)` ⚠️ **MUST SELECT THIS**
- **Build command**: `yarn build`
- **Build output directory**: `dist`
- **Root directory**: (leave empty)

## Step 3: Environment Variables

Add these environment variables:

- **NODE_VERSION**: `18.18.0`

## Step 4: Deploy

Click **Save and Deploy**

## Expected Build Process

With correct configuration, Cloudflare Pages will:
1. ✅ Run `yarn build` (NOT `wrangler deploy`)
2. ✅ Generate static files in `dist/` directory
3. ✅ Deploy as static site

## Troubleshooting

### If you see "wrangler deploy" error:
- ❌ Framework preset is NOT set to "Next.js (Static HTML Export)"
- ❌ Build output directory is NOT set to "dist"
- ❌ There are leftover wrangler.toml or functions/ files

### If build fails:
- Check Node.js version is set to 22.16.0
- Verify build command is `yarn build`
- Ensure no TypeScript/ESLint errors (they're ignored in config)

## Repository Structure

The repository is now clean:
- ❌ No `wrangler.toml` (removed)
- ❌ No `functions/` directory (removed)
- ✅ Standard Next.js structure
- ✅ Static export configuration in `next.config.mjs`
- ✅ Node.js version specified in `package.json` and `.nvmrc`

## Final Notes

- This is a **static site deployment**, not Cloudflare Workers
- Framework preset selection is **mandatory** for proper detection
- Build output goes to `dist/` directory (changed from `out/`)
- All Cloudflare Workers configurations have been removed
