# Deployment Guide - Sellable View

## 🚀 Quick Deploy via CLI

### Option 1: Push to GitHub (Automatic Deployment)
Since Vercel is connected to your GitHub repository, simply push your changes:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

This will **automatically trigger a deployment** to Vercel. Vercel will:
- Detect the push to GitHub
- Build your Next.js app
- Deploy to production (for `main` branch)
- Deploy to preview (for other branches)

### Option 2: Direct Vercel CLI Deployment

#### Deploy to Preview (Testing)
```bash
vercel
```
This creates a preview deployment with a unique URL for testing.

#### Deploy to Production
```bash
vercel --prod
```
This deploys directly to your production URL: https://sellable-view.vercel.app

## 📋 Your Current Setup

- **GitHub Repository**: https://github.com/mikeazimi/sellable_view.git
- **Vercel Project**: sellable-view  
- **Production URL**: https://sellable-view.vercel.app (mike-azimis-projects)
- **Vercel Account**: mike-azimis-projects

## 🔄 Typical Workflow

1. **Make changes locally** and test with `pnpm dev`
2. **Commit your changes**: `git commit -am "Your message"`
3. **Push to GitHub**: `git push origin main`
4. **Vercel auto-deploys** your changes (takes 1-3 minutes)
5. **Check deployment** at https://vercel.com/mikeazimi-dischubcoms-projects/sellable-view

## 🛠️ Useful Commands

```bash
# Check Vercel login status
vercel whoami

# List all deployments
vercel ls

# Check project info
vercel project ls

# View deployment logs
vercel logs <deployment-url>

# Pull environment variables from Vercel
vercel env pull

# Check build locally before deploying
pnpm build
```

## 🌿 Branch Deployments

- **main** branch → Production deployment (https://sellable-view.vercel.app)
- **other branches** → Preview deployments (unique URL for each)

## 🔐 Environment Variables

### Required Environment Variables

**ShipHero API Configuration:**
- `SHIPHERO_REFRESH_TOKEN` - Your ShipHero developer user refresh token
- `SHIPHERO_CUSTOMER_ACCOUNT_ID` - (Optional) Customer account ID to filter data for 3PL operations

### Setting Environment Variables

1. **Via Vercel Dashboard**: https://vercel.com/mikeazimi-dischubcoms-projects/sellable-view/settings/environment-variables
2. **Via CLI**: `vercel env add SHIPHERO_REFRESH_TOKEN`
3. **Pull locally**: `vercel env pull .env.local`

### Local Development

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your ShipHero credentials.

## ✅ Verification Checklist

- [x] Git remote configured to GitHub
- [x] Vercel CLI installed and logged in
- [x] Project linked to Vercel
- [x] .gitignore file created
- [x] Build scripts in package.json
- [x] Automatic deployments enabled

## 📞 Troubleshooting

If automatic deployments aren't working:
1. Check GitHub integration: https://vercel.com/mikeazimi-dischubcoms-projects/sellable-view/settings/git
2. Verify branch is set to `main` in Vercel settings
3. Check build logs: https://vercel.com/mikeazimi-dischubcoms-projects/sellable-view/deployments

---

**Note**: Since Vercel is already hooked up to GitHub, pushing to `main` will automatically deploy. No additional CLI commands needed unless you want manual control!

