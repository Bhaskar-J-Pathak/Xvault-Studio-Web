/* eslint-disable no-console */
const { createClient } = require("@supabase/supabase-js");
const fs = require("node:fs");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.XVAULT_DEMO_EMAIL || "alsiel1609@gmail.com";

if (!url || !serviceKey || !anonKey) throw new Error("Supabase environment variables are required.");

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function lexical(text) {
  return {
    root: {
      children: text.split(/\n\s*\n/).map((paragraph) => ({
        children: [{ detail: 0, format: 0, mode: "normal", style: "", text: paragraph, type: "text", version: 1 }],
        direction: "ltr", format: "", indent: 0, type: "paragraph", version: 1,
      })),
      direction: "ltr", format: "", indent: 0, type: "root", version: 1,
    },
  };
}

const chapterText = [
  ["Chapter 1: The Drowned Bell", `Mara Vale found the bell beneath the drowned chapel, green with age and warm beneath her palm. Above her, rain worried the broken roof. Below, something answered with three patient knocks.\n\nShe had promised Rowan she would leave the dead city alone. Promises were simple things on dry land. Here, with the tide climbing the altar steps and their mother's handwriting cut into the bronze, the promise felt like another door waiting to be opened.\n\n\"We take it and go,\" Rowan said. He stood in the archway with one hand on his knife, watching the black water.\n\nMara wrapped the bell in her coat. \"You can still go.\"\n\nHis expression hardened. \"That is not the same as leaving you.\"\n\nThe fourth knock came from inside the bell.`],
  ["Chapter 2: A Crown of Ash", `By morning, the city had learned Mara's name. It travelled ahead of them in market whispers and chalk marks on locked doors. The Ash Court wanted the bell. The river priests wanted it buried. Rowan wanted a plan she could not give him.\n\nAt the northern gate, Queen Serin waited without guards. Ash dusted the shoulders of her white coat. She looked too young to have ordered so many disappearances.\n\n\"Your mother rang that bell once,\" Serin said. \"It cost us a district.\"\n\nMara felt Rowan go still beside her. He had known. The knowledge sat between them, sharp and newly visible.\n\n\"Tell her,\" Mara said.\n\nRowan stared at the road. \"Not here.\"\n\nFor the first time in her life, Mara stepped away when he reached for her.`],
  ["Chapter 3: The Quiet Door", `The Star Key opened no lock they could see. It only hummed when Mara held it near the bell, a thin note that made every candle lean east. Rowan had followed her into the observatory, but the space between them felt wider than the city.\n\n\"Mother did not drown,\" he said. \"She crossed. Serin helped her.\"\n\nMara wanted anger. Anger was clean. What came instead was grief with nowhere to land.\n\nThe wall behind the telescope softened into a doorway filled with night. On the other side, a woman turned at the sound of the bell.\n\nRowan whispered Mara's name.\n\nShe lifted the bell, though her hand shook. Trust had broken. Love had not. She hated that both could be true.`],
];

async function main() {
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  const user = listed.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`Debug user ${email} was not found.`);

  const marker = "launch_demo_2026";
  const { data: existing } = await supabase.from("projects").select("id").eq("user_id", user.id).contains("settings", { marker }).maybeSingle();
  let projectId = existing?.id;

  if (!projectId) {
    const { data: project, error } = await supabase.from("projects").insert({
      user_id: user.id,
      title: "The Hollow Bell",
      genre: "Gothic fantasy mystery",
      synopsis: "A sister and brother return to a drowned city, where a forbidden bell reveals that their missing mother may still be alive beyond a sealed door.",
      settings: { marker, editor_theme: "light" },
      writing_status: "drafting",
    }).select("id").single();
    if (error) throw error;
    projectId = project.id;
  } else {
    await Promise.all([
      supabase.from("story_pulse_observations").delete().eq("project_id", projectId),
      supabase.from("relationships").delete().eq("project_id", projectId),
      supabase.from("entities").delete().eq("project_id", projectId),
      supabase.from("plot_threads").delete().eq("project_id", projectId),
      supabase.from("story_bibles").delete().eq("project_id", projectId),
      supabase.from("coauthors").delete().eq("project_id", projectId),
      supabase.from("chapters").delete().eq("project_id", projectId),
    ]);
  }

  const chapters = [];
  for (let position = 0; position < chapterText.length; position += 1) {
    const [title, body] = chapterText[position];
    const { data, error } = await supabase.from("chapters").insert({
      project_id: projectId,
      title,
      content: lexical(body),
      word_count: body.trim().split(/\s+/).length,
      position,
      summary: [
        "Mara and Rowan recover a forbidden bell from a drowned chapel. Its connection to their missing mother makes Mara break her promise to leave the city alone.",
        "Queen Serin reveals that Mara's mother rang the bell before. Mara realizes Rowan has hidden the truth and withdraws from him.",
        "Rowan confesses their mother crossed through a hidden door. Mara chooses to open it despite broken trust and unresolved grief.",
      ][position],
    }).select("id").single();
    if (error) throw error;
    chapters.push(data);
  }

  const entityRows = [
    ["Mara Vale", "character", "A stubborn bellmaker's daughter searching for the truth about her mother.", { role: "protagonist", trait: "protective, relentless" }, { x: 330, y: 245 }],
    ["Rowan Vale", "character", "Mara's older brother, carrying a secret about their mother's disappearance.", { role: "brother", trait: "loyal, secretive" }, { x: 650, y: 155 }],
    ["Queen Serin", "character", "The young ruler of the drowned city and former ally of Mara's mother.", { role: "antagonist or guide", trait: "composed, unreadable" }, { x: 790, y: 390 }],
    ["Veyra", "location", "A half-drowned city where streets become canals at high tide.", { atmosphere: "rain, bells, black water" }, { x: 310, y: 510 }],
    ["Ash Court", "faction", "The ruling court that hunts forbidden relics and those who use them.", { allegiance: "Queen Serin" }, { x: 655, y: 555 }],
    ["The Hollow Bell", "item", "A warm bronze bell that answers knocks and opens paths between worlds.", { origin: "drowned chapel" }, { x: 500, y: 370 }],
    ["The Crossing", "lore", "A forbidden passage said to carry the living beyond the edge of death.", { cost: "unknown" }, { x: 950, y: 225 }],
  ];
  const entities = {};
  for (const [name, type, description, attributes, position] of entityRows) {
    const { data, error } = await supabase.from("entities").insert({
      project_id: projectId, name, type, description, attributes, position,
      confidence: "explicit", first_seen_chapter_id: chapters[0].id, last_seen_word: 150,
    }).select("id,name").single();
    if (error) throw error;
    entities[data.name] = data.id;
  }

  const relationRows = [
    ["Mara Vale", "Rowan Vale", "younger sister of"],
    ["Rowan Vale", "Mara Vale", "protects"],
    ["Queen Serin", "Mara Vale", "hunts, then guides"],
    ["Queen Serin", "Ash Court", "rules"],
    ["The Hollow Bell", "The Crossing", "opens"],
    ["The Hollow Bell", "Mara Vale", "answers"],
    ["Veyra", "Ash Court", "governed by"],
  ];
  const { error: relationError } = await supabase.from("relationships").insert(relationRows.map(([source, target, label]) => ({
    project_id: projectId, source_id: entities[source], target_id: entities[target], label,
  })));
  if (relationError) throw relationError;

  const pulseRows = [
    [0, "guarded grief", "Learn why her mother vanished", "Losing Rowan to the same mystery", "Hope punctures the control she has built around her grief.", "Promises were simple things on dry land.", null, "none"],
    [1, "betrayed and watchful", "Force Rowan to tell the truth", "That their entire search rests on a lie", "Her trust in Rowan fractures when she realizes he knew more than he admitted.", "For the first time in her life, Mara stepped away when he reached for her.", "The withdrawal is earned by the new information, but the next chapter should preserve its emotional weight.", "notice"],
    [2, "grieving, but resolved", "Cross the threshold and face her mother", "That love will make her forgive too quickly", "She accepts that love and broken trust can coexist, choosing action without granting forgiveness.", "Trust had broken. Love had not.", null, "none"],
  ];
  const { error: pulseError } = await supabase.from("story_pulse_observations").insert(pulseRows.map(([index, emotional_state, desire, fear, change_summary, evidence_quote, continuity_note, severity]) => ({
    project_id: projectId, chapter_id: chapters[index].id, character_name: "Mara Vale", emotional_state,
    desire, fear, change_summary, evidence_quote, continuity_note, severity, confidence: "explicit",
  })));
  if (pulseError) throw pulseError;

  const { error: bibleError } = await supabase.from("story_bibles").insert({
    project_id: projectId,
    project_intent: "A story about siblings who love each other enough to tell difficult truths, set inside a city that refuses to let the past stay buried.",
    style_notes: "Close third person through Mara. Past tense. Lyrical but controlled. Concrete sensory details, restrained dialogue, no em dashes, and short paragraphs at moments of emotional pressure.",
    synopsis: "Mara Vale returns to the drowned city of Veyra with her brother Rowan and finds a forbidden bell linked to their missing mother. Queen Serin's warning exposes Rowan's deception. Following the bell to a hidden observatory, Mara discovers that her mother may be alive beyond the Crossing. She chooses to open the door while refusing to pretend that love has repaired the broken trust between her and Rowan.",
  });
  if (bibleError) throw bibleError;

  const { error: threadError } = await supabase.from("plot_threads").insert([
    { project_id: projectId, description: "Who is knocking from inside the Hollow Bell?", introduced_chapter_id: chapters[0].id, last_seen_chapter_id: chapters[2].id, status: "open", introduced_chapter_number: 1, last_seen_chapter_number: 3 },
    { project_id: projectId, description: "What did Rowan know about their mother's Crossing?", introduced_chapter_id: chapters[1].id, last_seen_chapter_id: chapters[2].id, status: "resolved", introduced_chapter_number: 2, last_seen_chapter_number: 3 },
  ]);
  if (threadError) throw threadError;

  const { error: coauthorError } = await supabase.from("coauthors").insert({
    project_id: projectId,
    name: "Alex",
    personality: "A perceptive story editor who protects the writer's voice, asks precise questions, and never takes control of the story.",
  });
  if (coauthorError) throw coauthorError;

  const { data: link, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink", email,
    options: { redirectTo: `http://localhost:3000/auth/callback?next=${encodeURIComponent(`/studio/${projectId}/${chapters[0].id}`)}` },
  });
  if (linkError) throw linkError;

  const browserAuth = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: verified, error: verifyError } = await browserAuth.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "magiclink",
  });
  if (verifyError || !verified.session) throw verifyError ?? new Error("Could not create demo browser session.");

  fs.writeFileSync("/tmp/xvault-launch-demo.json", JSON.stringify({
    projectId,
    chapterId: chapters[0].id,
    session: verified.session,
    projectRef: new URL(url).hostname.split(".")[0],
  }), { mode: 0o600 });
  console.log(`Launch demo prepared: ${projectId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
