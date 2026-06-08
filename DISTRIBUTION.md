# Xvault Studio — Distribution & Growth Playbook
> Written: June 7, 2026 | Status: Pre-beta, private invite stage
> Solo founder. Everything here is work Claude can help implement or draft.

---

## What We're Distributing

A writing tool for fiction authors — AI co-author, world-building, plot tracking.
Target: English-language fiction writers, ages 22–45, who write on a computer.
Primary channels: Writing communities (Reddit, Discord), ProductHunt, Twitter/X, SEO.

---

## Phase 0 — Before Any Public Distribution
> Do these first. They protect the brand before eyes land on it.

### 0.1  OG / Social Preview Images
**What:** `<meta og:image>` cards that appear when someone shares a link.
**Why:** Every shared URL is a free impression. Generic NextJS defaults look amateur.
**Claude can:** Generate the JSX for a `og-image` route using Next.js `ImageResponse`.

```
GET /api/og?title=Xvault+Studio
→ returns a 1200×630 image: dark card, "Xvault Studio" headline,
  "Your co-author is already reading." tagline, star logo
```

Files to create:
- `src/app/api/og/route.tsx` — ImageResponse with inline styles
- Update `src/app/layout.tsx` — add `metadataBase`, `openGraph.images`

---

### 0.2  SEO Metadata (Static Pages)
**What:** Proper `<title>`, `<meta description>`, canonical URLs.
**Why:** Even for private beta, Google indexes the public pages.
**Claude can:** Write all metadata objects for every page.

Pages that need metadata:
- `/` (landing) — "Xvault Studio — AI Co-Author for Fiction Writers"
- `/pricing` — "Pricing — Xvault Studio"
- `/auth` — noindex (login pages should never rank)
- `/dashboard`, `/studio/*` — noindex (authenticated, private)

---

### 0.3  Landing Page Copy Rewrite
**What:** The current landing page is a placeholder. Rewrite it for conversion.
**Why:** Beta invitees will check the URL before signing up. First impression matters.
**Claude can:** Write the full copy using the framework below.

Hero copy formula:
```
HEADLINE: The specific thing it does, not what it is.
  ✗ "AI Writing Assistant"
  ✓ "An AI that reads your entire novel and writes with you — not at you."

SUBHEAD: Who it's for + the pain it solves.
  "For fiction writers who are tired of losing the thread of their story."

CTA: Specific, low-stakes.
  "Start writing — free for 14 days"
```

Sections to write:
1. Hero (above fold)
2. "What is Xvault?" — 3 short paragraphs, no bullet points
3. The three features (Alex, World Board, Plot Threads) — each gets a 2-sentence benefit statement
4. Pricing teaser (link to /pricing)
5. Footer

---

## Phase 1 — Private Beta (10–30 people)
> Invite-only. Focus: does it work, does it make sense?

### 1.1  Beta Invite Email
**What:** The cold email / DM that brings testers in.
**Claude can:** Write 3 versions (formal, casual, community post style).

Template (casual version):
```
Subject: Want early access to something weird I've been building?

Hey [name],

I've been building a writing tool for fiction authors — it's got an AI co-author
that actually reads your manuscript before it starts talking to you.

14-day free trial. No credit card. I'm looking for 10 writers to break it.

If that sounds interesting: [link]

— [your name]
```

Personalization rules:
- If inviting from a writing subreddit: mention their genre/post
- If inviting a friend: skip the formality, be direct
- Never say "revolutionary" or "game-changer"

---

### 1.2  Feedback Collection Form
**What:** Simple form testers fill out after the tutorial.
**Claude can:** Write the questions + build a lightweight `/feedback` page if needed.

5 questions max:
1. "Which step of the tutorial did you get stuck or confused?" (dropdown: 1–8, None)
2. "What was the most useful thing?" (open text, 1–2 sentences max)
3. "What felt broken or confusing?" (open text)
4. "Did Alex (the co-author) feel useful?" (Yes / Somewhat / No)
5. "Would you pay $9/month for this after the trial?" (Yes / Maybe / No)

The `/api/feedback` route already exists — extend it or create a `/feedback` public page.

---

### 1.3  Beta Tester Onboarding DM / Message
**What:** The message sent after someone signs up, before they start.
**Claude can:** Write the welcome sequence.

Welcome message (sent manually or via email trigger):
```
Hey — welcome to the Xvault beta.

You'll be dropped into a sample thriller project called "The Glass Meridian."
There's an 8-step tutorial that walks you through everything. Takes about 2 minutes.

A few things to know:
- You have 100 AI credits. That's plenty for the full trial.
- The co-author is called Alex. They've already read your chapter.
- Nothing is saved to a server until you hit Save (actually it auto-saves every 2s).

If something breaks or confuses you, hit the feedback button (bottom right of every page).
I read every submission personally.

— [name]
```

---

## Phase 2 — Community Distribution
> Reddit, Discord, Twitter. Free. High signal-to-noise if done right.

### 2.1  Reddit Strategy

**Target subreddits:**
- r/writing (4.1M) — largest, but skeptical of tools
- r/worldbuilding (1.3M) — World Board feature fits perfectly here
- r/fantasywriters, r/scifiwriting — genre-specific, warmer communities
- r/nanowrimo — active in Oct–Nov, but good year-round

**Post types that work:**
1. "I built this" posts — honest, founder voice, show the thing
2. Progress/behind-the-scenes — "6 months building a writing tool, here's what I learned"
3. Feedback request — "Looking for writers to break my tool (free)"
4. Value posts — "How I track plot threads without losing my mind" (subtle product mention)

**Claude can draft:**
- 3 "I built this" posts for different subreddits (different angles)
- 1 "show your process" post for r/worldbuilding featuring the World Board
- 1 NaNoWriMo-timed post for October

**Rules:**
- Never post the same text twice across subreddits (gets flagged as spam)
- Don't post link first — write value, mention tool naturally, link in comments if allowed
- Reply to every comment within 2 hours of posting

---

### 2.2  Twitter/X Strategy

**Account type:** Founder's personal account, not a brand account.
Reason: People follow people, not products. Authenticity converts.

**Content cadence (3–4 posts/week):**
- Building in public: "Shipped X today" with screenshot
- Writing craft: "One thing I've learned about pacing from watching writers use the tool"
- Tool tips: "Alex tip: ask it 'what's the weakest scene in this chapter?' — the answer is always useful"
- Behind the numbers: "100 beta users. Here's what confused them most."

**Threads that convert:**
- "Why I'm building a writing tool in 2026 (when everyone else gave up)"
- "The 5 things writers say to the AI that actually work"
- "We tracked 1,000 writing sessions. Here's what we learned."

**Claude can draft:** All of the above. Give Claude a real data point and it'll write the thread.

---

### 2.3  Discord Outreach

**Servers to target:**
- The Fantasy Writers Guild
- r/writing Discord
- NaNoWriMo official Discord
- Notion / Obsidian writing communities (they love tools)

**Approach:**
- Lurk for 2 weeks first. Answer questions. Build reputation.
- Never cold-pitch in #general
- Share in #tools, #resources, or #self-promotion channels only
- Offer beta spots as a genuine gift, not a sales pitch

---

## Phase 3 — ProductHunt Launch
> Do this after beta is stable. ~30 days after private beta starts.

### 3.1  Launch Checklist

Pre-launch (2 weeks before):
- [ ] Build a list of 50+ people to notify on launch day (email + DM)
- [ ] Join PH hunter communities to find a hunter (or self-hunt)
- [ ] Create "Coming soon" page on PH and collect followers
- [ ] Prepare all assets: tagline, description, screenshots, demo video

Launch day assets:
- **Tagline:** (60 chars max) "The AI co-author that reads your whole novel first."
- **Description:** 3 paragraphs. Problem → Solution → Call to action. No buzzwords.
- **Screenshots:** 5 required. Claude can spec the exact screenshots to capture.
- **Demo video:** 60–90 seconds. Show the tutorial flow. No voice-over needed if captions are clear.
- **First comment:** Founder story. Written in advance, posted 1 minute after launch.

**Claude can draft:**
- Full PH listing copy (tagline, description, first comment)
- Screenshot caption text
- The 50-person launch day outreach messages

### 3.2  PH Tagline Options (for A/B testing)
```
A: "The AI co-author that reads your whole novel first."
B: "Alex reads your manuscript. Then helps you write the next scene."
C: "Stop explaining your story to the AI. It already knows."
D: "World Board, plot threads, and an AI that actually knows your characters."
```

### 3.3  PH First Comment Template
```
Hi PH — I'm [name], the solo founder of Xvault Studio.

I spent 8 months building this because I was frustrated with AI writing tools
that don't know anything about your story. Every time I opened a new chat,
I had to re-explain the characters, the world, the tone. It was exhausting.

Xvault solves this by keeping your entire manuscript in context. Alex (the AI
co-author) has read every chapter. It knows Nadia's backstory. It knows which
plot threads are unresolved. You don't have to remind it.

14-day free trial, no credit card. Would love your feedback — I read every comment.
```

---

## Phase 4 — SEO (Medium-Term, 3–6 months)
> Not for launch week. Build this in parallel during beta.

### 4.1  Blog / Content Strategy

**Target keywords (low competition, high intent):**
- "AI writing tool for novels" — 1.2K/mo, KD 28
- "plot thread tracker for writers" — 400/mo, KD 12
- "world building tool fiction" — 900/mo, KD 22
- "character consistency checker writing" — 200/mo, KD 8
- "NaNoWriMo writing app" — 3.2K/mo, spikes in Oct

**Article ideas Claude can write:**
1. "How to track plot threads without losing your mind (and how AI can help)"
2. "Character consistency: the problem no writing app solves"
3. "What I learned from 100 writing sessions with AI"
4. "World building tool comparison: Notion vs. Scrivener vs. Xvault"
5. "The NaNoWriMo prep guide for 2026"

**Blog route to create:** `/blog/[slug]/page.tsx` with MDX support.

### 4.2  Programmatic SEO (Later)

Once you have 50+ users with real projects:
- "Best AI tools for [genre] writers" landing pages
- "How to write a [thriller/fantasy/romance] with AI" guides
- Genre-specific feature showcases

**Claude can:** Design the page template + generate the first 10 articles.

---

## Phase 5 — Referral / Virality

### 5.1  Simple Referral Mechanic

Mechanism: Share your referral link → friend signs up → you both get +25 credits.

**Why this works:**
- Writers have writer friends
- Credits have real value (each is ~$0.002 in AI compute)
- "+25 credits" is more concrete than "1 month free"

**What to build:**
- `profiles.referral_code` — 8-char unique code, generated on signup
- `profiles.referred_by` — stores referrer's user ID
- On signup: if `?ref=ABC123` in URL, credit both accounts 25 credits
- Show referral link in dashboard: "Invite a writer friend, get 25 credits each"

**Claude can:** Write the DB migration + the referral tracking API route.

### 5.2  "Made with Xvault" Badge

A small, linkable badge authors can embed in their writing blogs / social profiles:
```
[Writing with ✦ Xvault Studio]
```

Auto-generates a shareable link to the author's project overview (public/private toggle).
Not for MVP — but a good v2 feature.

---

## Assets Claude Can Generate On Demand

| Asset | Trigger | Notes |
|---|---|---|
| Beta invite email | "Write me a beta invite for Reddit writers" | Give Claude the subreddit + your tone |
| Reddit post | "Write a r/writing post about the co-author" | Specify angle (builder, tool, craft) |
| Twitter thread | "Write a thread about building in public" | Give Claude 1 real data point |
| PH listing copy | "Write the ProductHunt description" | Needs screenshots first |
| Blog article | "Write an SEO article about [keyword]" | Specify target keyword + word count |
| Feedback form questions | "Add a question about [feature]" | Keep to 5 questions max |
| Referral email | "Write the email sent when a referral signs up" | Warm, personal tone |
| OG image component | "Build the /api/og route" | Needs brand colors + logo path |

---

## Priority Order for This Month

1. **This week:** Beta invites sent (max 10 people). Collect feedback form responses.
2. **Week 2:** Fix whatever breaks. Re-invite with fixes noted.
3. **Week 3:** Write the landing page copy rewrite. Build OG images.
4. **Week 4:** First Reddit posts. Start Twitter building-in-public thread.
5. **Month 2:** ProductHunt prep begins. Blog article #1 published.

---

## One Rule

**Don't distribute before the product works.**
Every person who tries a broken product is a lost advocate.
Fix the tutorial, fix the co-author ordering, fix the credits wall — then ship.

The best distribution for a writing tool is a writer finishing a scene and thinking:
*"I couldn't have written that without it."*
