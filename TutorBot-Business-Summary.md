# TutorBot

TutorBot is an AI-powered student support platform built for Victorian Curriculum tutoring. It handles two critical jobs: it gives students instant answers and gives schools a structured, reliable way to deliver safe learning support at scale.

## How It Works

The system is designed for practical school operations: fast student responses, controlled AI behavior, and persistent learning history.

### The Student Chat
When a student sends a question, TutorBot processes it through a curriculum-aware AI flow. The assistant responds with concise, age-appropriate explanations and can continue multi-turn conversations in the same session.

### File-Assisted Learning
Students can upload learning materials (PDF, DOC/DOCX, TXT, MD). TutorBot extracts text and switches to file-assisted mode:
- Strict grounding: responses are based only on extracted file context.
- If information is missing, the assistant explicitly says it is not found in the uploaded file.
- Scope options:
  - Subject scope: answers stay aligned to the active learning context.
  - General scope: answers can use file content across broader topics.

### Safety and Quality Controls
TutorBot is built with practical guardrails for education use:
- Authentication required for chat access.
- Session-based chat history per user.
- Defensive API error handling with safe user-facing messages.
- Provider fallback support for reliability under AI service pressure.
- Simplified explanation style is trigger-based only (for example, "explain like I'm 10").

### Session Operations
TutorBot includes operational controls that mirror production workflows:
- Recent sessions sidebar for fast context switching.
- New chat session flow.
- Session deletion with confirmation modal (industry-standard destructive action protection).

## Platform and Data Flow

TutorBot is built on modern, low-ops infrastructure:
- Frontend: Next.js App Router + TypeScript
- Auth and persistence: Supabase (sessions and messages)
- AI orchestration: Gemini with fallback handling
- File extraction API: upload and text extraction pipeline for grounded answers

## Why This Matters for the Business

### Faster Student Support
Students get immediate answers outside class hours, reducing wait times for routine questions.

### Better Staff Leverage
Common explanatory workload is automated, so teachers can focus on high-value interventions and classroom outcomes.

### Controlled AI Behavior
File-grounded mode and explicit safety behavior reduce hallucination risk for school-facing usage.

### Visibility and Continuity
Persistent sessions provide a practical record of student interactions and support continuity across learning conversations.

## Best-Fit Use Cases

- Homework support and revision guidance
- After-hours student Q&A
- File-based review of lesson resources
- Early-stage AI tutoring rollout in schools with low operational overhead

## Deployment Readiness Note

Feature-wise, TutorBot is ready for deployment. Before production release, run final local checks:
- `npm run typecheck`
- `npm run lint`
- `npm run build`

This final gate confirms environment-specific build health before going live.
