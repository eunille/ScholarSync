# 🎓 AI Subject Tutor - Setup Guide

## Quick Start (5 minutes)

### 1. Get Google AI API Key (FREE)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)

### 2. Create Supabase Project (FREE)

1. Go to [Supabase](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose a name, password, and region
4. Wait ~2 minutes for setup

### 3. Get Supabase Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### 4. Run Database Schema

1. In Supabase, go to **SQL Editor**
2. Click "New Query"
3. Paste the contents of `supabase-schema.sql` from this repo
4. Click "Run" or press `Ctrl+Enter`

### 5. Add Environment Variables

1. Open `.env.local` in this project
2. Replace the placeholder values:

```env
GOOGLE_AI_API_KEY=AIza_your_real_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ_your_real_anon_key_here
```

### 6. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Testing the App

1. **Signup** → Create an account with any email/password
2. **Chat** → Select a subject (Maths/Science/English)
3. **Ask** → Type a question about the Victorian Curriculum
4. **Switch** → Click different subject tabs to change topics

---

## Troubleshooting

### "GOOGLE_AI_API_KEY environment variable is required"
→ Make sure `.env.local` exists and has the correct API key

### "Failed to send message"
→ Check that your Google AI API key is valid and active

### "Unauthorized" or auth errors
→ Make sure you ran the `supabase-schema.sql` in your Supabase project

### Database errors
→ Verify the Supabase URL and anon key are correct in `.env.local`

---

## Project Structure

```
tutorbot/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/page.tsx        # Login page
│   ├── signup/page.tsx       # Signup page
│   ├── chat/page.tsx         # Chat interface
│   └── api/chat/route.ts     # AI chat API endpoint
├── components/
│   ├── ChatMessage.tsx       # Message bubble
│   ├── ChatInput.tsx         # Input field
│   └── SubjectTabs.tsx       # Subject switcher
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── gemini.ts             # Google AI integration
│   └── curriculum-prompts.ts # System prompts
├── proxy.ts                  # Auth middleware
└── supabase-schema.sql       # Database schema
```

---

## Deploy to Vercel (FREE)

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repo
4. Add environment variables (same as `.env.local`)
5. Deploy!

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **AI**: Google Gemini 2.0 Flash (FREE - 1.5M tokens/day)
- **Database**: Supabase (FREE tier)
- **Auth**: Supabase Auth
- **Hosting**: Vercel (FREE tier)

**Total Cost: $0** 💰

---

## Features

✅ Student authentication (email/password)  
✅ 3 subjects (Maths, Science, English)  
✅ Victorian Curriculum-grounded responses  
✅ Chat history persistence  
✅ Subject switching  
✅ Dark mode  
✅ Mobile responsive  
✅ Real-time chat  

---

## Credits

Built for Victoria Education AI tutoring initiative.
