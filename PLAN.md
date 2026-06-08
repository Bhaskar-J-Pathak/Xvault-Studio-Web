# XVault Studio Web — Master Plan
> Started: May 27, 2026 | Hard deadline: June 27, 2026 | 31 days

---

## What We Are Building

A single Next.js project that is two things at once:

1. **The XVault Studio website** — marketing, auth, pricing, account management (replaces xvault.dev)
2. **The full browser-based writing app** — everything the desktop app does, running in the browser with no install required

The web app must feel better than the desktop app, not like a downgrade. The core loop — open project, write, Story Bible updates, co-author suggests — must be seamless and fast.

**Hard deadline: June 27, 2026.** Real users, real revenue.

---

## The Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | SSR + API routes + file-based routing in one project |
| Language | TypeScript | Same as desktop app |
| Styling | Tailwind CSS v4 + shadcn/ui | Same design system as existing xvault site |
| Editor | Lexical | Same engine as desktop app — proven, extensible |
| State | Zustand | Same as desktop app |
| Database | Supabase (Postgres + pgvector) | Auth + DB + vector search — replaces ChromaDB |
| Animations | Framer Motion + GSAP | Marketing pages |
| Fonts | Geist Sans + EB Garamond | Same as existing site |

---

## AI API Routing

| Feature | API | Model |
|---|---|---|
| Story Bible embeddings | Gemini | `text-embedding-004` (768-dim, free) |
| AI Co-author (streaming) | Gemini | `gemini-2.0-flash` |
| World Board entity extraction | OpenRouter | `meta-llama/llama-3.1-8b-instruct:free` |
| Dead branch detection | OpenRouter | `qwen/qwen3-8b:free` |
| Beta reader analysis | OpenRouter | `mistralai/mistral-7b-instruct:free` |
| Style memory analysis | OpenRouter | `meta-llama/llama-3.1-8b-instruct:free` |

OpenRouter calls fallback to next available free model if one is at capacity.

---

## Route Structure

```
/ (marketing)
/pricing
/auth
/auth/callback
/dashboard
/account

/studio                          — Project list (protected)
/studio/[projectId]              — Opens last active chapter
/studio/[projectId]/[chapterId]  — Editor view

/api/ai/story-bible              — Gemini embed + pgvector query
/api/ai/co-author                — Gemini streaming
/api/ai/threads                  — OpenRouter plot thread extraction
/api/ai/worldboard               — OpenRouter entity extraction
/api/dodo-webhook                — Dodo payment events
/api/account/delete              — Account deletion
```

---

## Database Schema (Supabase + pgvector)

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- User profiles (one per auth.user)
CREATE TABLE profiles (
  id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                  TEXT NOT NULL,
  plan                   TEXT NOT NULL DEFAULT 'free'
                           CHECK (plan IN ('free','pro','pro_plus','ultra')),
  ai_requests_this_month INT NOT NULL DEFAULT 0,
  ai_requests_total      INT NOT NULL DEFAULT 0,
  requests_reset_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_ends_at          TIMESTAMPTZ,                 -- signup + 28 days
  onboarding_step        INT NOT NULL DEFAULT 0,      -- tutorial progress
  onboarding_done        BOOLEAN NOT NULL DEFAULT false,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects
CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  genre        TEXT,
  is_sample    BOOLEAN NOT NULL DEFAULT false,
  settings     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chapters
CREATE TABLE chapters (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      JSONB,                      -- Lexical editor state (serialized)
  word_count   INT NOT NULL DEFAULT 0,
  position     INT NOT NULL DEFAULT 0,     -- ordering
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Story Bible chunks (vector search)
CREATE TABLE story_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id   UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  embedding    VECTOR(768),                -- Gemini text-embedding-004
  chunk_index  INT NOT NULL DEFAULT 0,
  word_start   INT NOT NULL DEFAULT 0,    -- word position in document
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON story_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Plot threads (dead branch detection)
CREATE TABLE plot_threads (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description             TEXT NOT NULL,
  introduced_chapter_id   UUID REFERENCES chapters(id) ON DELETE SET NULL,
  last_seen_chapter_id    UUID REFERENCES chapters(id) ON DELETE SET NULL,
  last_seen_word_position INT NOT NULL DEFAULT 0,
  total_project_words     INT NOT NULL DEFAULT 0,   -- words at time of last check
  status                  TEXT NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open','resolved','dead')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- World Board entities
CREATE TABLE entities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'character',   -- character | location | faction | item | event
  description  TEXT,
  attributes   JSONB NOT NULL DEFAULT '{}',
  position     JSONB NOT NULL DEFAULT '{"x":0,"y":0}',  -- canvas position
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- World Board relationships
CREATE TABLE relationships (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_id    UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  target_id    UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  label        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cork board cards
CREATE TABLE cork_cards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        TEXT,
  content      TEXT,
  color        TEXT NOT NULL DEFAULT '#1c1917',
  position     JSONB NOT NULL DEFAULT '{"x":0,"y":0}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Style memory (per project)
CREATE TABLE style_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  pov                 TEXT,
  tense               TEXT,
  sentence_length     TEXT,
  dialogue_ratio      TEXT,
  description_density TEXT,
  tone                TEXT,
  vocabulary_level    TEXT,
  sample_sentences    JSONB NOT NULL DEFAULT '[]',
  analyzed_at_words   INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Persistent chat memory (per project)
CREATE TABLE chat_memories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  summary      TEXT NOT NULL,
  tags         TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pre-built sample projects (seeded once at deploy, not per-user)
CREATE TABLE sample_projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genre        TEXT NOT NULL UNIQUE,   -- fantasy | scifi | thriller | romance
  title        TEXT NOT NULL,
  chapters     JSONB NOT NULL,         -- [{title, content (plain text), word_count}]
  chunks       JSONB NOT NULL,         -- [{content, embedding (float[]), chunk_index, word_start}]
  entities     JSONB NOT NULL,         -- [{name, type, description, attributes, position}]
  relationships JSONB NOT NULL,        -- [{source_name, target_name, label}]
  threads      JSONB NOT NULL          -- [{description, introduced_chapter, last_seen_chapter, status}]
);
```

### Plan limits (checked server-side in API routes.)

| Plan | Requests/month | Trial |
|---|---|---|
| free (post-trial) | 50 | — |
| pro | 500 | — |
| pro_plus | 2,000 | — |
| ultra | 10,000 | — |
| **trial** | **Unlimited** | **28 days from signup** |

Trial = `trial_ends_at IS NOT NULL AND trial_ends_at > now()`.
During trial, all Pro+ features are unlocked regardless of `plan` column.

---

## Onboarding System

### Trial
- Signup → `trial_ends_at = now() + 28 days`
- During trial: full Pro+ access, no request cap
- At trial end: graceful downgrade (not a hard wall), upgrade prompt appears
- User can still write, still use editor — just AI calls are rate-limited

### Sample Project
At first login, immediately seed a sample project based on genre choice:

```
Genre picker (4 options) → seed from sample_projects table →
insert project + chapters + chunks (pre-computed) + entities + threads
→ open editor at Chapter 1 → begin tutorial
```

Sample project is ~10,000 words across 3 chapters, written to demo every feature:
- Chapter 1: introduces 3 characters, 2 locations, 1 mystery — plants 2 plot threads
- Chapter 2: develops relationships, advances 1 thread, **ignores the other** (dead branch)
- Chapter 3: scene-level writing, ends on a hook — dead branch is now 4,000 words old

Pre-computed embeddings are stored in `sample_projects.chunks` so Story Bible works instantly on first load.

### Interactive Tutorial (Sudowrite-style)

Each step dims the background, spotlights one UI element, gives a one-line instruction, and **blocks until the user performs the action**.

```
Step 0   Genre picker ("Pick a world to write in")
Step 1   Sidebar spotlight → "Click Chapter 1 to open it" [blocks: click]
Step 2   Editor spotlight → "This is your writing space. Read the first paragraph."
         [auto-advances after 4s]
Step 3   Story Bible panel spotlight → "See these passages? They update as you write.
         Type a new sentence anywhere and watch." [blocks: type + pause]
Step 4   Story Bible updated → "It found related content automatically."
         [auto-advances after 2s]
Step 5   Co-author trigger spotlight → "XVault can continue the story.
         Press Ctrl+Enter." [blocks: Ctrl+Enter]
Step 6   Ghost text spotlight → "Press Tab to accept, Escape to dismiss." [blocks: Tab or Esc]
Step 7   Threads tab spotlight → "Your plot threads are tracked automatically.
         Click the Threads tab to see the dead branch XVault detected." [blocks: click]
Step 8   World Board button spotlight → "Your characters and locations are mapped here.
         Click to see them." [blocks: click]
Step 9   Tutorial complete → "28 days of full access. No credit card.
         Start your own story or keep exploring." [CTA buttons]
```

Tutorial state stored in `profiles.onboarding_step` + `onboarding_done`.
Dismissible at any time. Resumable from Help menu. Never shown again once complete.

---

## The Proactive Co-Author Architecture

The key upgrade over the desktop app. The system does not wait to be asked.

```
User is typing
  │
  ├─ 800ms pause
  │    └─ Story Bible: embed current cursor context → pgvector query → update panel
  │
  ├─ Every 2,000 words written (cumulative)
  │    └─ Plot thread extractor runs (OpenRouter)
  │         → Parses new text for: introduced threads, resolved threads, new characters
  │         → Updates plot_threads table
  │         → If any thread gap > 3,000 words → mark status = 'dead'
  │         → Dead branch badge appears in Threads tab (not a popup, never interrupts writing)
  │
  ├─ Chapter save
  │    └─ If style_profile.analyzed_at_words is 1,500+ behind current word count:
  │         → Run style analysis (OpenRouter) → update style_profiles
  │
  └─ Ctrl+Enter (user-triggered)
       └─ Co-author: sends last 800 words + style profile + relevant Story Bible passages
            → Gemini streaming → ghost text appears
```

Dead branches appear as quiet badges in the Threads tab — they never interrupt the writing flow. The writer notices on their own and decides what to do.

---

## Part 1: Website Build Order

| Phase | Task | Status |
|---|---|---|
| 1.1 | Project scaffold (Next.js, Tailwind, shadcn, fonts, env) | ⬜ |
| 1.2 | Supabase client + auth helpers + database migrations | ⬜ |
| 1.3 | Auth pages (`/auth`, `/auth/callback`) | ⬜ |
| 1.4 | Landing page (Navbar, Hero, Features, HowItWorks, Pricing preview, FAQ, Footer) | ⬜ |
| 1.5 | Dashboard page (`/dashboard`) | ⬜ |
| 1.6 | Pricing page (`/pricing`) | ⬜ |
| 1.7 | Account page (`/account`) | ⬜ |
| 1.8 | Dodo webhook (`/api/dodo-webhook`) | ⬜ |

---

## Part 2: Web App Build Order

| Phase | Task | Status |
|---|---|---|
| 2.1 | Sample project content — write 3 chapters (~10k words) + seed script | ⬜ |
| 2.2 | Genre picker + sample project seeding on first login | ⬜ |
| 2.3 | Project list page (`/studio`) | ⬜ |
| 2.4 | Sidebar — project + chapter management | ⬜ |
| 2.5 | Zen Editor (Lexical, auto-save, word count, theme) | ⬜ |
| 2.6 | Story Bible — Gemini embed + pgvector + panel | ⬜ |
| 2.7 | AI Co-author — Gemini streaming + ghost text (Tab to accept) | ⬜ |
| 2.8 | Proactive plot thread tracker + dead branch detection | ⬜ |
| 2.9 | Tutorial overlay (spotlight + step logic, all 9 steps) | ⬜ |
| 2.10 | World Board — OpenRouter extraction + React Flow graph | ⬜ |
| 2.11 | Cork Board — drag-and-drop cards (dnd-kit) | ⬜ |
| 2.12 | Sprint Mode — fullscreen, goal, word-delta HUD | ⬜ |
| 2.13 | Export — PDF (jsPDF) + DOCX (docx) | ⬜ |
| 2.14 | Adaptation Agents — Screenplay, Webtoon, Blurb via Gemini | ⬜ |
| 2.15 | AI Beta Reader — full story analysis report | ⬜ |
| 2.16 | Style Memory — auto voice profile + injection into AI prompts | ⬜ |
| 2.17 | Ambient Music Player | ⬜ |

---

## 31-Day Calendar

```
Week 1  (May 27 – Jun 2)   Foundation
  Day 1  →  1.1 + 1.2 (scaffold + Supabase + migrations)
  Day 2  →  1.3 (auth flow)
  Day 3  →  1.4 (landing page — take real time here)
  Day 4  →  1.4 continued (landing page polish)
  Day 5  →  1.5 + 1.6 + 1.7 (dashboard, pricing, account)
  Day 6  →  1.8 (Dodo webhook) + 2.1 (write sample project content)
  Day 7  →  2.1 continued (finalize sample + seed script)

Week 2  (Jun 3 – Jun 9)    Core App
  Day 8  →  2.2 (genre picker + sample seeding on first login)
  Day 9  →  2.3 + 2.4 (project list + sidebar)
  Day 10 →  2.5 (Zen Editor foundation)
  Day 11 →  2.5 continued (auto-save, word count, keyboard shortcuts)
  Day 12 →  2.6 (Story Bible — embed + search + panel)
  Day 13 →  2.6 continued (polish, loading states)
  Day 14 →  Buffer / catch-up

Week 3  (Jun 10 – Jun 16)  AI Layer
  Day 15 →  2.7 (AI Co-author + ghost text)
  Day 16 →  2.7 continued (Tab/Esc, inline edits)
  Day 17 →  2.8 (plot thread extractor)
  Day 18 →  2.8 continued (dead branch detection + Threads tab)
  Day 19 →  2.9 (tutorial overlay — all 9 steps)
  Day 20 →  2.9 continued + 2.10 (World Board basics)
  Day 21 →  Buffer / catch-up

Week 4  (Jun 17 – Jun 23)  Polish + Features
  Day 22 →  2.11 (Cork Board)
  Day 23 →  2.12 (Sprint Mode) + 2.13 (Export PDF + DOCX)
  Day 24 →  2.14 (Adaptation Agents)
  Day 25 →  2.15 (Beta Reader) + 2.16 (Style Memory)
  Day 26 →  2.17 (Music Player) + full bug sweep
  Day 27 →  Mobile responsiveness + loading states audit

Final stretch  (Jun 24 – Jun 27)
  Day 28 →  SEO, OG images, performance audit
  Day 29 →  Staging deploy + full end-to-end test
  Day 30 →  Fix issues found in staging
  Day 31 →  Launch: ProductHunt + Reddit + Twitter/X + Show HN
```

---

## Launch Distribution Plan

| Channel | What to post |
|---|---|
| ProductHunt | Full product listing — tagline: "The writing app that reads your story as you write it" |
| Reddit r/writing | Show your work post — lead with the dead branch detection demo |
| Reddit r/worldbuilding | World Board demo — the entity graph angle |
| Reddit r/nanowrimo | Sprint Mode + Story Bible — the "write faster, stay consistent" angle |
| Twitter/X | Short screen recording demo — Story Bible updating in real time |
| Hacker News Show HN | Technical angle — Gemini embeddings + pgvector for semantic story consistency |
| Writing Discord servers | Direct outreach — offer extended trial |

---

## Non-Negotiable Quality Rules

1. **Nothing ships broken.** Every phase is tested end-to-end before moving on.
2. **Every loading state has a fallback.** No spinners with no timeout.
3. **Every AI call has a cost guard.** Server-side plan check before calling any model.
4. **Service role key never touches the client.** Only in API routes.
5. **Auto-save is silent.** No "Saving..." text that interrupts writing flow.
6. **The tutorial is skippable but resumable.** Never trap the user.
7. **Trial end is graceful.** The editor still works. Only AI features are rate-limited.
8. **Model names are never shown to users.** Only: "Powerful AI", "Advanced AI", "Best-in-class AI".

---

## Environment Variables

```
# Supabase (client-safe)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase (server only — never expose)
SUPABASE_SERVICE_ROLE_KEY=

# Gemini
GEMINI_API_KEY=

# OpenRouter
OPENROUTER_API_KEY=

# Dodo Payments (server only)
DODO_WEBHOOK_SECRET=
DODO_PRODUCT_PRO=
DODO_PRODUCT_PRO_PLUS=
DODO_PRODUCT_ULTRA=

# Dodo checkout links (client-safe)
NEXT_PUBLIC_DODO_LINK_PRO=
NEXT_PUBLIC_DODO_LINK_PRO_PLUS=
NEXT_PUBLIC_DODO_LINK_ULTRA=
```

---

## Current Status

**Next action: Phase 1.1 — scaffold the project.**
