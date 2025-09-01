# Cloudflare Pages Deployment Guide

This guide explains how to deploy the NV Mercantile application to Cloudflare Pages.

## Prerequisites

- GitHub repository connected to Cloudflare Pages
- Node.js version 22.16.0 (specified in `.nvmrc`)

## Configuration

The project is configured for Cloudflare Pages deployment with the following settings:

### Build Settings
- **Build command**: `yarn build`
- **Build output directory**: `out` (configured in next.config.mjs)
- **Root directory**: `/` (leave empty)
- **Node.js version**: 22.16.0 (specified in `.nvmrc`)

### Environment Variables
No environment variables are required for basic deployment, but you may want to add:

- `NODE_VERSION`: `22.16.0` (matches `.nvmrc`)

## Package Manager

The project uses **Yarn** as the package manager, specified in `package.json`:

```json
{
  "packageManager": "yarn@1.22.22"
}
```

## Deployment Steps

1. **Connect Repository**
   - Go to Cloudflare Pages dashboard
   - Click "Create a project"
   - Connect your GitHub repository (`amotor-AM/nv-mercantile`)

2. **Configure Build Settings**
   - **Project name**: `nv-mercantile` (or your preferred name)
   - **Production branch**: `main`
   - **Build command**: `yarn build`
   - **Build output directory**: Leave empty (Next.js handles this)
   - **Root directory**: Leave empty

3. **Environment Variables** (Optional)
   - Add `NODE_VERSION`: `22.16.0`

4. **Deploy**
   - Click "Save and Deploy"
   - Cloudflare will automatically build and deploy your application

## Troubleshooting

### Common Issues

**"Cannot install with frozen-lockfile" Error**
- ✅ **Fixed**: Removed outdated `pnpm-lock.yaml`
- ✅ **Fixed**: Added `"packageManager": "yarn@1.22.22"` to `package.json`
- ✅ **Fixed**: Regenerated `yarn.lock`

**Build Failures**
- Ensure Node.js version is 22.16.0
- Check that all dependencies are properly installed
- Verify that the build command is `yarn build`

**"Cannot install with frozen-lockfile" Error**
- ✅ **Fixed**: Removed outdated `pnpm-lock.yaml`
- ✅ **Fixed**: Added `"packageManager": "yarn@1.22.22"` to `package.json`
- ✅ **Fixed**: Regenerated `yarn.lock`

**"Missing entry-point to Worker script" Error**
- ✅ **Fixed**: Added Pages-specific `wrangler.toml` with `pages_build_output_dir = "out"`
- ✅ **Fixed**: Added `_headers` and `_redirects` files for Pages detection
- ✅ **Fixed**: Configured Next.js for static export with `output: 'export'`
- ✅ **Fixed**: Added `generateStaticParams()` to dynamic routes

**Next.js 15 "params should be awaited" Error**
- ✅ **Fixed**: Made page components async and awaited `params` object
- ✅ **Fixed**: Updated TypeScript interfaces to reflect Promise-based params

**Static Asset Issues**
- The `next.config.mjs` has `images: { unoptimized: true }` for Cloudflare compatibility
- Static assets in `/public` are automatically served

## Build Configuration Details

### next.config.mjs
```javascript
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Prevents build failures on ESLint errors
  },
  typescript: {
    ignoreBuildErrors: true, // Prevents build failures on TypeScript errors
  },
  images: {
    unoptimized: true, // Required for static deployment platforms
  },
  // Cloudflare Pages configuration
  trailingSlash: true,
  output: 'export', // Static export for Cloudflare Pages
  distDir: 'out', // Output directory for static files
}
```

### Package.json Scripts
- `build`: `next build` - Builds the application for production
- `start`: `next start` - Starts the production server
- `dev`: `next dev` - Starts the development server

## Custom Domain (Optional)

To use a custom domain:
1. Go to your Cloudflare Pages project
2. Click on "Custom domains"
3. Add your domain and follow the DNS setup instructions

## Monitoring Deployment

After deployment:
- Check the Cloudflare Pages dashboard for build status
- Monitor function logs if you encounter runtime errors
- Use the preview deployments for testing changes before merging to main

## Performance Optimization

The application is already optimized for Cloudflare Pages:
- Static generation for better performance
- Image optimization disabled (compatible with static deployment)
- Minimal runtime dependencies

## Support

If you encounter deployment issues:
1. Check the build logs in Cloudflare Pages dashboard
2. Verify all dependencies are installed correctly
3. Ensure the Node.js version matches `.nvmrc`
4. Check that the package manager is correctly detected as Yarn
