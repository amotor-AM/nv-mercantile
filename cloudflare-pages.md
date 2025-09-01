# CRITICAL: Cloudflare Pages Configuration Instructions

## The Problem
Cloudflare Pages is incorrectly detecting this as a Cloudflare Workers project and running `wrangler deploy` instead of treating it as a Next.js static site.

## The Solution
You MUST manually configure the build settings in the Cloudflare Pages dashboard.

## Step-by-Step Fix

### 1. Go to Cloudflare Pages Dashboard
- Navigate to https://dash.cloudflare.com/
- Go to "Workers & Pages" → "Pages"
- Find your `nv-mercantile` project

### 2. Go to Settings → Builds & Deployments
- Click on your project
- Go to "Settings" tab
- Click "Builds & deployments"

### 3. Configure Build Settings (CRITICAL)
**Framework preset**: Select `Next.js (Static HTML Export)` from dropdown
**Build command**: `yarn build`
**Build output directory**: `out`
**Root directory**: (leave empty)
**Node.js version**: `22.16.0`

### 4. Environment Variables (Optional)
Add these if needed:
- `NODE_VERSION`: `22.16.0`

### 5. Save and Redeploy
- Click "Save"
- Go back to "Deployments" tab
- Click "Retry deployment" on the latest failed build

## Why This Fixes It
- By selecting "Next.js (Static HTML Export)" framework preset, Cloudflare Pages will know this is a static site
- It will run `yarn build` instead of `wrangler deploy`
- It will look for static files in the `out/` directory
- It will NOT try to deploy as a Cloudflare Worker

## Expected Result
After configuring these settings, the build should:
1. ✅ Run `yarn build` (not `wrangler deploy`)
2. ✅ Generate static files in `out/` directory
3. ✅ Deploy successfully as a static site

## If It Still Fails
Check that:
- Framework preset is set to "Next.js (Static HTML Export)"
- Build output directory is set to `out`
- No wrangler.toml file exists in the repository
- The build command is `yarn build`
