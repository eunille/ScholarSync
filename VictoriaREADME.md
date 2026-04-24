# 🎓 AI Subject Tutor — Victoria Education

> An AI-powered tutoring chatbot grounded in the **Victorian Curriculum**, built for schools that want to provide 24/7 student support without burning out teachers.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)
![Claude API](https://img.shields.io/badge/Claude-claude--sonnet--4--5-orange?logo=anthropic)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

---

## 🧠 What This Is

A **production-ready AI tutor web app** that answers student questions across Maths, Science, and English — grounded only in Victorian Curriculum content so it never teaches off-syllabus.

Built for **Client 1 (Victoria Education sector)** to demonstrate AI tutoring capability as part of an AI pioneer initiative.

---

## ✨ Features

- 🤖 **Curriculum-grounded answers** — every response cites the Victorian Curriculum standard
- 📚 **3 subjects** — Maths, Science, English (easily expandable)
- 💬 **Conversational memory** — multi-turn chat per session
- 🔐 **Per-student auth** — Supabase Auth (email/password or Google SSO)
- 📊 **Chat history stored** — Supabase Postgres, per user
- 🌙 **Dark mode** — built-in with Tailwind
- 📱 **Mobile-first** — responsive for student devices
- ⚡ **Deployable in < 30 minutes** to Vercel (free tier)

---

## 🛠 Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router) | Fast, SSR, easy deploy |
| Styling | Tailwind CSS + shadcn/ui | Polished UI fast |
| AI | Anthropic Claude API (`claude-sonnet-4-5`) | Best reasoning for education |
| Database | Supabase Postgres | Chat history, user data |
| Auth | Supabase Auth | Student login, Google SSO |
| Hosting | Vercel | Free, auto-deploy from GitHub |

---

## 📁 Project Structure

```
ai-subject-tutor/
├── app/
│   ├── layout.tsx              # Root layout, font, theme
│   ├── page.tsx                # Landing / subject selector
│   ├── chat/
│   │   └── [subject]/
│   │       └── page.tsx        # Chat interface per subject
│   └── api/
│       └── chat/
│           └── route.ts        # Claude API route handler
├── components/
│   ├── ChatWindow.tsx          # Message list + scroll
│   ├── MessageBubble.tsx       # Student / AI message
│   ├── SubjectPill.tsx         # Subject switcher
│   └── SourceTag.tsx           # "Victorian Curriculum" badge
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── claude.ts               # Anthropic client wrapper
│   └── curriculum-prompts.ts   # System prompts per subject
├── middleware.ts               # Auth protection
├── .env.local                  # Secrets (never commit)
└── README.md
```

---

## 🚀 Deploy Today (< 30 min)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/ai-subject-tutor.git
cd ai-subject-tutor
npm install
```

### 2. Set Up Supabase (free)

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **anon key** from Settings → API
3. Run this SQL in the Supabase SQL editor:

```sql
-- Chat sessions table
create table chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  subject text not null,
  created_at timestamptz default now()
);

-- Messages table
create table messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table chat_sessions enable row level security;
alter table messages enable row level security;

-- Policies: users see only their own data
create policy "Users see own sessions" on chat_sessions
  for all using (auth.uid() = user_id);

create policy "Users see own messages" on messages
  for all using (
    session_id in (
      select id from chat_sessions where user_id = auth.uid()
    )
  );
```

### 3. Get Your Claude API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Note: Uses `claude-sonnet-4-5` (best balance of speed + intelligence)

### 4. Configure Environment

Create `.env.local` in the project root:

```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # For server-side operations
```

### 5. Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

### 6. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add all env vars in the Vercel dashboard → Settings → Environment Variables.

Or connect your GitHub repo for **automatic deploys on every push**.

---

## 🤖 How the AI Is Prompted

The key differentiator: the bot is **curriculum-locked**. It won't go off-topic or hallucinate content outside the Victorian Curriculum.

```typescript
// lib/curriculum-prompts.ts

export const systemPrompts: Record<string, string> = {
  maths: `
    You are an AI Maths tutor for Victorian students (Years 7–10).
    You answer ONLY questions grounded in the Victorian Curriculum F–10 v2.0 Mathematics strand.
    After every answer, cite the relevant curriculum strand, e.g.:
    "Source: Victorian Curriculum — Number and Algebra, Year 8"
    If a question is outside the curriculum, say:
    "That's outside what I'm set up to cover — ask your teacher for that one!"
    Keep language simple, clear, and encouraging.
  `,

  science: `
    You are an AI Science tutor for Victorian students (Years 7–10).
    You answer ONLY questions grounded in the Victorian Curriculum F–10 v2.0 Science strand.
    Cite the relevant strand: Science Understanding, Science Inquiry Skills, or Science as a Human Endeavour.
    Never speculate beyond curriculum content.
  `,

  english: `
    You are an AI English tutor for Victorian students (Years 7–10).
    You answer ONLY questions grounded in the Victorian Curriculum F–10 v2.0 English strand.
    Help with reading, writing, speaking and listening as defined in the curriculum.
    Cite the relevant sub-strand after each answer.
  `,
};
```

---

## 📡 API Route

```typescript
// app/api/chat/route.ts

import Anthropic from "@anthropic-ai/sdk";
import { systemPrompts } from "@/lib/curriculum-prompts";

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages, subject } = await req.json();

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: systemPrompts[subject] ?? systemPrompts.maths,
    messages,
  });

  return Response.json({
    content: response.content[0].type === "text"
      ? response.content[0].text
      : "",
  });
}
```

---

## 🔐 Auth Flow

Using Supabase Auth with middleware protection:

```typescript
// middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && req.nextUrl.pathname.startsWith("/chat")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}
```

---

## 🗺 Roadmap (Phase 2 — Tell the Client This)

| Feature | Description | Est. Time |
|---|---|---|
| 📄 PDF Upload (RAG) | Teachers upload lesson notes; bot answers from them | 1 week |
| 📊 Student Dashboard | Which concepts are asked most, per class | 1 week |
| 🏫 Admin Panel | School admin manages subjects, students, content | 2 weeks |
| 🔔 Teacher Alerts | Notify teacher when student is repeatedly stuck | 3 days |
| 🎯 Year Level Selector | Tailor responses to Year 7–12 | 2 days |

---

## 💰 Cost Estimate

| Item | Cost |
|---|---|
| Vercel (hosting) | Free (Hobby) |
| Supabase (database + auth) | Free (up to 500MB, 50k MAU) |
| Claude API | ~$0.003 per student question (Sonnet 4) |
| **School of 500 students, 10 questions/day** | **~$4.50/day** |

---

## 📋 Requirements

- Node.js 18+
- npm or pnpm
- Supabase account (free)
- Anthropic API key
- Vercel account (free, for deployment)

---

## 👨‍💻 Built By

Developed as a demonstration project for **Victoria Education AI Pioneer initiative**.

---

## 📄 License

MIT — use freely, adapt for any school.
