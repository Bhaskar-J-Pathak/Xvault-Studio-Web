# Co-Author Test Plan

## Prerequisites

1. Run `supabase/migrations/003_coauthor.sql` in Supabase SQL editor
2. Use a project with:
   - At least 3 chapters with real content written
   - Story Bible filled in — at minimum Braindump and one chapter summary
   - At least 2 named characters, one with a physical trait mentioned more than once
3. Dev server running (`npm run dev`)

---

## Feature 1 — Setup

| Test | Expected |
|---|---|
| Click wand icon with no co-author | Setup modal opens |
| Click each personality preset | Textarea fills with preset description |
| Edit preset text | Custom text stays, preset deselects |
| Try to save with empty name | Save button stays disabled |
| Save with name + personality | Panel opens, co-author name shows at top |
| Reload page, open panel | Panel loads, co-author name still there |
| Click settings gear in panel | Setup modal opens with existing name/personality pre-filled |
| Change name, save | Panel header updates immediately |

---

## Feature 2 — Chat

| Test | Expected |
|---|---|
| Send any message | Typing indicator (3 dots), then reply |
| Send 3 messages in a row | Alex maintains context from earlier messages |
| Reload → open panel | Last ~30 messages still visible |
| "Tell me about [character name]" | Alex references their Story Bible profile specifically |
| "Give me 3 directions this scene could go" | 3 distinct, story-specific options (not generic) |
| "Is this character's voice consistent?" | Alex checks against the profile, gives specific answer |
| "Make the story worse on purpose" | Alex should push back, explain why, offer an alternative |
| Click a quick-reply chip | Same as typing that text |
| Shift+Enter in input | Newline, no send |
| Enter in input | Sends message |

**Quality check:** Does the reply sound like the personality you set?
Run the same question with two different personalities on two different
projects and compare.

---

## Feature 3 — Proactive Observer

Alex won't always speak — it's probabilistic. That is expected behaviour.

| Test | How | Expected |
|---|---|---|
| 50+ word burst, pause 5s | Write rapidly, then stop | Observation appears in panel (not always — Alex may stay quiet) |
| Write something inconsistent | Give a character dialogue that doesn't match their profile | Voice drift: "X doesn't usually speak this way…" |
| Write genuinely strong sentence | Craft a good metaphor | Rare celebration: specific about what worked |
| 10-word burst, pause 5s | Write just a few words | No observation (burst < 50 words) |
| Already observed same content | No new words written, just wait | No repeat observation |
| Panel closed when observation arrives | Write, pause | Panel auto-opens |

**To force an observation:** Write 60+ words where a character acts
inconsistently with their Story Bible profile. The observer is tuned to catch that.

**If observations never appear:** Check terminal for `[coauthor/observe]` errors.
Most likely cause: AI returning something other than `QUIET` that still gets
filtered, or a network issue.

---

## Feature 4 — Ghost Text

| Test | Expected |
|---|---|
| Ctrl+Enter with cursor mid-paragraph | Loading card appears at bottom of editor |
| Wait for suggestion | Ghost text appears in the card, italicised |
| Press Tab | Suggestion inserts at cursor position |
| Press Escape | Card dismisses, nothing inserted |
| Ctrl+Shift+Enter | Longer suggestion (~300 words) appears |
| Click outside the card | Card stays (only Tab/Escape dismiss it) |
| Ctrl+Enter while suggestion already showing | Nothing — only one pending at a time |
| Ctrl+Enter on empty chapter | Works — uses Story Bible context alone |

**Quality check:** Copy out 3 ghost text suggestions and compare to the
manuscript. Do they match the voice? Do characters speak correctly?

---

## Feature 5 — Global Change

| Test | How | Expected |
|---|---|---|
| Basic rename | "Rename Aldoria to Valdris throughout" | Acknowledgement → scanning → preview modal |
| Two characters, same trait | Both Arthur and Mara have blue eyes. "Change Arthur's eye color to green" | Arthur's phrases in Clear, Mara's in Flagged |
| Deselect some, apply rest | Uncheck 2 clear matches, click Apply | Only checked ones change in DB |
| Cancel | Click Cancel | Zero changes in DB |
| Apply then open chapter | Apply all, navigate to chapter | Changed phrases visible in editor |
| Common word, no name | "change blue to green" | Most flagged as ambiguous |
| No chapters with content | Ask for change on empty project | Error: "No written content found" |

### The two-character test (most important)

Write this passage in a chapter:

> *Arthur's blue eyes caught the firelight. Across the room, Mara's blue eyes remained cold.*

Then ask Alex: **"Change Arthur's eye color from blue to green throughout."**

- Arthur's phrase → **Clear matches**
- Mara's phrase → **Flagged / ambiguous**

This validates the core intelligence of the feature.

---

## Cross-Feature Tests

| Test | Expected |
|---|---|
| Write → ghost text → proactive observer fires | Both work independently, no interference |
| Chat open + observer fires | New message appends to existing chat |
| Global change while editor is open | Change applies to DB; editor shows updated text on reload |
| Switch chapters with panel open | Panel stays open, recentText updates |
| Story Bible empty + chat | Alex still works, less contextual — no crash |

---

## DB Verification (Supabase Table Editor)

After testing, check:
- `coauthors` → project row with name + personality
- `coauthor_messages` → growing list, check `role` and `message_type` columns
- `chapters.content` → after global change apply, open the JSON and verify
  text nodes contain the updated phrases

---

## Known Behaviours (not bugs)

- Proactive observer sometimes returns nothing — Alex staying quiet is correct
- Ghost text pops in fully (no streaming yet) — streaming is a future improvement
- Global change "Skipped" count means a phrase couldn't be matched verbatim
  after the writer edited it between analysis and apply — normal
- Flagged items default to skipped — writer must explicitly approve each one

---

## Future: Cat Animation States (post co-author)

| State | Trigger |
|---|---|
| `watching` | User actively typing |
| `idle` | No typing for 10s |
| `thinking` | Alex generating a response |
| `speaking` | New message in panel |
| `celebrating` | Celebration message type |
| `sleeping` | User returns after 30+ min |
| `waking` | First keypress after sleeping |

Implementation: `lottie-react` + free JSONs from lottiefiles.com.
Find cat animations that share the same art style for visual consistency.
