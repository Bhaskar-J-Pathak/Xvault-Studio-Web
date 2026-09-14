# Retention and contest decisions

## What PostHog currently says

Last 14 days, directional only:

- 8 identified users
- 1 reached the existing tutorial-step proxy
- 1 created a chapter according to the existing event sequence
- 0 recorded a `feature_used` activation event
- 0 completed the measured return path

The first generated funnel incorrectly suggested that the largest leak was immediately after identification. A follow-up path query showed that all 7 supposedly lost users actually reached `/studio`. Five finished on a studio or Story Bible route and two finished back on the marketing homepage. Several generated substantial studio page activity. Four rage clicks were spread across three accounts, while three `api_error` events were concentrated in one highly active account. The problem is therefore not signup access. It is failure to prove value and failure to measure activation reliably once users enter the studio.

The misleading funnel came from using `tutorial_step_reached` as a substitute for project creation. The current manuscript modal did not emit `project_created`, and tutorial events only occur after a later condition. The new flow now emits `project_created` directly.

## Activation event to optimize

The primary activation event is now `first_value_moment_reached`.

It fires when Xvault has successfully read the writer's prose and built the first World Board result. The writer then sees the number of story elements, relationships, and plot threads found, with a direct link to inspect them.

Supporting funnel:

1. `$identify`
2. `project_created` or `manuscript_imported`
3. `first_manuscript_text_added`
4. `first_value_moment_reached`
5. `feature_used`
6. a `$pageview` in a later session

## Contextual recovery prompts

- First studio visit: after 90 seconds, show a dismissible founder-help invitation.
- Returning visit: after 60 seconds, ask what the writer expected Xvault to do.
- Permanent access: a small “Stuck? Ask the founder” control remains available.
- Messages are saved through the existing feedback system and emailed to the founder.
- Track impressions, opens, dismissals, and submissions in PostHog.

## Contest policy

- The challenge runs from September 15 through September 30, 2026. It closes at 11:59 PM UTC.
- Each entrant receives 500 contest credits. This mirrors the monthly Founder allowance and gives entrants enough room to try prose tools, the co-author, World Board, Story Bible, and Story Pulse without rationing the product.
- Contest credits can be spent only inside the dedicated contest manuscript. Other projects use the writer's ordinary allowance.
- Contest credits should remain a separate temporary pool. Ordinary trial or paid credits should not be consumed during the challenge.
- When the writing window ends, unused contest credits expire. The manuscript stays accessible and editable. The writer's normal account allowance resumes unchanged.
- Do not delete or lock the manuscript after the contest.
- A subscription purchased during the contest should begin immediately but remain preserved beneath the contest pool until the challenge ends.

### Cost boundary

Ten fully allocated entrants represent 5,000 app credits, not 5,000 guaranteed provider calls. At current introductory Gemini 3.8 Flash pricing, ten entrants exhausting their allowances primarily on ordinary prose requests are estimated at roughly $80 to $175. An intentionally extreme Refine-and-repair pattern can cost more, but project scoping, a single non-renewable grant, and the fixed expiry limit exposure. Track provider token usage during the event rather than treating app credits as a direct cost unit.

## Reading and judging MVP

Do not build a general-purpose fiction social network for the first challenge. Build the smallest public layer that makes the result credible:

1. The writer submits an immutable snapshot of the entire contest manuscript and explicitly consents to public display.
2. Entries remain private until submissions close, preventing mid-contest copying and influence.
3. Judges receive anonymised entries and score the published rubric independently.
4. After judging, publish an entries gallery with a clean reading page for each story.
5. Publish finalists' category scores and a concise written rationale for the winner.
6. Keep the main prize judge-selected. If voting is added, make it a separate Readers' Choice award because public voting can be gamed and tends to reward audience size.

Required submission fields: story title, pen name, optional content note, publication consent, eligibility confirmation, and the manuscript snapshot. Do not publicly expose account email, internal project IDs, Story Bible data, or later manuscript edits.

The existing chapter Share feature is useful for private beta readers, but it is not the contest submission system. Contest entries must snapshot all chapters together and remain unchanged after the deadline.

## Experiment success criteria

- Primary: eligible completed submissions, not registrations.
- Activation: entrant reaches the first World Board or Story Pulse result.
- Product signal: percentage using at least two distinct AI features.
- Retention: opens the manuscript again 7 and 30 days after the contest.
- Commercial: starts a paid plan or buys a Founder seat within 30 days.
- Qualitative: states that Xvault caught or improved something they would otherwise have missed.

## 10K provider benchmark

The September 14 provider-backed benchmark generated 10,183 words with Gemini 3.8 Flash and ran the complete manuscript through Gemini 2.5 Pro World Board extraction. It used 22 app credits and an estimated $0.2222 of provider usage. A representative workflow including Story Pulse, Story Bible, twenty co-author conversations, ten rewrites, five What-if branches, a global change, and one complete re-extraction totals roughly 82 to 92 credits. See `docs/contest-10k-budget-2026-09-14.md` for token counts and assumptions.

## Decisions required before public launch

1. Winner announcement date.
2. Whether every eligible entry is published or writers can submit privately to judges.
3. Whether to award a separate Readers' Choice prize and what that prize is.
4. Finalist credit award.
5. Eligibility rules, minimum age, countries, and whether fanfiction is allowed.
6. Judging panel, tie-breaking process, and handling of plagiarism.
