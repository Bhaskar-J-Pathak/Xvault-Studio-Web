# Week 3 - Behind the Scenes + Platform

---

## Post 13 - Building for Novelists (Not Writers in General)

**Topic:** Product philosophy
**Best day to post:** Monday

### LinkedIn

When we started building Xvault, we had to make a decision.

Build a writing tool for everyone, or build it specifically for novelists.

We chose novelists. Here is why that matters.

A novelist's problems are fundamentally different from a blogger's or an essayist's. You are managing 80,000 to 120,000 words. Characters who appear in chapter 2 and do not return until chapter 34. Plot threads that span the entire manuscript. A world with its own internal logic that has to stay consistent.

No tool built for "writers" handles that well.

Every feature we build starts with the same question: what does someone writing a novel specifically need here? Not what does a writer need. Not what does an AI tool usually do. What does someone managing a 100,000-word story with 12 characters need, right now, in this moment?

That question changes everything about what you build.

### X

When we built Xvault, we had to choose:

Build for writers in general, or build specifically for novelists.

We chose novelists.

Because the problems are fundamentally different. 80,000-120,000 words. Characters across 34 chapters. World logic that has to stay consistent.

No general writing tool handles that. Not really.

---

## Post 14 - A Bug We Fixed This Week

**Topic:** Engineering insight
**Best day to post:** Wednesday

### LinkedIn

We fixed a bug this week that looked small and turned out to be interesting.

When a user asked Alex (our AI co-author) about a character's motivation in a specific chapter, Alex was occasionally pulling context from the wrong section of the manuscript. The response was technically accurate but about a different part of the story.

The root cause: our context retrieval was ranking by semantic similarity alone. "Character motivation" would pull passages about that character from across the entire manuscript, sometimes prioritizing emotionally intense scenes over the ones actually relevant to the chapter in question.

The fix was weighting retrieval by both semantic similarity and narrative position. Later chapters can reference earlier ones. Earlier chapters should not be contaminated by what happens later.

It is a small change with a big impact on how the tool actually feels to use.

Bugs like this are the interesting part of building software that tries to understand story structure. The edge cases reveal assumptions you did not know you were making.

### X

We fixed a bug this week.

Alex was pulling context from the wrong part of the manuscript. Technically accurate. Wrong chapter.

Root cause: ranking by semantic similarity alone. A character's motivation surfaced emotionally intense scenes, not necessarily the right ones.

Fix: weight by both similarity and narrative position.

Bugs like this reveal assumptions you didn't know you were making.

---

## Post 15 - Why Continuity Checking is Hard to Build

**Topic:** Engineering + craft
**Best day to post:** Friday

### LinkedIn

Continuity checking sounds like a simple feature.

Find the things that contradict. Flag them. Done.

It is not.

The hard part is not detecting contradictions. It is understanding what counts as one.

A character described as cautious in chapter 2 who takes a huge risk in chapter 18 might be a contradiction. Or it might be the entire point of the story. Their arc. The change you have been building toward for 60,000 words.

A location described as a small town in chapter 1 and a city in chapter 9 might be a continuity error. Or the narrator might have been wrong about it, and the revision of that perception is intentional.

The system has to understand context, not just facts. That is a much harder problem than it looks like from the outside.

We are still working on getting it right.

### X

Continuity checking sounds simple.

Find contradictions. Flag them. Done.

The hard part: understanding what counts as one.

A character who acts out of type might be a continuity error. Or it might be their arc.

The system has to understand context, not just facts. That's a much harder problem.

---

## Post 16 - Voice Matching in AI Writing

**Topic:** AI + craft
**Best day to post:** Tuesday

### LinkedIn

One of the features we think about most is voice matching.

The problem it is solving: AI-generated text sounds like AI. It has a particular rhythm, a particular set of defaults, a baseline style that leaks through regardless of the prompt.

If you are a novelist, that is a serious problem. Your voice is your identity as a writer. Readers follow you across books because of it. An editor will spot AI text in your manuscript immediately because it sounds like someone else wrote it.

Our approach: train the prose generation on your existing chapters. Not on a general style description you provide. On what you have actually written. The sentence lengths you favor. The details you include. The way you handle interiority. The words you reach for.

It is not perfect. But a voice match score of 90 percent or higher is meaningful. It means the suggestion sounds like a plausible draft in your voice, not a generic output.

We still have a lot of ground to cover on this one.

### X

AI text sounds like AI. A style that leaks through regardless of the prompt.

For novelists, that's a real problem. Your voice is your identity.

Our approach: train prose generation on your existing chapters. Not a style description. What you've actually written.

Not perfect. But a 90%+ match means it sounds like a draft in your voice.

---

## Post 17 - What "Knowing Your Story" Means for AI

**Topic:** AI philosophy
**Best day to post:** Thursday

### LinkedIn

Most AI writing tools ask you to describe your story.

Then they help you write based on that description.

The problem: your description of a 90,000-word manuscript is not the same thing as the manuscript. You will leave things out. You will summarize in ways that lose nuance. You will forget to mention the thing that turns out to matter.

We took a different approach. Alex reads the whole thing.

Not a summary. Not a description. The actual text. Every chapter.

This changes what is possible. Alex can cite specific paragraphs. It can notice things you described in chapter 6 that are being contradicted in chapter 31. It can reference a minor character's one line of dialogue from 40,000 words ago.

The goal is for the AI to know your story the way you know it when you are deep in a draft. Not as a description of itself. As itself.

### X

Most AI writing tools ask you to describe your story.

Your description of a 90,000-word manuscript is not the manuscript.

Alex reads the whole thing. Every chapter.

Then it can cite specific paragraphs. Notice contradictions across 30,000 words. Reference a minor character's one line from 40,000 words ago.

That's the difference.

---

## Post 18 - World Board and Automatic Worldbuilding

**Topic:** Feature education
**Best day to post:** Saturday

### LinkedIn

One of the questions we got during beta: why would I want an automatic worldbuilder?

Fair question. Worldbuilding is often one of the most enjoyable parts of writing fiction. Why automate it?

The answer is that World Board is not a worldbuilder. It is a worldbuilding tracker.

You create the world. You make the decisions. The characters, places, objects, and relationships are yours.

What World Board does is track them as they appear in your actual manuscript, not as you imagined them in notes. Because often what you write and what you planned are slightly different. And the manuscript is the truth.

It surfaces connections between things without requiring you to enter them manually. Two characters who share a history get linked when that history shows up on the page. A location gets every scene set there. A mysterious item tracks every time it is mentioned.

It is not replacing your imagination. It is keeping up with it.

### X

World Board isn't a worldbuilder. It's a worldbuilding tracker.

You create the world. It tracks what you've actually written.

Because often what you write and what you planned are slightly different.

And the manuscript is the truth.
