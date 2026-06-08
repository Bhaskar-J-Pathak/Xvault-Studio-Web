# Xvault Studio — Beta Launch Plan
> Written: June 1, 2026 | Target: Wednesday June 3, 2026 (private beta)
> Solo founder. 2 days. Real users. Keep costs under ₹2,000.

---

## Reality Check

Wednesday means 2 working days. The goal is a **private beta** — 10–30 invited testers,
not a public launch. Everything here is scoped to that.

What must work before any human touches the app:
1. Credits system (rate limiting wired) — without this you can go bankrupt overnight
2. Sample project with real content — without this testers see a blank screen and leave
3. Onboarding tutorial — without this testers don't understand what to do

What can ship rough or be deferred:
- Pricing/payments (Dodo) — testers won't pay on day 1 anyway
- Landing page polish
- Multiple genre samples (start with one)
- Email notifications

---

## Day-by-Day Build Order

### Monday June 1 — Credits + Rate Limiting
**Goal: no AI call is possible without credits being checked and deducted**

- [x] DB migration 004 — new `consume_ai_request` RPC with credit weights
- [x] Update `src/lib/supabase.ts` — new plan names, credit limits, trial config
- [x] Update `src/lib/rate-limit.ts` — accept `credits` parameter
- [x] Wire `checkRateLimit(userId, client, CREDITS.X)` into every AI route (5 routes)
- [x] Fix pre-existing TS error in `studio/[projectId]/[chapterId]/page.tsx`
- [x] Feedback button + `/api/feedback` route (floating button, appears on every page)

### Tuesday June 2 — Sample Project + Onboarding
**Goal: new user lands, picks a genre, gets dropped into a living sample project**

- [ ] Write sample project content (1 genre — Thriller, 3 chapters, ~2,500 words each)
- [ ] Write seed script `scripts/seed-sample.ts`
- [ ] Build genre picker component
- [ ] Build first-login detection + sample seeding logic
- [ ] Build `TutorialOverlay` component (8 steps)
- [ ] Basic `/pricing` page

### Wednesday June 3 — Integration + Testing
**Goal: full end-to-end run-through, fix everything that breaks**

- [ ] Full onboarding flow test (sign up → genre picker → sample loads → tutorial runs)
- [ ] Credits flow test (use credits → see balance drop → hit 0 → see upgrade prompt)
- [ ] WorldBoard test on sample project (entities should be pre-seeded, not extracted)
- [ ] Story Bible test on sample (embeddings pre-seeded, search works immediately)
- [ ] Co-author test (14 days trial, 100 credits, all 3 modes work)
- [ ] Fix all bugs found
- [ ] Send beta invites

---

## Credit System — Full Specification

### Core concept
1 credit ≈ $0.002 real cost. Everything is rounded to protect margin.
Users see "AI Credits" — never mention tokens, models, or dollar amounts.

### Plan configuration (replace current 4-tier system)

```
Trial:  14 days, 100 credits total (not monthly — one-time pool)
Free:   Post-trial with no upgrade = 15 credits/month (basically unusable, forces conversion)
Scribe: $9/month  → 300 credits/month
Pro:    $29/month → 1,200 credits/month
```

**Yearly pricing (push this — upfront cash is survival for a solo founder):**
```
Scribe yearly: $72/year ($6/month) — billed upfront
Pro yearly:    $264/year ($22/month) — billed upfront
```

**Plan name changes from current codebase:**
```
Current DB values  →  New values
"free"             →  "free"      (keep, post-trial fallback)
"pro"              →  "scribe"    (rename)
"pro_plus"         →  "pro"       (rename)
"ultra"            →  (remove for MVP)
```
> Note: the DB `plan` column CHECK constraint needs updating in the migration.
> Rename in DB, update `src/lib/supabase.ts`, `src/types/database.ts`.

### Credit costs per operation

| Operation | Credits | Real cost | Notes |
|---|---|---|---|
| Chat message | **1** | ~$0.001 | Subsidised — most important engagement feature |
| Short write / rewrite (Ctrl+K, ~300w) | **1** | ~$0.001 | Same as chat |
| Long write (Ctrl+K, ~2000w) | **2** | ~$0.002 | Cost-neutral |
| Global change scan | **3** | ~$0.005 | Slightly subsidised |
| WorldBoard extraction (auto, per trigger) | **4** | ~$0.014 | 2.5 Pro — must charge |
| WorldBoard re-extract (manual) | **10** | ~$0.039 | Close to real cost |
| Proactive observe | **0** | ~$0.0006 | Free — passive, drives engagement |
| Story Bible embed / search | **0** | $0 | Free — core differentiator |
| Character analysis (Story Bible) | **0** | ~$0.001 | Rare, keeps Bible feature frictionless |
| Synopsis generation | **0** | ~$0.001 | Rare, quality-of-life |

### Why WorldBoard costs credits but observe/bible don't
- Observe and Bible use Flash or free embeddings — sub-$0.001 per call, negligible
- WorldBoard uses Gemini 2.5 Pro — $0.014 per extraction, ~14x more expensive than Flash
- Auto-extraction fires every 1,500 words written, so a prolific writer could trigger
  it 10+ times in a session. At 4 credits each that's 40 credits — meaningful but fair.

### What 100 trial credits actually gets a tester

Realistic session (2-week trial, moderate writer):
- 30 chat messages × 1 = 30 credits
- 15 short writes × 1 = 15 credits
- 3 long writes × 2 = 6 credits
- ~8 WorldBoard auto-triggers × 4 = 32 credits
- Total: 83 credits used. Still has 17 left at end of trial.

Heavy writer (writes 10,000 words during trial):
- ~6 WorldBoard auto-triggers × 4 = 24 credits
- 20 chat messages × 1 = 20 credits
- 10 short writes × 1 = 10 credits
- Total: 54 credits used. Has plenty left.
- Conclusion: 100 credits is genuinely generous for a 14-day trial.

### Cost to serve 100 beta users

| Scenario | Total credits | Avg cost/credit | Total USD | Total INR |
|---|---|---|---|---|
| Conservative (50% utilisation) | 5,000 | $0.002 | $10 | ₹830 |
| Realistic (70% utilisation) | 7,000 | $0.002 | $14 | ₹1,160 |
| Worst case (everyone burns all 100) | 10,000 | $0.003 | $30 | ₹2,490 |

Gemini free tier absorbs most Flash calls (500 Flash req/day free).
Only WorldBoard Pro calls will be billed. At ~3 WorldBoard triggers per user across
14 days for 100 users = 300 total Pro calls = ~$4.20. Everything else is free tier.
**Realistic total cost: ₹500–1,200. Well within budget.**

### DB migration changes needed (Migration 004)

1. Update `consume_ai_request(p_user_id, p_credits INT DEFAULT 1)` — accept credit weight
2. Change trial logic: instead of unlimited, cap at 100 credits total (stored in new
   `trial_credits_used INT DEFAULT 0` column OR reuse `ai_requests_this_month`)
3. Update plan limits: free=15, scribe=300, pro=1200
4. Change trial from 28 days to 14 days in the profile creation trigger
5. Update the DB plan CHECK constraint to allow "scribe" instead of "ultra"

### API route wiring (6 files to update)

```
/api/ai/coauthor/chat/route.ts          → checkRateLimit(userId, client, 1)
/api/ai/coauthor/suggest/route.ts       → checkRateLimit(userId, client, mode === "write" && long ? 2 : 1)
/api/ai/coauthor/global-change/route.ts → checkRateLimit(userId, client, 3)
/api/ai/coauthor/observe/route.ts       → NO rate limit (free)
/api/ai/worldboard/route.ts             → checkRateLimit(userId, client, 4)
/api/ai/worldboard/reextract/route.ts   → checkRateLimit(userId, client, 10)
/api/ai/story-bible/*/route.ts          → NO rate limit (free)
```

### UI: credit balance display

- Show in the studio status bar (bottom of editor): "✦ 83 credits"
- When ≤20 credits remaining: turn amber, add "· Low"
- When 0: show upgrade modal (not a hard wall — let them finish current sentence)
- On the dashboard: show "X credits remaining · 8 days left" in the trial banner

---

## Sample Project — "The Glass Meridian" (Thriller)

One genre for MVP. Thriller chosen because:
- Universally accessible (no genre knowledge required)
- High tension = great for showcasing co-author suggestions
- Short, punchy sentences = easy to demo voice matching
- Clear characters = good World Board demo

### Project structure

```
Project title: "The Glass Meridian"
Genre: Thriller

Chapter 1: "The Call" (~2,500 words)
  - Introduces: Nadia Voss (protagonist, ex-intelligence analyst)
  - Introduces: Marcus Hale (Nadia's handler, morally grey)
  - Introduces: The Meridian Group (shadowy organisation — faction entity)
  - Setting: Nadia's apartment, then a diner in Prague
  - Opens: Nadia receives an encrypted message 6 years after her "retirement"
  - Ends: She agrees to one last job. Finds her old handler has been murdered.
  - Plants thread 1: Who sent the encrypted message? (OPEN — never resolved)
  - Plants thread 2: What happened to Nadia in Bucharest? (referenced but vague)

Chapter 2: "The Archive" (~2,500 words)
  - Introduces: Elias Vong (archivist, reluctant ally)
  - Setting: Underground archive in Vienna
  - Advances: Nadia searches for Hale's last communication
  - Resolves: Thread 2 (Bucharest incident is revealed — she was betrayed)
  - Advances thread 1: Message was sent by someone inside The Meridian Group
  - New thread 3: The Glass Meridian file — what is it? (OPEN)

Chapter 3: "The Exchange" (~2,500 words)
  - Setting: Hotel rooftop, Prague
  - Nadia meets her contact
  - Thread 1 STILL open (we never learn who sent the message — DEAD BRANCH marker)
  - Thread 3 advances but doesn't resolve
  - Ends on a hook: the file is not what she thought
```

### Entities to pre-seed (in DB, not extracted)

**Characters:**
```
Nadia Voss
  type: character
  description: Ex-intelligence analyst, forced back into the field
  attributes:
    hair_color: Dark brown, cut short
    eye_color: Grey
    age: Late 30s
    personality: Methodical, distrustful, reads rooms before she reads people
    motivations: Find out who killed Marcus. Get out clean.
    dialogue_style: Clipped. Never asks a question she doesn't already know the answer to.
    character_arc: Learns that the betrayal in Bucharest was sanctioned from above

Marcus Hale
  type: character
  description: Nadia's former handler. Found dead in Chapter 1.
  attributes:
    hair_color: Silver
    age: Late 50s
    personality: Warm on the surface, calculating underneath
    role: Catalyst — his death drives the entire plot

Elias Vong
  type: character
  description: Underground archivist, knows where all the buried files are
  attributes:
    age: Mid 40s
    personality: Nervous, precise, speaks in qualifications
    motivations: Stays neutral. Helps whoever gets to him first.
    dialogue_style: Academic. Lots of "technically" and "strictly speaking"
```

**Locations:**
```
Nadia's apartment — Prague
  type: location
  description: Sparse, deliberately unmemorable. A professional's home.

The Archive — Vienna
  type: location
  description: Subterranean document vault beneath a decommissioned library

The Meridian Group
  type: faction
  description: A private intelligence contractor with government access. Possibly rogue.
```

**Plot threads:**
```
Thread 1: Who sent the encrypted message?
  status: open (intentionally dead — never addressed in Chapter 3)
  introduced_chapter: Chapter 1
  last_seen_chapter: Chapter 2

Thread 2: What happened in Bucharest?
  status: resolved
  introduced_chapter: Chapter 1
  resolved_chapter: Chapter 2

Thread 3: What is the Glass Meridian file?
  status: open
  introduced_chapter: Chapter 2
  last_seen_chapter: Chapter 3
```

### Seed script behaviour

`scripts/seed-sample.ts` does the following when a new user completes the genre picker:
1. Creates the project record in `projects`
2. Inserts all 3 chapters with pre-written Lexical JSON content
3. Inserts all entities (characters, locations, factions) directly — no AI extraction needed
4. Inserts plot threads
5. Embeds all chapter text and inserts into `story_chunks` (pre-computed embeddings stored
   in the script as float arrays — OR runs geminiEmbed at seed time, ~6 calls, free tier)
6. Creates a `story_bibles` record with a pre-written synopsis and style notes
7. Sets `is_sample: true` on the project
8. Redirects user to `studio/[projectId]/[chapter1Id]`
9. Sets `profiles.onboarding_step = 1` to trigger tutorial start

> Pre-computing embeddings at seed time (option A) vs running them live (option B):
> Option B is simpler — just run geminiEmbed for each chunk when seeding.
> Total: ~12 embed calls per new user (3 chapters × ~4 chunks each).
> At 1,500 free embed calls/day, this is fine for 100 users.

---

## Onboarding Flow

### Step 0: Genre picker (first login only)

Triggered when: `profiles.onboarding_step === 0`
Shown as: Full-screen modal over the dashboard

```
"What kind of story do you want to write?"

[Thriller]    [Fantasy]    [Sci-Fi]    [Romance]
   ✓ Ready     Coming soon  Coming soon  Coming soon

→ For MVP: only Thriller is enabled. Others are greyed out with "Coming soon".
  This also tells you which genre to build next based on what people click.
```

On click:
- Seeds the sample project
- Sets `onboarding_step = 1`
- Redirects to `studio/[projectId]/[chapterId]`

### Steps 1–8: Interactive tutorial in the editor

Stored as: `profiles.onboarding_step` (1–8, 0 = not started, 9 = done)
Rendered as: `TutorialOverlay` component inside ZenEditor
Dismissible: Yes, at any time (sets `onboarding_done = true`, skips to 9)
Resumable: "Resume Tutorial" button in the ... menu of studio sidebar

The overlay has two parts:
- **Backdrop**: full-screen semi-transparent dark layer
- **Spotlight**: a transparent cut-out over the target element (CSS clip-path or box-shadow trick)
- **Card**: floating tooltip card with title, instruction, and optional button

---

#### Step 1 — Welcome
**Target element:** The editor text area
**Spotlight:** Editor column
**Card position:** Center of screen

```
Title: "This is your sample project."
Body:  "The Glass Meridian — a thriller in 3 chapters, fully loaded with characters,
        plot threads, and an AI co-author that's already read the whole thing.
        We'll show you how it works. Takes about 2 minutes."
CTA button: "Let's go →"
```
**Advances:** On button click

---

#### Step 2 — The editor
**Target element:** The ContentEditable area
**Spotlight:** The writing area
**Card position:** Bottom-right of editor

```
Title: "Write here."
Body:  "Everything auto-saves. Your word count is in the bottom-left.
        Read the first paragraph — then we'll show you something."
```
**Advances:** Automatically after 4 seconds (they don't need to do anything)

---

#### Step 3 — Meet your co-author
**Target element:** Co-author panel (expand it programmatically if slim)
**Spotlight:** Right panel
**Card position:** Left of panel

```
Title: "Meet Alex, your co-author."
Body:  "Alex has read your entire chapter and has something to say.
        Send them a message. Try: 'What do you think of the opening?'"
```
**Advances:** When user sends their first chat message (detect via message count > 0)

> Implementation note: expand the co-author panel (`coauthorSlim = false`) when this
> step activates. The panel should already have a seeded "observation" message in the
> conversation from the sample setup.

---

#### Step 4 — Write with AI (Ctrl+K)
**Target element:** The editor
**Spotlight:** Editor + a small highlight on the status bar hint text
**Card position:** Bottom-center, above the command bar area

```
Title: "Now write together."
Body:  "Click anywhere in the chapter, then press Ctrl+K.
        Tell Alex what to write next. Try: 'Write what Nadia finds in the diner'"
```
**Advances:** When `commandBarOpen` becomes true (Ctrl+K is pressed)

After command bar opens — step 4b:
```
Body:  "Good. Type your instruction and press Enter."
```
**Advances:** When a ghost suggestion appears (fetch completes)

After suggestion appears — step 4c:
```
Body:  "Press Tab to insert this into your chapter. Press Esc to dismiss."
```
**Advances:** When Tab or Escape is pressed (ghost text resolved)

---

#### Step 5 — Story Bible
**Target element:** The book icon in the editor title bar
**Spotlight:** That icon, with a glow ring
**Card position:** Below the icon

```
Title: "Your story is being indexed."
Body:  "The Story Bible searches your entire manuscript semantically — not just keywords.
        Click the book icon to open it."
```
**Advances:** When the Story Bible panel opens (`showBiblePanel === true`)

After it opens:
```
Body:  "These passages were pulled from your manuscript based on what's near your cursor.
        As you write, this updates automatically."
```
**Advances:** After 3 seconds (auto)

---

#### Step 6 — World Board
**Target element:** "World Board" link in the studio sidebar
**Spotlight:** Sidebar World Board item
**Card position:** Right of sidebar

```
Title: "Your world, mapped."
Body:  "Xvault extracted the characters, locations, and factions from your manuscript
        and built this automatically. Click World Board to see it."
```
**Advances:** When user navigates to `/studio/[projectId]/worldboard`

> Implementation note: this requires navigating away from the editor. The tutorial
> overlay state must persist across navigation. Store `onboarding_step` in DB and
> re-read on each page load. The WorldBoard page also renders TutorialOverlay.

---

#### Step 7 — Plot threads
**Target element:** "Story Bible" link (the bible page has a Threads tab)
**Spotlight:** The threads section in the Bible page
**Card position:** Right

```
Title: "Dead branches — caught before they haunt you."
Body:  "Xvault tracks every plot thread. In this sample, one thread from Chapter 1
        was never resolved. Xvault flagged it automatically.
        Click 'Story Bible' → 'Threads' to see it."
```
**Advances:** When user visits the Bible page and sees the threads tab

---

#### Step 8 — Complete
**Target element:** None (full-screen card, no spotlight)
**Card position:** Center of screen

```
Title: "You're ready."
Body:  "14 days. 100 AI credits. Your own story — or keep exploring the sample.

        Alex is reading everything you write.
        Your world builds itself as you go.
        Nothing gets lost."

CTA 1: "Start my own story →"   (creates new project, dismisses tutorial)
CTA 2: "Keep exploring"         (dismisses tutorial, stays in sample)
```

On "Start my own story":
- Opens new project modal (same as dashboard)
- Sets `onboarding_done = true`
- New project is a blank canvas

On "Keep exploring":
- Sets `onboarding_done = true`
- Stays in sample project

---

## TutorialOverlay — Implementation Notes

### Architecture
- Single `TutorialOverlay` component, rendered at the root of:
  - `ZenEditor` (covers steps 1–5)
  - `WorldBoardView` (step 6)
  - `BibleView` (step 7)
- Each page reads `onboarding_step` from the user's profile (passed as prop)
- Each page calls `PATCH /api/user/onboarding` to advance the step
- When `onboarding_done = true` OR `onboarding_step >= 9`: component renders nothing

### Spotlight technique
```css
/* Box-shadow punch-out spotlight */
.spotlight-overlay {
  position: fixed;
  inset: 0;
  background: transparent;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65);
  border-radius: /* match target element */;
  pointer-events: none;
  z-index: 49;
  transition: all 0.3s ease;
}
```
The overlay's `top/left/width/height` are set by measuring the target element's
`getBoundingClientRect()`. The component listens to window resize to reposition.

### New API route needed
```
PATCH /api/user/onboarding
Body: { step?: number, done?: boolean }
```
Updates `profiles.onboarding_step` and/or `profiles.onboarding_done`.
Simple 10-line route.

### What NOT to do
- Don't block navigation during tutorial steps 6–7 (user must navigate freely)
- Don't auto-advance steps that require real interaction
- Don't show tutorial on mobile (just skip to step 9 on viewport < 768px)
- Don't re-show tutorial if `onboarding_done = true`

---

## Pricing Page (basic, Wednesday)

Route: `/pricing`
Design: Two cards only. No features table — that comes later.

```
[Scribe — $9/month]          [Pro — $29/month]
300 credits/month             1,200 credits/month
Perfect for regular writers   For serious daily writers

[$72/year — save 33%]         [$264/year — save 24%]

[Start free trial]            [Start free trial]
```

Both CTAs go to `/auth` for now (Dodo payments wired in post-beta).
Add "Payments coming soon — beta is free" banner at top of pricing page.

The upgrade prompt inside the app (when credits hit 0) links here.

---

## Things NOT Being Built for Wednesday

These are explicitly out of scope. Write them down so you don't get distracted:

- ❌ Dodo payment integration (wire after first 5 beta signups confirm interest)
- ❌ Fantasy / Sci-Fi / Romance sample projects (build after Thriller feedback)
- ❌ Email notifications / transactional email
- ❌ Sprint Mode
- ❌ Cork Board
- ❌ Export (it exists but don't promote it yet — needs testing)
- ❌ Adaptation agents / Beta reader / Style memory
- ❌ Mobile layout
- ❌ Landing page rewrite (current placeholder is fine for private beta)
- ❌ SEO / OG images

---

## Files That Need to Be Created or Modified

### New files
```
supabase/migrations/004_credits_and_beta.sql
scripts/seed-sample.ts                         (run once per new user via API)
src/app/api/user/onboarding/route.ts           (PATCH — advance tutorial step)
src/app/api/studio/seed-sample/route.ts        (POST — called after genre pick)
src/app/studio/[projectId]/_components/tutorial-overlay.tsx
src/app/dashboard/_components/genre-picker.tsx
src/app/pricing/page.tsx
```

### Modified files
```
src/lib/supabase.ts             — new plan names, credit limits, TRIAL_DAYS = 14
src/lib/rate-limit.ts           — accept credits parameter
src/types/database.ts           — update Plan type, add credit-related fields
src/app/api/ai/coauthor/chat/route.ts         — wire checkRateLimit(1)
src/app/api/ai/coauthor/suggest/route.ts      — wire checkRateLimit(1 or 2)
src/app/api/ai/coauthor/global-change/route.ts — wire checkRateLimit(3)
src/app/api/ai/worldboard/route.ts            — wire checkRateLimit(4)
src/app/api/ai/worldboard/reextract/route.ts  — wire checkRateLimit(10)
src/app/studio/[projectId]/[chapterId]/_components/zen-editor.tsx
  — add credit display in status bar
  — add upgrade prompt modal when credits = 0
src/app/studio/[projectId]/[chapterId]/page.tsx
  — fix existing TS error (add project_id to coauthor select)
src/app/dashboard/page.tsx
  — add first-login detection → genre picker modal
  — add trial banner with credit balance
```

---

## Beta Invite Checklist (before sending invites)

- [ ] Deploy to Vercel / staging URL
- [ ] Test full flow: sign up → genre picker → sample loads → tutorial runs → credits work
- [ ] Test credits: send 10+ chat messages, verify counter drops
- [ ] Test WorldBoard: verify entities are pre-seeded (don't wait for extraction)
- [ ] Test Story Bible: verify search works on first load (embeddings pre-seeded)
- [ ] Test credit wall: manually set credits to 0, verify upgrade prompt appears
- [ ] Verify co-author panel: pre-seeded observation appears in new user's chat
- [ ] Confirm GEMINI_API_KEY is active and has billing enabled (for Pro calls)
- [ ] Send to 5 people max first. Fix what breaks. Then send to 30.

---

## The One Metric That Matters This Week

**Did the tester complete all 8 tutorial steps?**

If yes → they've seen everything. Now ask: "What confused you? What felt magic?"
If no → find out which step they dropped off at. Fix that step first.

Retention, conversion, and credits can all be optimised later.
This week is purely: does the thing work, and does it make sense?
