# Co-Author — Current State of the System

> Last updated: May 2026
> This document reflects the actual live implementation, not a design spec.

---

## What It Is

The co-author is an AI writing partner built into the ZenEditor. It lives in a collapsible right-side panel and does three distinct things:

1. **Watches passively** — reads what you write, and occasionally says something useful without being asked
2. **Talks to you** — full chat interface where you can ask questions, request help, or give it direction
3. **Writes for you** — ghost text continuation triggered by Ctrl+Enter, inserted at cursor on Tab

It is powered by **Google Gemini 2.5 Flash** via direct REST API calls. There is no streaming — responses arrive complete. Each co-author is per-project and has a configurable name and personality.

---

## The Context Package

Every AI call assembles context from four sources in parallel:

### 1. Story Bible (from `story_bibles` table)
- `synopsis` — the story so far
- `project_intent` — what the writer is trying to achieve
- `style_notes` — voice, tone, prose style

### 2. Character & World Entities (from `entities` table)
- **Characters**: name, description, personality, motivations, arc, dialogue style
- **World elements**: locations, factions, items — name, type, description

### 3. Open Plot Threads (from `plot_threads` table)
- Only threads with `status = 'open'`
- Used to nudge the co-author toward continuity

### 4. Current Chapter — full text
- **When `chapterId` is provided** (chat + ghost text routes): fetches the full chapter content from DB via `lexicalToText()` and includes it verbatim
- **When not provided** (observe route): uses a 500-word sliding window of recent text sent from the client
- This is what lets the co-author answer questions like "what colour are Abigail's eyes?" by reading the actual chapter

### What it does NOT have
- No access to other chapters (only the current one)
- No access to deleted content or previous drafts
- No memory of what the writer told it outside of the message history (those conversations are stored in `coauthor_messages` and the last 20 are passed as history on every chat call)

---

## The Three Modes

### Mode 1 — Proactive Observer

**File:** `src/app/api/ai/coauthor/observe/route.ts`
**Trigger:** Client-side, after the writer pauses for 15 seconds following a 150+ word burst

**What happens:**
1. CoAuthorPlugin in ZenEditor tracks word count on every keystroke
2. When `currentWC - burstStartWC >= 150`, a 15-second debounced timer starts
3. The timer resets on every subsequent keystroke (so it only fires on a real pause)
4. On fire, a snapshot of the last 500 words is sent to the observe endpoint

**Server-side guards against spam:**
- Client: tracks `lastObservationAtRef` — won't fire again if < 5 minutes since last
- Server: checks DB for any observation/nudge/celebration saved in the last 5 minutes — if found, returns `{ observation: null }` immediately without calling the AI

**What the AI does:**
The AI reads the recent text and decides: is there something GENUINELY worth saying right now? If not, it outputs the single word `QUIET`. The check is exact — any other response (even one containing the word "quiet") is treated as an actual observation.

Things it might notice:
- A character speaking out of voice
- An open plot thread that could naturally surface
- A pacing issue (too many action beats, or scene losing momentum)
- A genuinely strong moment worth acknowledging
- A question that would help the writer make a key decision

**Observation is NOT saved to chat history** — it's saved directly to `coauthor_messages` as `role: assistant` so it persists and shows up on panel reload.

**Message types:**
- `observation` — general note (shown in blue)
- `nudge` — references an earlier chapter/thread (shown in blue)
- `celebration` — genuine praise for a strong moment (shown in amber)

---

### Mode 2 — Chat

**File:** `src/app/api/ai/coauthor/chat/route.ts`
**Trigger:** User types a message in the panel and presses Enter

**Intent routing — before the AI is called:**
The message is checked against regex patterns. If it matches, it bypasses the regular AI call and gets routed directly.

**Global/manuscript change patterns** (routed to global-change flow):
```
change X (to|into) Y (throughout|everywhere|in all|across all|in every)
rename X to Y
replace X with Y (throughout/everywhere/etc.)
change (all|every) X
replace (all|every) X
change word's trait to word        ← catches "change Abigail's eyes to green"
change word's (eye|hair|skin|voice|name) to/from  ← trait-specific
(make|turn) word's (eyes|hair|skin|voice) word     ← imperative form
```

When a global change is detected:
1. The co-author immediately acknowledges: "On it — scanning the manuscript..."
2. The panel triggers `POST /api/ai/coauthor/global-change` which fetches ALL chapters and asks the AI to find every relevant passage
3. A full-screen `GlobalChangePreview` modal shows the writer exactly what will change
4. The writer approves/denies each change individually
5. Approved changes are applied via `lexicalReplace()` directly to the chapter JSON in the DB

**Regular chat flow:**
- Assembles full context (story bible + entities + threads + full chapter text)
- Prepends last 20 messages as history: `Writer: ... \n CoauthorName: ...`
- Calls Gemini with 600 max tokens
- Response is classified as `chat`, `celebration`, or `nudge` based on keyword matching

**Quick reply chips** (shown after every assistant message):
- "Tell me more"
- "Want me to try?"
- "Give me 3 directions"
- "I'll keep it as is"

---

### Mode 3 — Ghost Text (Ctrl+Enter)

**File:** `src/app/api/ai/coauthor/suggest/route.ts`
**Trigger:** Ctrl+Enter (short, 80-130 words) or Ctrl+Shift+Enter (long, 250-350 words)

**What happens:**
1. `CoAuthorPlugin` intercepts the keydown in Lexical's root element
2. Calls `handleGhostRequest(mode)` in ZenEditor
3. `ghostLoading` becomes `true` → `GhostTextOverlay` appears at bottom of viewport
4. Fetches from `/api/ai/coauthor/suggest` with `recentText` + `chapterId`
5. On response, `ghostSuggestion` is set → overlay shows the suggestion text
6. **Tab** → accepts, inserts the text at current cursor position via Lexical's `insertText()`
7. **Escape** → dismisses, clears `ghostSuggestion`

**The overlay:**
- `position: fixed; bottom: 6px` — always anchored to the bottom of the viewport, regardless of scroll position
- Shows a loading spinner while fetching
- Shows the suggestion in italic grey text
- Header: "{CoauthorName} suggests"
- Footer: "Tab to accept · Esc to dismiss"

**The AI system prompt for suggestions:**
The full assembled context (same as chat) is used as the base system prompt, with an additional instruction appended:
> "When writing continuations: output ONLY the story text — no preamble, no labels, no commentary. Match the voice, pacing, and style of the existing text exactly."

The continuation prompt tells the AI to continue exactly where the text left off and gives word targets for short vs. long mode.

---

## File Map

```
src/
├── lib/
│   ├── coauthor-context.ts       Context assembly — called by all AI routes
│   ├── ai.ts                     Gemini API client (geminiGenerate, geminiStream)
│   ├── lexical-replace.ts        Phrase find/replace in Lexical JSON
│   └── chunking.ts               lexicalToText() — extracts plain text from Lexical state

├── app/api/
│   ├── coauthor/
│   │   ├── setup/route.ts        POST/GET — save co-author name + personality
│   │   └── messages/route.ts     GET — fetch last 50 messages for a project
│   └── ai/coauthor/
│       ├── chat/route.ts         POST — main chat, intent routing, global change detection
│       ├── observe/route.ts      POST — proactive observation (fires after writing burst)
│       ├── suggest/route.ts      POST — ghost text continuation
│       ├── global-change/
│       │   └── route.ts          POST — scan full manuscript, return ChangePlan
│       └── global-change/apply/
│           └── route.ts          POST — apply approved changes to chapter Lexical JSON

├── app/studio/[projectId]/
│   └── _components/
│       ├── coauthor-panel.tsx    Right-side chat panel (full + slim modes)
│       ├── coauthor-setup.tsx    Setup modal (name + personality presets)
│       └── global-change-preview.tsx  Full-screen review modal for manuscript edits

└── app/studio/[projectId]/[chapterId]/
    └── _components/
        └── zen-editor.tsx        CoAuthorPlugin, GhostTextOverlay, ZenEditor wiring
```

---

## Database Schema

### `coauthors` table
One row per project. Stores the co-author persona.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| project_id | uuid | FK → projects, UNIQUE |
| name | text | Default: "Alex" |
| personality | text | Free text or preset-based |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `coauthor_messages` table
Stores the full conversation history. Trimmed to last 50 per project.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| project_id | uuid | FK → projects |
| role | text | 'user' \| 'assistant' |
| content | text | The message text |
| message_type | text | 'chat' \| 'observation' \| 'celebration' \| 'nudge' \| 'ghost_accepted' |
| created_at | timestamptz | Indexed with project_id for fast recency queries |

---

## The Persona System

The writer sets a **name** and **personality** for their co-author via the setup modal.

### Personality presets (quick-start options)
| Preset | Description |
|--------|-------------|
| The Honest Friend | Warm and real. Supportive but will tell you when something isn't working |
| The Editor | Sharp and structural. Thinks in story arcs and chapter beats |
| The Hype Person | Enthusiastic. Celebrates every win. Always encouraging |
| The Contrarian | Pushes back on everything. Plays devil's advocate. Asks hard questions |

The personality is injected into the system prompt as `Your personality: {text}`. It shapes DELIVERY only — the craft rules (be specific, ask before telling, know when to stay quiet) are always on regardless of personality.

---

## Known Limitations

**What the AI does NOT know:**
- Anything from chapters other than the current one
- Manuscript history (previous drafts, deleted scenes)
- What happened before the current session if it's not in the last 20 messages

**What can feel inconsistent:**
- If character info hasn't been extracted to the `entities` table yet (WorldBoard extraction runs after 1500 new words), the AI only knows what's in the current chapter text
- The AI's knowledge of earlier chapters comes entirely from the `synopsis` in the Story Bible — only as accurate as what the writer has written there

**The ghost text limitation:**
- The suggest endpoint requires `recentText` to be non-empty. If the editor is brand new (0 words), Ctrl+Enter silently does nothing.

---

## Behavior Guards (anti-spam, anti-repetition)

| Guard | Where | What it does |
|-------|--------|-------------|
| 150-word burst threshold | Client (CoAuthorPlugin) | Observe only fires after 150+ new words |
| 15-second debounce | Client (CoAuthorPlugin) | Timer resets on every keystroke — only fires on real pause |
| 5-minute in-memory cooldown | Client (CoAuthorPlugin) | `lastObservationAtRef` — won't request another observation for 5 min |
| 5-minute server-side cooldown | Server (observe/route.ts) | Checks DB for recent observations — blocks even if client-side resets (e.g. remount) |
| Exact QUIET match | Server (observe/route.ts) | Only suppresses if AI responds with literally "QUIET" — not if it uses the word in a sentence |
| Ghost text guard | Client (ZenEditor) | Won't fire Ctrl+Enter if already loading or a suggestion is visible |

---

## What "Global Change" Actually Does

This is the most sophisticated part of the system.

**Example trigger:** "change Abigail's eyes to green from blue"

1. Chat route detects the change pattern → returns `{ messageType: "global_change", instruction: "..." }`
2. Panel auto-triggers `POST /api/ai/coauthor/global-change` with the instruction
3. Server fetches ALL chapters, converts each to plain text via `lexicalToText()`
4. AI receives the full manuscript and returns a JSON `ChangePlan`:
   - `changes[]` — clear matches (verbatim phrase → replacement, with surrounding context sentence)
   - `flagged[]` — ambiguous matches the AI isn't confident about
5. Server **verifies** every proposed change with `phraseExistsInLexical()` — if the exact phrase isn't in the Lexical JSON, it's moved to flagged automatically
6. The `GlobalChangePreview` modal opens full-screen:
   - Clear matches: all pre-approved by default, each individually toggleable
   - Flagged: all skipped by default, writer must explicitly approve each
7. Writer clicks Apply → `POST /api/ai/coauthor/global-change/apply` runs `lexicalReplace()` on each approved chapter's JSON in DB

This means the writer **always sees and approves** every change before it's applied. Nothing is changed silently.

---

## What's Next (planned improvements)

### Session deduplication
Pass the last 5 observation messages as context into the observe prompt so the AI knows what it's already said and doesn't repeat itself. Direct fix for the "3 identical messages" problem at the AI reasoning level.

### Intent detection in chat
Classify user messages before building the system prompt:
- `consistency_question` → emphasize character profiles, current chapter
- `creative_help` → give the AI more latitude, shift toward generative prompting
- `world_question` → emphasize Story Bible and entities
- `general_chat` → current behavior

This would make responses feel more targeted without adding extra round-trips.

### Streaming ghost text
Switch the suggest route from `geminiGenerate` to `geminiStream` so ghost text appears word-by-word instead of all at once. Makes the writing feel alive.
