# 🚀 Deployment Guide - Vercel (FREE)

## Prerequisites

✅ Code pushed to GitHub  
✅ Working local setup (tested with real API keys)  
✅ Supabase project created with schema deployed  

---

## Step 1: Push to GitHub

```bash
# Initialize git if not already
git init
git add .
git commit -m "Initial commit - AI Subject Tutor MVP"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/ai-tutor.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js
5. **Don't deploy yet** - add environment variables first

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (will prompt for settings)
vercel --prod
```

---

## Step 3: Add Environment Variables

In Vercel Dashboard → **Settings** → **Environment Variables**, add:

| Variable | Value | Environment |
|---|---|---|
| `GOOGLE_AI_API_KEY` | `AIza...` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Production, Preview |

**Important:** Check **both** "Production" and "Preview" for each variable.

---

## Step 4: Configure Supabase Redirect URLs

1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel domains to **Redirect URLs**:
   ```
   https://your-app.vercel.app/chat
   https://your-app-git-main-yourname.vercel.app/chat
   ```
3. Add to **Site URL**:
   ```
   https://your-app.vercel.app
   ```

---

## Step 5: Deploy

Click **"Deploy"** in Vercel Dashboard or run:

```bash
vercel --prod
```

Build will take ~2 minutes. ✨

---

## Step 6: Test Deployment

1. Visit your Vercel URL (e.g., `https://ai-tutor-xyz.vercel.app`)
2. Test signup flow
3. Test login
4. Test chat for all 3 subjects
5. Test subject switching
6. Test logout

---

## Post-Deployment Checklist

- [ ] Signup works
- [ ] Login works
- [ ] Chat responds with AI messages
- [ ] Subject switching persists history
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] Error handling works
- [ ] Logout works

---

## Troubleshooting

### Build Fails

**Error:** `Module not found`  
→ Check `package.json` has all dependencies  
→ Run `npm install` locally first

**Error:** Environment variables missing  
→ Verify all 3 env vars are set in Vercel dashboard  
→ Make sure both Production + Preview are checked

### Auth Errors After Deploy

**Error:** "Invalid Redirect URL"  
→ Add your Vercel URL to Supabase redirect URLs (see Step 4)

**Error:** "Session expired immediately"  
→ Check Supabase URL/keys are correct  
→ Verify `.env.local` values match Vercel environment variables

### AI Chat Not Working

**Error:** "GOOGLE_AI_API_KEY environment variable is required"  
→ Verify API key is set in Vercel  
→ Redeploy after adding env vars

**Error:** "Failed to send message"  
→ Check Google AI API key is valid  
→ Verify free tier quota not exceeded (1.5M tokens/day)

---

## Custom Domain (Optional)

1. In Vercel → **Settings** → **Domains**
2. Add your domain (e.g., `tutor.yourdomain.com`)
3. Update DNS records (Vercel provides instructions)
4. Update Supabase redirect URLs with new domain

---

## Monitoring & Logs

- **Vercel Dashboard** → **Deployments** → Click deployment → **Functions** tab
- View API route logs for debugging
- Check build logs if deployment fails

---

## Cost Breakdown (FREE Tier Limits)

| Service | Free Tier | Limit |
|---|---|---|
| Vercel | Hobby Plan | Unlimited personal projects |
| Supabase | Free | 500MB database, 50k MAU |
| Google AI | Free | 1.5M tokens/day (Gemini Flash) |

**Est. Monthly Cost: $0** (up to ~500 active students)

---

## Scaling (When Needed)

If you exceed free tiers:

- **Vercel Pro** ($20/mo) - More bandwidth, faster builds
- **Supabase Pro** ($25/mo) - More storage, backups
- **Google AI Pay-as-you-go** - ~$0.10 per 1M tokens

**Est. for 1000 students:** ~$50/mo total

---

## Production Hardening (Future)

For real school deployment, add:

- [ ] Rate limiting (Vercel middleware)
- [ ] Student email verification
- [ ] Teacher admin panel
- [ ] Analytics (Vercel Analytics or Google Analytics)
- [ ] Content moderation
- [ ] Backup strategy
- [ ] Custom domain with SSL
- [ ] Error monitoring (Sentry)

---

## Quick Deploy Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview (test before production)
vercel

# Check deployment logs
vercel logs YOUR_DEPLOYMENT_URL

# Roll back to previous deployment
vercel rollback
```

---

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Google AI Docs: https://ai.google.dev/docs

---

**Ready to demo! 🎉**

Share your Vercel URL with stakeholders for testing.
