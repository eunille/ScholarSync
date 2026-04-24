# 🎓 AI Subject Tutor - Victorian Curriculum

> **Production-ready MVP** built in one day for Victoria Education demonstration.  
> 100% free tier hosting • Gemini AI • Student authentication • Chat history persistence

![Next.js 16](https://img.shields.io/badge/Next.js-16-black) ![Google Gemini](https://img.shields.io/badge/AI-Gemini%202.0-blue) ![Supabase](https://img.shields.io/badge/Database-Supabase-green) ![Free](https://img.shields.io/badge/Cost-$0-success)

---

## ✨ What This Does

An AI-powered tutoring chatbot that answers student questions for **Maths, Science, and English** — grounded only in the Victorian Curriculum so it never teaches off-syllabus content.

---

## 🚀 Quick Start (5 minutes)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/ai-tutor.git
cd tutorbot
npm install
```

### 2. Get Free API Keys

- **Google AI API Key** (FREE): https://aistudio.google.com/apikey
- **Supabase Project** (FREE): https://supabase.com/dashboard

### 3. Set Up Database

1. Create a Supabase project
2. Go to **SQL Editor**
3. Run `supabase-schema.sql` from this repo

### 4. Configure Environment

Create `.env.local` (copy from `.env.local.example`):

```env
GOOGLE_AI_API_KEY=your_google_ai_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

📖 **Detailed setup:** See SETUP.md  
🚀 **Deploy to production:** See DEPLOY.md  
🧭 **Business summary:** See TutorBot-Business-Summary.md

---

## 🎯 Features

✅ Student Authentication - Email/password signup & login  
✅ 3 Subjects - Maths, Science, English  
✅ Victorian Curriculum Grounded - Every response cites the curriculum  
✅ Chat History - Persists per user, per subject  
✅ Subject Switching - Seamless with history preservation  
✅ Dark Mode - Built-in theme toggle  
✅ Mobile Responsive - Works on all devices  
✅ Real-time Chat - Powered by Google Gemini 2.0 Flash  
✅ Error Boundaries - Graceful error handling  
✅ Loading States - Skeleton screens for better UX  

---

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **AI:** Google Gemini 2.0 Flash (FREE 1.5M tokens/day)
- **Database:** Supabase Postgres (FREE tier)
- **Auth:** Supabase Auth
- **Hosting:** Vercel (FREE tier)

**Total Cost: $0** (free tiers cover ~500 active students)

---

## 📁 Project Structure

```
tutorbot/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/page.tsx        # Student login
│   ├── signup/page.tsx       # Student signup
│   ├── chat/page.tsx         # Main chat interface
│   ├── api/chat/route.ts     # AI chat API
│   ├── error.tsx             # Error boundary
│   └── loading.tsx           # Loading state
├── components/
│   ├── ChatMessage.tsx       # Message bubble
│   ├── ChatInput.tsx         # Input field
│   ├── SubjectTabs.tsx       # Subject switcher
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── gemini.ts             # Google AI
│   └── curriculum-prompts.ts # System prompts
├── proxy.ts                  # Auth middleware
├── supabase-schema.sql       # Database schema
├── SETUP.md                  # Setup guide
└── DEPLOY.md                 # Deployment guide
```

---

## 🚀 Deployment

Deploy to Vercel in 10 minutes:

```bash
git push origin main
npm install -g vercel
vercel --prod
```

**Full guide:** DEPLOY.md

---

## 💰 Cost

**Free Tier:** $0/mo (up to 500 students)  
**Paid Tier:** ~$50/mo (1000+ students)

---

## 📄 License

MIT License - Free to use and modify

---

**Built in one day. Deployed for free. Ready for 500 students. 🚀**
