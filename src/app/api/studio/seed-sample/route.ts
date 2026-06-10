/**
 * POST /api/studio/seed-sample
 * Seeds "The Glass Meridian" thriller sample project for a new user.
 * Called once after the genre picker. Returns { projectId, chapterId }.
 */

import { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/auth";
import { geminiEmbed } from "@/lib/ai";
import { chunkText } from "@/lib/chunking";
import { sendWelcomeEmail } from "@/lib/email";

// ── Lexical JSON helpers ──────────────────────────────────────────────────────

function makeTextNode(text: string) {
  return { detail: 0, format: 0, mode: "normal", style: "", text, type: "text", version: 1 };
}

function makeParagraph(text: string) {
  return {
    children: [makeTextNode(text)],
    direction: "ltr", format: "", indent: 0,
    type: "paragraph", version: 1,
  };
}

function textToLexical(text: string): Record<string, unknown> {
  const paragraphs = text.trim().split(/\n\n+/).filter(p => p.trim());
  return {
    root: {
      children: paragraphs.map(p => makeParagraph(p.replace(/\n/g, " ").trim())),
      direction: "ltr", format: "", indent: 0,
      type: "root", version: 1,
    },
  };
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ── Chapter content ───────────────────────────────────────────────────────────

const CHAPTER_1 = `The message arrived at 2:14 AM.

Nadia Voss was already awake — she hadn't slept past three in six years. The apartment on Korunní was dark except for the city glow bleeding through the curtains: that grey-orange nothing-light of Prague at night. She'd been sitting at the kitchen table with a glass of water, watching the pigeons on the ledge opposite. They didn't sleep either.

The device was in the drawer beneath the sink, behind the cleaning supplies, inside a waterproof case she'd told herself she would throw into the Vltava eighteen months ago. She hadn't. She told herself she'd kept it for the hardware. That was a lie she'd gotten reasonably good at.

The tone was three pulses. Short, short, long. The old recognition signal.

She didn't move for a full minute. Then she got up, took the device from the case, and read the message.

MERIDIAN STILL ACTIVE. HALE NEEDS YOU. DINER ON MÁNESOVA. 09:00.

No sender ID. Encrypted with a key she hadn't used since Bucharest. She stared at it long enough that the screen dimmed and went dark, then she set it face-down on the table and went back to looking at the pigeons.

At 8:30 she put on her coat.

The diner on Mánesova was called Kavárna Modrý Stůl. Blue table. It had blue-painted furniture and the kind of lighting that flattered no one — flat, fluorescent, honest. Nadia arrived twelve minutes early and chose a seat with her back to the wall and a clear line to both exits. Old habit. She ordered coffee she didn't intend to drink and watched the door.

Marcus Hale came in at 9:04.

He was older than she remembered — of course he was, it had been six years — but the ageing hadn't softened him the way it softened some men. It had clarified him instead. The silver at his temples had spread to most of his hair now, cut short and neat. He wore a grey wool coat, no tie, a posture that had never quite abandoned the military bearing underneath the civilian veneer. He scanned the room before he sat down. He always did that. So did she.

"Nadia." He took the seat across from her. Not the one beside her, not the one with his back to the door — the one that put him facing her, open, deliberate. "Thank you for coming."

"Who sent the message?" she said. She hadn't touched the coffee.

"I don't know."

"Marcus."

"I genuinely don't know." He took off his coat, folded it over the back of the chair. "That's the problem. Someone used the old Bucharest protocol. The encryption keys should have been destroyed."

"They were."

"Clearly not all of them." He studied her face. He'd always been good at that — reading her — which was one of the reasons she hadn't kept in touch. "Are you all right?"

"I'm fine. What does MERIDIAN STILL ACTIVE mean?"

He was quiet for a moment. The diner clattered around them — a spoon against a saucer, the low murmur of a conversation two tables over, the hiss of a milk steamer. "The Meridian Group," he said finally. "We shut them down in 2021. Or we thought we did. Some of us had doubts."

"You had doubts. You always had doubts about that closure."

"The file was incomplete. There were names missing. Personnel that should have been accounted for and weren't." He turned his coffee cup in his hands without drinking from it. "I've been watching for signals. Three weeks ago I started seeing them. Small things. The kind of things you wouldn't notice unless you were looking for them."

"What kind of things?"

"Account activations. Travel patterns. A safe house in Bratislava that should have been decommissioned."

"That could be anything. A private contractor, an unrelated operation —"

"It could be." He nodded. "It could also be exactly what it looks like."

Nadia looked at the coffee. It had gone cold. "What do you need from me?"

"I need someone who knows the original architecture. Who was on the inside when Meridian was active. There are three people who fit that description and I trust implicitly." He paused. "Two of them are dead."

She looked up at him.

"Which leaves you," he said. Not apology in his voice, not manipulation — just the flat delivery of a fact. That was the other reason she'd kept her distance. Marcus Hale never dressed things up. "I'm not asking you to go back into the field. I need you to look at some documents, give me context, tell me what you see. One conversation, maybe two."

"And after that?"

"After that you go back to your apartment and your pigeons and I don't bother you again."

He knew about the pigeons. She hadn't told him that. She filed it and moved on. "You said one conversation, maybe two. What's the first one about?"

"There's a file. Not physical — digital, archived. The Glass Meridian. It was supposed to have been destroyed with everything else in the 2021 closure. I have reason to believe it wasn't."

The name was unfamiliar to her. She'd been deep in Meridian's operational structure for three years and she'd never heard it. That meant it was either above her clearance level or it hadn't existed when she was in. Neither option was comfortable. "Where is it?"

"That's what I need to find out. I have a lead — an archivist in Vienna, someone who has access to the kind of buried files that don't officially exist. Elias Vong. Have you heard of him?"

"No."

"He's careful. He won't speak to me directly — I'm too visible. But he might speak to you." Marcus reached into his coat pocket and slid a small card across the table. An address, handwritten. "Take a few days to think about it. I can find another approach if —"

"I'll do it," she said.

She didn't know why she said it. She'd had no intention of agreeing when she walked in. But the name — the Glass Meridian file, a thing that had existed inside an organisation she knew from the inside and had never heard mentioned, not once — that bothered her more than she expected it to.

She picked up the card.

Marcus nodded, as if he'd expected it all along. "I'll be in touch in two days with —"

She heard the door open behind her and felt, rather than saw, the shift in the room's attention. When she looked up, the waiter had stopped moving. Two tables away, the couple with the coffee had gone still.

She turned.

The woman standing in the diner doorway was looking at Nadia with the focused, purposeful attention of someone who has finished doing something else and has moved on to the next task. Then she held up a phone, said something in Czech that Nadia didn't catch, and left.

Nadia turned back to Marcus.

He wasn't there. His coat was gone. His coffee cup sat on the table, still warm, barely touched.

The message on her device had said: HALE NEEDS YOU.

Past tense, she realised, was probably what someone should have used.

She found Marcus forty minutes later, in the alley behind the diner. He was sitting against the wall with his coat still folded over his arm, like a man who had simply decided to rest. He looked peaceful. He didn't look murdered.

She checked for a pulse because she had to, not because she expected to find one.

She stood up. Looked down the alley in both directions. No one. Just the ordinary sounds of a Prague morning — traffic, trams, the city entirely indifferent to the fact that a man she had known for eleven years was dead.

She reached into her coat and took out the card with the Vienna address.

The Glass Meridian file.

Someone had killed Marcus before he could tell her what was in it. Someone had used the old Bucharest keys to get her here. Someone had wanted her to know that Meridian was still active and had then, apparently, changed their mind.

Or not changed their mind. Removed the middle man.

She put the card back in her pocket and walked out of the alley. She had a train to catch.`;

const CHAPTER_2 = `The archive was not on any map.

Nadia had spent the train journey to Vienna running Elias Vong through every framework she still had access to — which was less than she once had, but more than most civilians. He existed in fragments: a dissertation on Cold War document preservation from 2003, a conference paper from 2009, a gap in the record after that which was itself a kind of record. People who worked in certain kinds of archives didn't advertise. The gap told her more than the papers had.

The address Marcus had given her led to a decommissioned library in the fourth district. Pale stone, art nouveau ornament softened by a century of weather, windows that hadn't been cleaned since before the last government changed. The official sign said CLOSED FOR RENOVATION. It had said that since 2018.

She went around to the side entrance.

The door was steel, recessed into the stone, with a keypad that looked newer than everything around it. She didn't have a code. She knocked instead.

Silence for long enough that she was beginning to think about alternatives. Then a voice, through an intercom she hadn't noticed: "Building is closed."

"I know. I'm looking for Vong. My name is Nadia Voss."

Another silence. "I don't know that name."

"I'm aware. Marcus Hale gave me this address."

The pause that followed was different from the first two. Shorter. "Marcus Hale is dead," the voice said.

"Yes. That's partly why I'm here."

The door opened.

Elias Vong was shorter than she'd expected, which meant nothing — she had no particular reason to have expected anything. He was in his mid-forties, slight, with the careful movements of someone who worked with irreplaceable things and had extended that habit to his own body. Round glasses. A cardigan that had been expensive once. He looked at her the way a man looks at a mathematical problem: not hostile, not welcoming, analytical.

"Come in," he said. "Don't touch anything."

The interior was subterranean. Steps led down from the entrance hall into a space that had clearly once been something else — a storage vault, perhaps, or a wine cellar from the building's previous life — and had been converted, with considerable care, into a document archive. Rows of shelving. Climate-controlled cases. The quiet hum of preservation technology.

"You're not official," he said. It wasn't a question.

"No."

"Marcus was official. Or he was once. You're something else." He was pulling on cotton gloves as he spoke. Habit. "How did he die?"

"Someone made it look natural. It wasn't."

He nodded, unsurprised. "When you work with documents that powerful people want to believe don't exist, you develop certain expectations about how things end." He gestured to a chair beside a reading table — the only chair in the room that wasn't stacked with something. "Sit. Tell me what you want."

"Marcus mentioned a file. The Glass Meridian."

Vong stopped moving.

It was only for a half-second, and then he was in motion again, moving to one of the shelving units with the same measured efficiency as before. But she'd seen it. "You've heard of it," she said.

"I've heard of most things." He pulled a box from the shelf without looking at the label. He knew the room by heart. "What is your interest?"

"Marcus is dead. Someone used encryption keys from an operation called Bucharest to contact me and bring me into this. Then they killed Marcus before I could learn what he knew. I'd like to understand what I walked into."

"Bucharest," Vong said, and something in his voice changed. He set the box down on the table between them and looked at her directly for the first time. "Were you part of that operation?"

"I was the operation. I was the analyst in the field. The whole thing was built around my access."

"And then it wasn't anymore."

She had spent six years building a functional wall between herself and what had happened in Bucharest. Not forgetting — she couldn't forget — but treating it as a fact rather than an event. A thing that had occurred, that had weight and shape, that she could look at from a fixed distance without it moving. "They burned me," she said. "My cover, my network. Everyone I'd spent three years building relationships with. It happened in seventy-two hours." She kept her voice flat. "I assumed it was a security breach. An intelligence failure. I was in protective custody for four months while they worked out what had happened."

"And what did they determine?"

"That it was a breach. An intelligence failure."

Vong looked at her steadily. "It wasn't."

She'd known this, somewhere, in the way you know things that are too large to fully look at. She'd known it from the pattern of what had happened — too clean, too targeted, too specific about what was burned and what wasn't. She'd known it and she'd chosen, very deliberately, not to pursue it. "Tell me," she said.

"The Meridian Group ran a containment protocol in Bucharest. You had gotten too close to something — a network of financial conduits that Meridian was running through the region. Not intelligence work, not sanctioned. Private. Profitable." He opened the box. Inside: a series of folders, numbered, their labels faded. "When it became clear that your analysis was going to surface those conduits, the decision was made to terminate the operation. Your operation. You were the liability."

"Marcus sanctioned it."

"Marcus was told to sanction it. He was given a version of events in which the breach was real." Vong looked at her. "I don't know if he knew the truth. I suspect not. He wasn't useful enough to Meridian to be made complicit — easier to deceive him."

Nadia sat with this. The wall she'd built was still there, but she could feel the weight of it differently now — not something she'd constructed for protection, but something that had been built around her from the outside. A cage she'd mistaken for a shelter. "The Glass Meridian file," she said. "What is it?"

"It's the complete record of Meridian's operations from 2015 to 2021. Everything that was officially destroyed in the closure — the financial ledgers, the personnel files, the operational records. Every sanctioned action and every unsanctioned one." He touched the top folder but didn't open it. "Including Bucharest. Including the names of everyone who authorised what was done to you."

"Where is the file?"

"The digital version was supposed to be destroyed. I have reason to believe it was copied before destruction and moved." He paused. "Marcus came to me three weeks ago asking the same question. I told him what I've told you. A week later someone tried to access my records remotely. A week after that, he's dead."

"Who has the copy?"

"Someone still inside Meridian. Or someone who was inside Meridian and left with leverage." He closed the box. "The message you received — the one that used the Bucharest keys — I think that was the same person. Someone who wanted you here, in this room, having this conversation."

"Why?"

"Because you're the only surviving person with a direct claim against the Meridian Group's leadership. You were the subject of an illegal containment action. You have standing to destroy them, if you had the evidence." He looked at her across the table. "The Glass Meridian file is your evidence."

She thought about the woman in the diner doorway, who had looked at her with the clean attention of someone finishing one thing and moving to the next. She thought about Marcus, sitting against the alley wall with his coat still folded. She thought about the message at 2:14 AM, three pulses, the old recognition signal from a key that should have been ashes.

Someone was moving her. That was clear. The question was whether they were moving her toward something or away from it.

"I need to find the copy," she said.

Vong was quiet for a moment. Then he reached into the box and removed the top folder. He set it on the table in front of her. "Start here," he said. "These are Marcus's notes from the last three weeks. He left a copy with me in case he didn't come back from Prague." He paused. "He didn't come back from Prague."

She opened the folder.

The first page was a list of names. She didn't recognise most of them. But at the bottom, circled in Marcus's careful handwriting, were three words she did recognise.

The Exchange. Prague.

A location she knew. A transaction she hadn't been told about. A thread that ran, she was beginning to understand, from Bucharest six years ago through the body in the alley to wherever she was going next.

She turned the page.`;

const CHAPTER_3 = `The hotel was called The Aurelius. Twelve stories of mid-century glass and concrete in the Vinohrady district, the kind of hotel where business travellers stayed when they wanted to be anonymous without looking like they were trying to be. Nadia had checked in under a name that wasn't hers, paid cash for two nights, and spent the first night reading Marcus's notes until she understood what she needed to do next.

The contact was supposed to meet her on the rooftop terrace at 9 PM. She was there at 8:40.

Prague at night from twelve stories was exactly what it always was: beautiful in the specific way of cities that have survived more history than they were built for, that carry the weight of it in their stones and bridges and in the way people walk in their streets, as if they know they are being watched by the past. Nadia didn't find it comforting. She found it useful. A rooftop with sight lines to three streets and two exits and enough ambient light to read faces without being read yourself — that was what she needed.

She had a glass of wine she wasn't drinking and she watched the door.

The man who came through it at 9:03 was not what she'd expected, though she'd been careful not to expect anything too specific. He was in his early fifties, compact, with a stillness about him that she recognised as trained rather than natural. Dark coat. No tie. He carried a thin briefcase with the casualness of someone who wanted it to look casual.

He spotted her immediately. Of course he did.

"Voss," he said, sitting across from her without a greeting. "You made it."

"I'm here." She studied his face. It was a face that gave away nothing, which was itself information. "You arranged all of this."

"Not all of it. The message, yes. Vong, yes — I needed you to understand the context before we spoke." He set the briefcase on the table between them. "Hale's death was not part of the plan."

"Someone killed him."

"Yes. Someone who knew he'd spoken to Vong and didn't want the conversation continuing." He didn't look away from her. "Not me. I want you to understand that. What I wanted was for Hale to be in this conversation. His death complicates things."

"Who are you?"

"My name doesn't matter. What matters is that I have access to something you need and I need something in return." He opened the briefcase and turned it to face her.

Inside: a drive. Small, matte black, the kind of hardware that was anonymous by design.

"The Glass Meridian file," he said. "Or a portion of it. The financial records, the operational summaries, the Bucharest containment authorisation chain." He paused. "Your name is in there forty-seven times. As subject, not as participant. As a person who was sacrificed to protect a private financial network that had no legitimate function. Every signature that authorised that sacrifice is in those records."

She looked at the drive without touching it. "What do you want?"

"There's a name in the file. A current name — someone who is still active, still protected, still running the remnant of what Meridian became after the official closure. I want that name excluded from any disclosure. Everything else, you can do what you want with. The financial records, the operational history, Bucharest — all of it. One name redacted."

"You're protecting someone."

"I'm protecting someone from something they didn't fully choose." He closed the briefcase. "They were recruited young. The things they did — some of them were sanctioned, some weren't, but the line was blurred for them deliberately. I'm not asking you to forgive anything. I'm asking you to make a distinction between people who built this and people who were built by it."

She thought about this. There was a version of this offer that was straightforward: she took the drive, used the records, brought down the people who had burned her network and killed Marcus and let six years of her life go to waste. One name redacted, the rest of the reckoning intact. It was, in practical terms, a reasonable exchange.

There was another version of this offer that was something else entirely.

"Whose name?" she said.

"I can't tell you that until we have an agreement."

"Then we don't have an agreement."

He looked at her steadily. "You understand that without this file, you have nothing. Everything Vong told you is testimony without documentation. The Meridian Group — what's left of it — has lawyers and money and people in the right offices. You have a story about Bucharest that the official record contradicts."

"I know that."

"Then you understand why —"

"I understand the offer," she said. "I'm telling you it's not acceptable without knowing the name."

A silence settled between them, backed by the city sounds twelve floors below. Somewhere a tram bell rang, small and clear. The wine in her glass had gone warm.

"All right," he said finally. He reached into his coat pocket and took out a folded piece of paper. He slid it across the table face-down. "Open it after I leave. If the name is someone you can live with protecting, keep the drive. If it isn't, we go our separate ways."

She didn't touch the paper.

"There's something else," she said. "The message. The Bucharest keys. You said you sent the message — but how did you have those keys? They should have been destroyed."

He looked at her for a long moment. Something crossed his face that she couldn't categorise — not guilt exactly, not regret exactly. Something with the texture of both. "Some copies were kept," he said. "By people who thought they might need them someday."

"Who else had them?"

He stood, picked up the briefcase. Left the drive on the table. "That," he said, "I genuinely don't know."

He walked to the door and paused with his hand on it. "The name on that paper — whatever you decide — I'd like you to know it wasn't chosen carelessly." Then he left.

She sat on the terrace for a long time after. The city hummed below her, indifferent and continuous. Marcus was dead. Vong was compromised by whatever she'd set in motion when she knocked on his door. The file she'd come here to find was sitting on a hotel rooftop table in a matte black drive, and she still didn't know who had sent the original message, or why, or what exactly they had wanted to set in motion by doing it.

She reached out and picked up the piece of paper.

She unfolded it.

She read the name.

The glass of warm wine was still in front of her. She picked it up and drank it in one go, which was not something she normally did, and then she set the glass down and looked at the city and tried to decide what kind of person she was going to be next.

The drive sat on the table. The paper sat on the table.

The city didn't care either way.

She put the paper in her pocket. She put the drive in her bag.

She left the rooftop.

It was the beginning, she understood, not the end of it. The file wasn't what she'd thought it was — complete, conclusive, a key that opened a lock. It was a door, and she'd just found out what was on the other side: something more complicated and more dangerous and less resolvable than a simple act of reckoning.

She took the stairs.`;

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Only seed once per user
  const { data: existing } = await supabase
    .from("projects")
    .select("id, chapters(id)")
    .eq("user_id", user.id)
    .eq("is_sample", true)
    .maybeSingle();

  if (existing) {
    const chapterId = (existing.chapters as { id: string }[])?.[0]?.id;
    return Response.json({ projectId: existing.id, chapterId });
  }

  // ── 1. Create the project ─────────────────────────────────────────────────
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title: "The Glass Meridian",
      genre: "thriller",
      is_sample: true,
    })
    .select("id")
    .single();

  if (projectError || !project) {
    return Response.json({ error: "Failed to create project" }, { status: 500 });
  }

  const projectId = project.id;

  // ── 2. Insert chapters ────────────────────────────────────────────────────
  const chapters = [
    { title: "Chapter 1: The Call",     content: CHAPTER_1, position: 0 },
    { title: "Chapter 2: The Archive",  content: CHAPTER_2, position: 1 },
    { title: "Chapter 3: The Exchange", content: CHAPTER_3, position: 2 },
  ];

  const { data: insertedChapters, error: chaptersError } = await supabase
    .from("chapters")
    .insert(
      chapters.map((c) => ({
        project_id: projectId,
        title: c.title,
        content: textToLexical(c.content),
        word_count: countWords(c.content),
        position: c.position,
        summary: null,
        last_embedded_word: 0,
        last_extracted_word: 0,
      }))
    )
    .select("id, position");

  if (chaptersError || !insertedChapters?.length) {
    return Response.json({ error: "Failed to create chapters" }, { status: 500 });
  }

  const sortedChapters = insertedChapters.sort((a, b) => a.position - b.position);
  const chapter1Id = sortedChapters[0].id;

  // ── 3. Insert entities ────────────────────────────────────────────────────
  const { data: insertedEntities } = await supabase.from("entities").insert([
    {
      project_id: projectId,
      name: "Nadia Voss",
      type: "character",
      description: "Ex-intelligence analyst, forced back into the field after six years.",
      attributes: {
        hair_color: "Dark brown, cut short",
        eye_color: "Grey",
        age: "Late 30s",
        personality: "Methodical, distrustful, reads rooms before she reads people",
        motivations: "Find out who killed Marcus. Understand what Bucharest really was. Get out clean.",
        dialogue_style: "Clipped. Never asks a question she doesn't already know the answer to.",
        character_arc: "Learns that the betrayal in Bucharest was sanctioned from above — and must decide what to do with that knowledge.",
      },
      position: { x: 200, y: 150 },
    },
    {
      project_id: projectId,
      name: "Marcus Hale",
      type: "character",
      description: "Nadia's former handler. Found dead in an alley behind a Prague diner in Chapter 1.",
      attributes: {
        hair_color: "Silver",
        age: "Late 50s",
        personality: "Warm on the surface, calculating underneath",
        role: "Catalyst — his death drives the entire plot. He was deceived about Bucharest.",
        last_known_words: "I'm not asking you to go back into the field.",
      },
      position: { x: 450, y: 150 },
    },
    {
      project_id: projectId,
      name: "Elias Vong",
      type: "character",
      description: "Underground archivist operating from a decommissioned library in Vienna. Knows where all the buried files are.",
      attributes: {
        age: "Mid 40s",
        personality: "Nervous, precise, speaks in qualifications",
        motivations: "Stays neutral. Helps whoever gets to him first — within limits.",
        dialogue_style: "Academic. Lots of 'technically' and 'strictly speaking'. Precise about what he knows vs. what he infers.",
        location: "Vienna — subterranean archive beneath a decommissioned library",
      },
      position: { x: 200, y: 350 },
    },
    {
      project_id: projectId,
      name: "Nadia's apartment — Prague",
      type: "location",
      description: "Sparse, deliberately unmemorable. A professional's home. Korunní district. She keeps a device she told herself she'd thrown away.",
      attributes: { district: "Vinohrady, Prague", tone: "Minimalist, controlled" },
      position: { x: 600, y: 250 },
    },
    {
      project_id: projectId,
      name: "The Archive — Vienna",
      type: "location",
      description: "Subterranean document vault beneath a decommissioned library in Vienna's fourth district. Climate-controlled. Not on any map.",
      attributes: { district: "Fourth district, Vienna", officially: "Closed for renovation since 2018" },
      position: { x: 600, y: 400 },
    },
    {
      project_id: projectId,
      name: "The Meridian Group",
      type: "faction",
      description: "A private intelligence contractor with government access. Officially shut down in 2021. Someone is running the remnant.",
      attributes: {
        status: "Officially dissolved, actually active",
        operations: "Financial conduits, containment actions, intelligence access",
        key_document: "The Glass Meridian file — complete operational records 2015–2021",
      },
      position: { x: 400, y: 350 },
    },
  ]).select("id, name");

  // ── 3b. Insert relationships ──────────────────────────────────────────────
  if (insertedEntities?.length) {
    const entityByName = Object.fromEntries(
      insertedEntities.map((e: { id: string; name: string }) => [e.name, e.id])
    );
    const nadia    = entityByName["Nadia Voss"];
    const marcus   = entityByName["Marcus Hale"];
    const elias    = entityByName["Elias Vong"];
    const meridian = entityByName["The Meridian Group"];

    const rels: { project_id: string; source_id: string; target_id: string; label: string }[] = [];
    if (nadia && marcus)   rels.push({ project_id: projectId, source_id: nadia,  target_id: marcus,   label: "former handler" });
    if (nadia && elias)    rels.push({ project_id: projectId, source_id: nadia,  target_id: elias,    label: "reluctant informant" });
    if (nadia && meridian) rels.push({ project_id: projectId, source_id: nadia,  target_id: meridian, label: "former operative" });
    if (marcus && meridian) rels.push({ project_id: projectId, source_id: marcus, target_id: meridian, label: "unknowing asset" });

    if (rels.length) await supabase.from("relationships").insert(rels);
  }

  // ── 4. Insert plot threads ────────────────────────────────────────────────
  const totalWords = chapters.reduce((s, c) => s + countWords(c.content), 0);

  await supabase.from("plot_threads").insert([
    {
      project_id: projectId,
      description: "Who sent the encrypted message using the Bucharest keys? The sender activated recognition signals that should have been destroyed — but never identified themselves.",
      introduced_chapter_id: chapter1Id,
      last_seen_chapter_id: sortedChapters[1]?.id ?? chapter1Id,
      last_seen_word_position: countWords(CHAPTER_1) + countWords(CHAPTER_2),
      total_project_words: totalWords,
      status: "open",
    },
    {
      project_id: projectId,
      description: "What happened in Bucharest? Nadia's entire network was burned in 72 hours — she was told it was an intelligence failure.",
      introduced_chapter_id: chapter1Id,
      last_seen_chapter_id: sortedChapters[1]?.id ?? chapter1Id,
      last_seen_word_position: countWords(CHAPTER_1) + countWords(CHAPTER_2),
      total_project_words: totalWords,
      status: "resolved",
    },
    {
      project_id: projectId,
      description: "What is the Glass Meridian file, and who currently holds the copy that was supposed to be destroyed?",
      introduced_chapter_id: sortedChapters[1]?.id ?? chapter1Id,
      last_seen_chapter_id: sortedChapters[2]?.id ?? chapter1Id,
      last_seen_word_position: totalWords,
      total_project_words: totalWords,
      status: "open",
    },
  ]);

  // ── 5. Create story bible ─────────────────────────────────────────────────
  await supabase.from("story_bibles").insert({
    project_id: projectId,
    synopsis:
      "Ex-intelligence analyst Nadia Voss is pulled back into the field when a dead encryption key brings a message about her former organisation — The Meridian Group. Her handler Marcus Hale is murdered before he can tell her what he knows. She travels to Vienna to find an underground archivist with access to the buried file at the centre of everything: The Glass Meridian. What she discovers changes the shape of the six-year-old betrayal she thought she understood.",
    style_notes:
      "Third person limited, close to Nadia. Short declarative sentences. Dialogue that does work — no small talk. Present tense atmosphere (immediate) with past tense narration. Thriller pacing: information released carefully, reader always one step behind Nadia.",
    project_intent:
      "A spy thriller about the cost of institutional betrayal and what it means to seek accountability in systems designed to resist it.",
  });

  // ── 6. Create co-author + seed initial observation ────────────────────────
  const { data: coauthor } = await supabase
    .from("coauthors")
    .insert({
      project_id: projectId,
      name: "Alex",
      personality: null,
    })
    .select("id")
    .single();

  if (coauthor) {
    await supabase.from("coauthor_messages").insert({
      project_id: projectId,
      role: "assistant",
      content:
        "Chapter 1 is in strong shape. The 2:14 AM opener works — Nadia's relationship with the device she 'told herself she'd throw away' tells us everything about her without stating it. One thing I'm tracking: the encrypted message sender is never identified. Thread 1 is open. Intentional dead branch, or something you want to resolve later? Also — Marcus's dialogue is very clean. When you're ready to write more, or want to talk through where this goes, I'm here.",
      message_type: "observation",
    });
  }

  // ── 7. Send welcome email ─────────────────────────────────────────────────
  // Fires once — seed-sample is idempotent so this only runs on first setup.
  sendWelcomeEmail(user.email!).catch((e) =>
    console.error("[seed-sample] Welcome email failed:", e)
  );

  // ── 9. Embed chapters for Story Bible ────────────────────────────────────
  // Fire-and-forget style: failures don't block the user from getting in.
  embedChaptersInBackground(
    supabase,
    projectId,
    sortedChapters.map((c, i) => ({ id: c.id, text: chapters[i].content }))
  ).catch((e) => console.error("[seed-sample] Embedding failed:", e));

  // ── 10. Advance onboarding ────────────────────────────────────────────────
  await supabase
    .from("profiles")
    .update({ onboarding_step: 1 })
    .eq("id", user.id);

  return Response.json({ projectId, chapterId: chapter1Id });
}

// Run embeddings without blocking the response
async function embedChaptersInBackground(
  supabase: ReturnType<typeof createServiceClient>,
  projectId: string,
  chapters: { id: string; text: string }[]
) {
  for (const chapter of chapters) {
    const chunks = chunkText(chapter.text);
    for (const chunk of chunks) {
      try {
        const embedding = await geminiEmbed(chunk.content);
        await supabase.from("story_chunks").insert({
          project_id: projectId,
          chapter_id: chapter.id,
          content: chunk.content,
          embedding: `[${embedding.join(",")}]`,
          chunk_index: chunk.wordStart,
          word_start: chunk.wordStart,
        });
      } catch (e) {
        console.error("[seed-sample] Chunk embed failed:", e);
      }
    }
    // Mark chapter as embedded
    await supabase
      .from("chapters")
      .update({ last_embedded_word: chunkText(chapter.text).at(-1)?.wordStart ?? 0 })
      .eq("id", chapter.id);
  }
}
