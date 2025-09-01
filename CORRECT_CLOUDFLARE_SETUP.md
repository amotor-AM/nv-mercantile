# ✅ CORRECT Cloudflare Pages Setup for Static Next.js Site

Based on the official [Cloudflare Pages documentation](https://developers.cloudflare.com/pages/framework-guides/nextjs/ssr/get-started/), here's the correct setup:

## The Issue
Your project is being detected as a **full-stack (SSR)** Next.js app instead of a **static site**. This is why it's trying to run `wrangler deploy` instead of a simple static file deployment.

## ✅ SOLUTION: Configure as Static Site in Dashboard

### Step 1: Go to Cloudflare Pages Dashboard
- Visit: https://dash.cloudflare.com/
- Navigate to **Workers & Pages** → **Pages**
- Click on your `nv-mercantile` project

### Step 2: Delete and Recreate Project (RECOMMENDED)
Since the project is misconfigured as SSR, it's easier to:
1. **Delete** the current project
2. **Create a new one** with correct settings

### Step 3: Create New Project with Correct Settings
1. Click **"Create a project"**
2. Choose **"Connect to Git"**
3. Select your repository: `amotor-AM/nv-mercantile`
4. **CRITICAL**: In the setup screen, configure:

   - **Project name**: `nv-mercantile`
   - **Production branch**: `main`
   - **Framework preset**: `Next.js (Static HTML Export)` ⚠️ **MUST SELECT THIS**
   - **Build command**: `yarn build`
   - **Build output directory**: `out`
   - **Root directory**: (leave empty)

### Step 4: Environment Variables
Add:
- **NODE_VERSION**: `18.18.0`

### Step 5: Deploy
Click **"Save and Deploy"**

## Expected Result
With the correct "Next.js (Static HTML Export)" framework preset:
- ✅ Cloudflare will run `yarn build` (not `wrangler deploy`)
- ✅ It will deploy static files from `out/` directory
- ✅ Your full NV MERCANTILE site will be visible (not "Hello World")

## Why This Approach Works
- **Static HTML Export** preset tells Cloudflare this is a static site
- No SSR/Workers runtime needed
- Simple static file serving
- Compatible with your `output: 'export'` configuration

## Repository Status
✅ **Ready for deployment**:
- Next.js configured for static export (`output: 'export'`)
- Build outputs to `out/` directory
- No Workers/SSR configuration files
- 31 static pages generated successfully
- All content verified in `out/index.html`

## If Framework Preset is Missing
If you don't see "Next.js (Static HTML Export)" option:
1. Try "Static HTML" preset instead
2. Manually set build command to `yarn build`
3. Set output directory to `out`

The key is avoiding the SSR detection that triggers `wrangler deploy`!
