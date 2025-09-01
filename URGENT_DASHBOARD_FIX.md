# 🚨 URGENT: Cloudflare Pages Dashboard Configuration

## The Problem
Cloudflare Pages is **STILL** running `wrangler deploy` instead of `yarn build`. This means the framework preset in the dashboard is **NOT** configured correctly.

The "Hello World" message you're seeing is a default Cloudflare Workers response, not your Next.js site.

## THE SOLUTION - Dashboard Configuration

**You MUST go to the Cloudflare Pages dashboard RIGHT NOW and fix these settings:**

### 1. Go to Project Settings
- Visit: https://dash.cloudflare.com/
- Go to **Workers & Pages** → **Pages**
- Click on your `nv-mercantile` project
- Click **Settings** tab

### 2. Build & Deployments Settings
Click **"Build & deployments"** and set these EXACT values:

- **Framework preset**: `Next.js (Static HTML Export)` ⚠️ **CRITICAL - MUST SELECT THIS**
- **Build command**: `yarn build`
- **Build output directory**: `dist`
- **Root directory**: (leave empty)

### 3. Environment Variables
Click **"Environment variables"** and add:
- **NODE_VERSION**: `18.18.0`

### 4. Save and Redeploy
- Click **"Save"**
- Go to **"Deployments"** tab
- Click **"Retry deployment"** on the latest build

## What Should Happen After Fix

After setting the framework preset correctly:
- ✅ Build command will be `yarn build` (not `wrangler deploy`)
- ✅ It will deploy your actual Next.js site (not "Hello World")
- ✅ All 31 pages will be available

## Why This Keeps Happening

Cloudflare Pages auto-detection is **failing** and defaulting to Cloudflare Workers mode. The framework preset selection **overrides** auto-detection and forces it to use the correct Next.js build process.

## Verification

After the fix, check the build logs. You should see:
```
Executing user deploy command: yarn build
```

NOT:
```
Executing user deploy command: npx wrangler deploy
```

## If It Still Fails

If you still see `wrangler deploy` in the logs after setting the framework preset:
1. Try deleting the project and creating a new one
2. Make sure you select "Next.js (Static HTML Export)" during initial setup
3. Contact Cloudflare support - there may be a platform issue
