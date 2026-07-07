# Xvault Studio — Credit System Specification

> Living document. Update whenever credit weights change.
> Last updated: 2026-07-06

---

## 1. Plan Tiers

| Tier      | Credits / month | Price / month | Revenue per credit | Typical utilization |
|-----------|-----------------|---------------|--------------------|---------------------|
| Trial     | 100             | $0            | $0                 | varies              |
| Hobbyist  | 300             | $11.99        | $0.0400            | ~47% (~142 credits) |
| Pro       | 600             | $24.99        | $0.0417            | ~76% (~455 credits) |

**Trial note:** 100 credits, 14 days. No credit card required. Credits reset once at end
of trial if user upgrades; otherwise account locks at 0.

---

## 2. API Cost Reference

Prices as of July 2026 (Gemini pricing, thinking OFF):

| Model                  | Input / 1M tokens | Output / 1M tokens |
|------------------------|-------------------|--------------------|
| Gemini 2.5 Flash       | $0.15             | $0.60              |
| Gemini 2.5 Pro         | $1.25             | $10.00             |
| gemini-embedding-001   | $0.00 (free tier) | —                  |

Rule of thumb: **1 word ≈ 1.3 tokens**

---

## 3. Credit Weights — Current vs Recommended

### 3a. Features that currently charge credits (confirmed in code)

| Feature | Route | Model | Code currently charges | Recommended | Rationale |
|---|---|---|---|---|---|
| Co-author chat | `/coauthor/chat` | Flash | **1** | **1** | ~$0.003 serving cost. Correct. |
| Ghost Writing — short | `/coauthor/suggest` (write/rewrite/continue <2000w) | Flash | **1** | **1** | ~$0.0012 serving cost. Correct. |
| Ghost Writing — long | `/coauthor/suggest` (chapter/2000w+ trigger) | Flash | **2** | **2** | ~$0.004 serving cost. Correct. |
| World Board — delta (auto) | `/worldboard` | Pro | **4** | **4** | See §5 for extreme analysis. |
| World Board — full rebuild | `/worldboard/reextract` | Pro | **10** | **See §3c** | Needs size-scaling (§5). |

### 3b. Features that currently charge ZERO credits — bugs

These routes make real AI calls but have no `checkRateLimit` call:

| Feature | Route | Model | Currently charges | Should charge | Serving cost |
|---|---|---|---|---|---|
| Proactive observation | `/coauthor/observe` | Flash | **0 (bug)** | **0 (keep free)** | ~$0.0025/fire |
| Chapter summarize | `/story-bible/summarize` | Flash | **0 (bug)** | **1** | ~$0.0012 |
| Synopsis generation | `/story-bible/generate-synopsis` | Flash | **0 (bug)** | **2** | ~$0.002 |
| Character analysis | `/story-bible/analyze-character` | Flash | **0 (bug)** | **2** | ~$0.002 |

**Why keep Observe free:** It is fully passive — the user never clicked anything. Charging
for an AI that speaks up uninvited would feel punitive and anti-user. The 30-minute
server-side cooldown caps maximum monthly exposure to ~480 calls × $0.0025 = $1.20/user,
which is acceptable to absorb as infrastructure cost. Do NOT charge for QUIET responses
(they're free already; QUIET fires when the AI decides not to say anything, so no output
tokens are generated).

### 3c. Recommended final credit weights

| Feature | Credits | Notes |
|---|---|---|
| Co-author chat | **1** | Per message |
| Ghost Writing — short | **1** | <2000 word output |
| Ghost Writing — long | **2** | 2000w+ (chapter/full scene) |
| Proactive observation | **0** | Passive, automatic, keep free |
| World Board — delta | **4** | Per automatic extraction pass |
| World Board — full rebuild | **10 (base) + 2 per 20K words over 60K** | See §5 |
| Chapter summarize | **1** | Per chapter (first-time auto: free) |
| Synopsis generation | **2** | Full synopsis from chapter summaries |
| Character deep analysis | **2** | Per character |

---

## 4. Actual Serving Costs Per Feature

Assumptions: Flash at $0.15 in / $0.60 out. Pro at $1.25 in / $10.00 out.
Typical novel context assembled by `assembleCoauthorContext` ≈ 5–15K tokens.

### Co-author Chat (1 credit)
- Input: 10K tokens (system + manuscript context + history + message)
- Output: 600 tokens
- Cost: (10K × $0.15/1M) + (600 × $0.60/1M) = **$0.0015 + $0.00036 = ~$0.0019**
- Revenue at Hobbyist: $0.060 → **margin: 97%** ✓
- Revenue at Pro: $0.050 → **margin: 96%** ✓

### Ghost Writing Short (1 credit)
- Input: 5K tokens (style + context + instruction)
- Output: 768 tokens (300–500 words)
- Cost: **~$0.0012**
- Margin: **98%** ✓

### Ghost Writing Long (2 credits)
- Input: 8K tokens
- Output: 4096 tokens (1800–2200 words)
- Cost: **~$0.0037**
- Revenue at Hobbyist: $0.12 → **margin: 97%** ✓

### World Board Delta (4 credits)
- Input: entity summary (~3K) + delta text (typical writing session ~1K–5K words = 1.3K–6.5K tokens)
- Output: JSON, ~2K tokens
- Typical cost: (9K × $1.25/1M) + (2K × $10/1M) = $0.011 + $0.02 = **~$0.031**
- Revenue at Hobbyist: $0.24 → **margin: 87%** ✓
- Worst case (full 80K import as one delta): (110K × $1.25/1M) + (4K × $10/1M) = $0.138 + $0.04 = **~$0.178** vs $0.24 revenue → **margin: 26%** — barely positive, see §5

### World Board Full Rebuild (10 credits base, 80K novel)
- 80K words = 16 chunks × 5K words each
- Per chunk: 6.5K tokens in + entity summary (~2–5K, growing) = ~10K in + ~2K out
- Per chunk cost: (10K × $1.25/1M) + (2K × $10/1M) = $0.013 + $0.02 = **$0.033**
- 16 chunks total: **$0.528**
- Revenue at Hobbyist (10 credits): $0.60 → **margin: 12%** — tight
- Revenue at Pro (10 credits): $0.50 → **margin: 5%** — dangerously thin

### Chapter Summarize (1 credit, first-time auto: free)
- Input: 3K words = ~4K tokens
- Output: ~200 tokens (2–3 sentences)
- Cost: (4K × $0.15/1M) + (200 × $0.60/1M) = **~$0.0007**
- Margin at 1 credit Hobbyist: **99%** ✓

### Synopsis Generation (2 credits)
- Input: chapter summaries block (~2–5K tokens)
- Output: 2048 tokens
- Cost: **~$0.002**
- Margin at 2 credits Hobbyist: **98%** ✓

### Character Deep Analysis (2 credits)
- Input: 6K words of character mentions = ~8K tokens
- Output: 1500 tokens
- Cost: (8K × $0.15/1M) + (1.5K × $0.60/1M) = $0.0012 + $0.0009 = **~$0.0021**
- Margin at 2 credits Hobbyist: **98%** ✓

---

## 5. Extreme Usage Scenarios

### Scenario A — "The Importer" (80K novel imported at once)
User pastes or imports a complete 80K word manuscript as one go.
- World Board delta fires with 80K words as deltaText: **~$0.18 serving cost**
- At 4 credits deducted: $0.24 revenue → margin barely positive at **25%**
- **Risk level: Medium.** One-time event, not repeatable without writing more.
- **Contingency:** Add a client-side check — if deltaText exceeds 20K words, break the
  call into chunks of 15K words and fire multiple delta requests. Each chunk deducts 4
  credits. Larger import = more credits consumed, which is correct behaviour.

### Scenario B — "The Rebuild Spammer" (re-extract on 200K word epic fantasy)
User writes an epic fantasy (200K words) and repeatedly hits "Rebuild World Board".
- 200K = 40 chunks × $0.033 = **$1.32 serving cost per rebuild**
- Current revenue: 10 credits × $0.06 = $0.60 → **LOSS of $0.72 per rebuild**
- **Risk level: High.** This breaks economics.
- **Fix:** Scale re-extract credits by manuscript size:
  - ≤60K words: 10 credits
  - 60K–100K words: 14 credits
  - 100K–150K words: 18 credits
  - 150K+ words: 24 credits
- **Additional contingency:** 24-hour cooldown on full rebuild. User can rebuild at most
  once per day. This prevents rapid-fire spam of the most expensive operation.

### Scenario C — "The Chat Addict" (non-stop chat user)
User treats Alex like a real-time messenger: 200+ messages per day.
- 200 messages/day × 30 days = 6,000 credits needed
- Pro plan has 500 credits — user is blocked well before end of month
- **This is exactly what credits are for.** The credit gate handles this automatically.
- **Risk: None.** System already handles it. No contingency needed beyond current design.
- **UX concern:** User hits the wall mid-session. See §6 for UX mitigations.

### Scenario D — "The Character Analyst" (analyzes every character repeatedly)
Novel has 15 characters. User runs character analysis on all of them 5 times.
- 15 × 5 × 2 credits = 150 credits on Hobbyist (75% of plan from one feature)
- Serving cost: 15 × 5 × $0.0021 = $0.16 → completely fine on our end
- **Risk: None financially.** But 150 credits is a lot to spend on this.
- **Contingency:** Cache analysis results. Re-analysis is free if manuscript hasn't changed
  meaningfully (track `last_extracted_word` watermark). Only re-charge on forced refresh.
  Add a "last analyzed on [date]" indicator so users know they already ran this.

### Scenario E — "The Proactive Observation Surge" (observe fires constantly)
User writes intensely for 8 hours, triggering observe every 30 minutes.
- 8 hours × 2 obs/hour = 16 calls/day × 30 days = 480 calls/month
- Most return QUIET (no tokens out) — call cost ≈ $0.001 for QUIET responses
- The ~20% that fire actual observations: 96 calls × $0.0025 = $0.24
- Total monthly observe cost: **~$0.32/user**
- At zero credits charged: we absorb this. Acceptable for a passive feature.
- **Risk: Low.** The 30-minute cooldown is the hard limit.

### Scenario F — "The Synopsis Regenerator" (repeatedly regenerates synopsis)
User generates synopsis 10 times refining it.
- 10 × 2 credits = 20 credits. Totally reasonable.
- Serving cost: 10 × $0.002 = $0.02 → negligible.
- **Risk: None.**

### Scenario G — "The First-Month Trial Abuser"
Trial user (100 credits) tries to max out every expensive feature.
- 1 World Board rebuild (10 credits) + 15 character analyses (30 credits) + 5 synopses
  (10 credits) + 50 chat messages = 100 credits gone in a focused session
- Serving cost: ~$0.60 (rebuild) + ~$0.03 (analyses) + ~$0.01 (synopses) + ~$0.15 (chat)
  = **~$0.79 serving cost on a free user**
- This is the maximum a trial user can cost us. $0.79 is acceptable CAC for a conversion.
- **Risk: Low.** Hard cap at 100 trial credits contains the damage.

### Scenario H — "The Hobbyist Power User at End of Month" (300 credits, heavy use)
Realistic heavy mix (1.4× typical):
- 84 chat messages: 84 credits
- 42 short ghost writes: 42 credits
- 7 long ghost writes: 14 credits
- World Board auto-fires 11 times during writing: 44 credits
- 3 chapter summarizes: 3 credits
- 2 character analyses: 4 credits
- 1 synopsis: 2 credits
- **Total: 193 credits** — fits within 300 ✓ (36% buffer)
- Serving cost: ~(84×$0.002) + (42×$0.0012) + (7×$0.004) + (11×$0.031) + (3×$0.0007)
  + (2×$0.0021) + $0.002 = $0.168 + $0.05 + $0.028 + $0.341 + $0.002 + $0.006 = **~$0.60**
- Revenue: $11.99 → **margin: 95%** ✓

### Scenario I — "The Pro Power User at End of Month" (600 credits, intense use)
Realistic heavy mix (1.3× typical):
- 240 chat messages: 240 credits
- 100 short ghost writes: 100 credits
- 20 long ghost writes: 40 credits
- World Board auto-fires 20 times (active writer): 80 credits
- 6 chapter summarizes: 6 credits
- 10 character analyses: 20 credits
- 3 synopsis generates: 6 credits
- 1 full rebuild on 80K novel: 10 credits
- **Total: 502 credits** — fits within 600 ✓ (16% buffer)
- Serving cost: ~(240×$0.002) + (100×$0.0012) + (20×$0.004) + (20×$0.031) + (6×$0.0007)
  + (10×$0.002) + (3×$0.002) + $0.528 = $0.48 + $0.12 + $0.08 + $0.62 + $0.004 + $0.02
  + $0.006 + $0.528 = **~$1.86**
- Revenue: $24.99 → **margin: 93%** ✓

---

## 6. Contingency Plans — "User Doesn't Feel Cheated"

The single biggest risk is a writer hitting 0 credits mid-chapter. They feel robbed.
Every contingency below is designed to prevent that feeling.

### 6.1 — Soft warnings at thresholds
Show in-app notifications (not blocking alerts) when credits drop:

| Threshold | Message |
|---|---|
| 25% remaining | "You have X credits left this month — heads up." |
| 10% remaining | "Running low on credits. Consider upgrading so you don't lose momentum." |
| 5 credits left | "Almost at your limit — upgrade now to keep writing without interruption." |

### 6.2 — Grace credits (10 credits on hitting 0)
When a user's credit balance hits exactly 0, automatically issue 10 grace credits.
This happens **once per billing period only**, not repeatedly.
- Grace credits only cover chat and ghost writing (not World Board rebuild)
- Shown as: "We gave you 10 bonus credits to finish your session."
- On billing renewal, grace credits are wiped and replaced with plan credits.
- Cost to us: at most 10 × $0.003 = $0.03/user/month. Negligible.
- Prevents the "I was mid-sentence and it cut me off" rage moment.

### 6.3 — Free features that never consume credits
These never touch the credit system regardless of plan:

- Proactive observation (passive, user didn't ask)
- First-time automatic chapter summarize on save (one free auto-summary per new chapter)
- Embedding/semantic search (very cheap, infrastructure cost)
- World Board reading/browsing (no AI call needed, reads from DB)
- Co-author chat panel *loading* (just reading DB, not calling AI)

### 6.4 — World Board delta: free for small writes
If `deltaText` is under 200 words (quick fix, typo correction, formatting change),
skip the World Board extraction entirely and charge 0 credits. The entity graph
doesn't need updating for tiny edits.
- Client-side: only trigger extraction when delta ≥ 300 words
- Prevents credit drain from saves/autosaves that aren't real writing sessions

### 6.5 — Character analysis: cache-first, charge only on miss
After first analysis, store the `last_extracted_word` watermark.
- If manuscript hasn't grown by 3,000+ words since last analysis: serve cached result, 0 credits
- Only charge 2 credits when re-running with significantly new manuscript content
- Show "Last analyzed on [date] · Re-analyze costs 2 credits" in the UI

### 6.6 — Synopsis caching
Synopsis generation is once-and-done per chapter summary state.
- `generate-synopsis` already skips if synopsis exists and `force !== true`
- Only charge 2 credits on forced regeneration
- First-time generation: 2 credits
- Subsequent reads: 0 credits

### 6.7 — World Board rebuild: cooldown + scaling
- Hard 24-hour cooldown between full rebuilds (server-enforced, not just UI)
- Credit cost scales with manuscript size (see §5 Scenario B)
- Show estimated credit cost before triggering: "Rebuilding a 90K word manuscript costs ~14 credits."

### 6.8 — Top-up credit packs (future, not launched yet)
When user hits 0 mid-month, offer:
- 50 credits: $3.99
- 150 credits: $9.99
- 350 credits: $19.99

These should be purchasable in one click without changing plan. Don't expire within the month.

### 6.9 — Monthly rollover (Pro only consideration)
Consider allowing Pro users to roll over up to 100 unused credits to the next month.
- Prevents "use it or lose it" anxiety
- Creates goodwill without significant financial risk (unused credits = zero serving cost)
- Adds perceived value vs. competitors who expire all credits

### 6.10 — Credit audit / transparency page
Show users a credit log: which feature used how many credits, on what date.
- Builds trust: "You spent 4 credits on World Board when you opened Chapter 8"
- Prevents "where did my credits go?" support tickets
- Simple DB query on `credit_transactions` table (needs to be created if not exists)

---

## 7. Known Bugs to Fix

| Bug | File | Fix |
|---|---|---|
| `observe` charges 0 credits | `src/app/api/ai/coauthor/observe/route.ts` | Intentionally keep at 0 — add comment explaining why |
| `summarize` charges 0 credits | `src/app/api/ai/story-bible/summarize/route.ts` | Add `checkRateLimit(userId, serviceClient, 1)` for forced re-summaries; skip credit for first-time auto |
| `generate-synopsis` charges 0 credits | `src/app/api/ai/story-bible/generate-synopsis/route.ts` | Add `checkRateLimit(userId, serviceClient, 2)` |
| `analyze-character` charges 0 credits | `src/app/api/ai/story-bible/analyze-character/route.ts` | Add `checkRateLimit(userId, serviceClient, 2)` |
| World Board comment incorrect | `src/app/api/ai/worldboard/route.ts` line 7-8 | Update stale comment — it DOES deduct 4 credits |
| Trial limit in UI says "100" | `src/lib/rate-limit.ts` | Verify: does `consume_ai_request` RPC actually cap trial at 100? Confirm with DB schema. |

---

## 8. World Board: Automatic + Manual Trigger Design

The World Board must work in two modes simultaneously:

### Automatic (current behaviour — keep)
Fires after the user writes a meaningful chunk of new text (delta ≥ 300 words).
Triggered by the editor on save. Deducts 4 credits per pass.
- Must continue working exactly as it does now
- Client should debounce: don't trigger if less than 300 words since last extraction

### Manual / User-triggered (to be added)
Add a "Sync World Board" button on the World Board panel.
- Calls `/api/ai/worldboard/reextract` for the current chapter only (not full novel)
- Costs 4 credits (same as delta, single chapter scope)
- Full "Rebuild Everything" option: calls reextract on all chapters, costs scaled credits
- Show a confirmation dialog with estimated credit cost before triggering full rebuild
- Show progress spinner and credit deduction confirmation when done

### What fires which endpoint
| Action | Endpoint | Credits |
|---|---|---|
| Writing ≥300 new words + save | `/worldboard` (delta, auto) | 4 |
| "Sync this chapter" button | `/worldboard/reextract` (single chapterId) | 4 |
| "Rebuild everything" button | `/worldboard/reextract` (no chapterId = all) | 10–24 (scaled) |

---

## 9. Summary — Credits at a Glance

Quick reference for building UI copy and onboarding tooltips:

```
1 credit  = 1 chat message with Alex
1 credit  = 1 short ghost write (Ctrl+K, <500 words)
1 credit  = 1 chapter summary
2 credits = 1 long ghost write (Ctrl+K, full scene)
2 credits = 1 character deep analysis
2 credits = 1 synopsis generation
4 credits = 1 World Board sync (automatic or manual)
10+       = Full World Board rebuild (scales with novel length)
```

Free (never deducted):
```
- Alex's proactive observations
- First auto-summary when you finish a chapter
- Browsing the World Board, Story Bible, character profiles
- Semantic search within your manuscript
```
