/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "growth", "launch-video");
const CAPTURES = path.join(OUT, "captures");
const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 24;
const DURATION = 59;
const FRAME_COUNT = FPS * DURATION;
const SILENT_VIDEO = path.join(OUT, "xvault-launch-x-silent.mp4");
const SOUNDTRACK = path.join(OUT, "xvault-launch-soundtrack.wav");
const FINAL_VIDEO = path.join(OUT, "xvault-launch-x.mp4");
const POSTER = path.join(OUT, "xvault-launch-poster.png");

fs.mkdirSync(OUT, { recursive: true });

const esc = (text) => String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char]));
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const ease = (value) => { const t = clamp(value); return 1 - Math.pow(1 - t, 3); };
const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };

function localTime(time, start, end) { return clamp((time - start) / (end - start)); }
function transitionOpacity(time, start, end) {
  const fade = 0.42;
  return Math.min(smooth((time - start) / fade), smooth((end - time) / fade));
}

function svgText({ x, y, lines, size = 48, family = "DejaVu Serif", weight = 700, fill = "#17141F", anchor = "start", lineHeight = 1.18, opacity = 1, letterSpacing = 0 }) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" opacity="${opacity}" letter-spacing="${letterSpacing}">${lines.map((line, index) => `<tspan x="${x}" dy="${index ? size * lineHeight : 0}">${esc(line)}</tspan>`).join("")}</text>`;
}

function pill(x, y, width, label, opacity = 1) {
  return `<g opacity="${opacity}"><rect x="${x}" y="${y}" width="${width}" height="34" rx="17" fill="#F0EAFF" stroke="#DDD1FF"/><circle cx="${x + 18}" cy="${y + 17}" r="4" fill="#7C3AED"/>${svgText({ x: x + 31, y: y + 22, lines: [label], size: 12, family: "Lato", weight: 700, fill: "#5B21B6" })}</g>`;
}

function baseSvg(time, body = "") {
  const orbit = (time * 16) % 1280;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FCFBFF"/><stop offset="0.58" stop-color="#F8F6FF"/><stop offset="1" stop-color="#F0EAFF"/></linearGradient>
      <radialGradient id="glow"><stop stop-color="#8B5CF6" stop-opacity=".17"/><stop offset="1" stop-color="#8B5CF6" stop-opacity="0"/></radialGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#352A55" flood-opacity=".18"/></filter>
    </defs>
    <rect width="1280" height="720" fill="url(#bg)"/>
    <circle cx="${orbit}" cy="70" r="230" fill="url(#glow)"/>
    <circle cx="${1280 - orbit * 0.55}" cy="680" r="270" fill="url(#glow)" opacity=".55"/>
    ${body}
  </svg>`);
}

async function prepareCapture(file, crop) {
  let pipeline = sharp(path.join(CAPTURES, file));
  if (crop) pipeline = pipeline.extract(crop);
  return pipeline.resize({ width: 1110, height: 560, fit: "cover", position: "top" }).png().toBuffer();
}

function cardFrame(x, y, width, height, opacity = 1) {
  return `<g opacity="${opacity}" filter="url(#shadow)"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="18" fill="#FFFFFF"/><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="18" fill="none" stroke="#DCD7E8"/></g>`;
}

function sceneFor(time) {
  if (time < 5) return { id: "hook1", start: 0, end: 5 };
  if (time < 9) return { id: "hook2", start: 5, end: 9 };
  if (time < 17) return { id: "editor", start: 9, end: 17 };
  if (time < 27) return { id: "worldboard", start: 17, end: 27 };
  if (time < 39) return { id: "pulse", start: 27, end: 39 };
  if (time < 47) return { id: "bible", start: 39, end: 47 };
  if (time < 54) return { id: "write", start: 47, end: 54 };
  return { id: "cta", start: 54, end: 59 };
}

async function renderFrame(time, captures, logo) {
  const scene = sceneFor(time);
  const p = localTime(time, scene.start, scene.end);
  const opacity = transitionOpacity(time, scene.start, scene.end);
  const comps = [];
  let body = "";
  let foreground = "";

  if (scene.id === "hook1" || scene.id === "hook2") {
    const isFirst = scene.id === "hook1";
    const lift = 18 * (1 - ease(p));
    body += `<g opacity="${opacity}">${pill(535, 182, 210, "FOR PEOPLE WRITING BOOKS", smooth(p * 2.6))}`;
    body += svgText({ x: 640, y: 320 + lift, lines: isFirst ? ["Your AI remembers", "the last paragraph."] : ["But does it understand", "the story?"], size: 60, anchor: "middle", opacity, lineHeight: 1.12 });
    body += `<path d="M535 468 H${535 + 210 * ease(p)}" stroke="#7C3AED" stroke-width="4" stroke-linecap="round" opacity="${opacity}"/></g>`;
  }

  const uiScenes = {
    editor: { capture: captures.editor, kicker: "WRITE", title: "Write inside the manuscript. At the cursor.", sub: "Your chapters and voice stay beside every suggestion." },
    worldboard: { capture: captures.worldboard, kicker: "WORLD BOARD", title: "Your world builds itself.", sub: "Characters, places and relationships update as you write." },
    pulse: { capture: captures.pulse, kicker: "STORY PULSE", title: "Track the emotional logic, chapter by chapter.", sub: "See what changes, what caused it, and where the feeling may jump." },
    bible: { capture: captures.bible, kicker: "STORY BIBLE", title: "Keep intent, canon and voice in one living workspace.", sub: "The deeper reason for the story stays close to the draft." },
    write: { capture: captures.write, kicker: "PROSE TOOLS", title: "Continue. Rewrite. Explore what if.", sub: "Without leaving the page or re-explaining the book." },
  };

  if (uiScenes[scene.id]) {
    const config = uiScenes[scene.id];
    const slide = 22 * (1 - ease(p * 2));
    const cardX = 85 + (scene.id === "worldboard" ? -10 : 0);
    const cardY = 150 + slide;
    body += `<g opacity="${opacity}">${pill(85, 32, 142 + config.kicker.length * 2.5, config.kicker, 1)}`;
    body += svgText({ x: 85, y: 91, lines: [config.title], size: scene.id === "pulse" ? 32 : 36, opacity, family: "DejaVu Serif" });
    body += svgText({ x: 85, y: 121, lines: [config.sub], size: 13, opacity: opacity * .63, family: "Lato", weight: 500, fill: "#40384F" });
    body += cardFrame(cardX - 10, cardY - 10, 1130, 570, opacity);
    if (scene.id === "worldboard") {
      foreground += `<g opacity="${opacity * smooth((p - .42) * 4)}"><circle cx="440" cy="342" r="70" fill="none" stroke="#7C3AED" stroke-width="3" stroke-dasharray="8 8"/><path d="M510 315 C570 265 620 245 700 248" fill="none" stroke="#7C3AED" stroke-width="2"/><rect x="682" y="220" width="240" height="52" rx="12" fill="#1D1727"/>${svgText({ x: 702, y: 252, lines: ["Relationships stay readable"], size: 14, family: "Lato", weight: 700, fill: "#FFFFFF" })}</g>`;
    }
    if (scene.id === "pulse") {
      foreground += `<g opacity="${opacity * smooth((p - .45) * 4)}"><rect x="825" y="394" width="320" height="58" rx="14" fill="#1D1727"/>${svgText({ x: 845, y: 419, lines: ["Evidence from the actual prose", "keeps every insight grounded"], size: 13, family: "Lato", weight: 700, fill: "#FFFFFF", lineHeight: 1.35 })}</g>`;
    }
    body += `</g>`;
    comps.push({ input: config.capture, left: Math.round(cardX), top: Math.round(cardY), blend: "over" });
    if (foreground) comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">${foreground}</svg>`), left: 0, top: 0, blend: "over" });
  }

  if (scene.id === "cta") {
    const rise = 16 * (1 - ease(p * 1.7));
    body += `<g opacity="${opacity}"><rect x="580" y="88" width="120" height="120" rx="32" fill="#FFFFFF" filter="url(#shadow)"/>`;
    body += svgText({ x: 640, y: 305 + rise, lines: ["Keep the story coherent."], size: 50, anchor: "middle", opacity });
    body += svgText({ x: 640, y: 365 + rise, lines: ["Keep the voice yours."], size: 50, anchor: "middle", opacity, fill: "#6D28D9" });
    body += `<rect x="485" y="425" width="310" height="58" rx="29" fill="#1A1720"/><text x="640" y="462" text-anchor="middle" font-family="Lato" font-size="18" font-weight="700" fill="#FFFFFF">Try Xvault Studio free</text>`;
    body += svgText({ x: 640, y: 535, lines: ["xvault.dev"], size: 22, family: "Lato", weight: 700, anchor: "middle", fill: "#5B21B6" });
    body += svgText({ x: 640, y: 575, lines: ["No card required"], size: 13, family: "Lato", weight: 500, anchor: "middle", fill: "#6F687A", letterSpacing: 1.5 });
    body += `</g>`;
    comps.push({ input: logo, left: 604, top: 110, blend: "over" });
  }

  const frame = sharp(baseSvg(time, body)).composite(comps);
  return frame.ensureAlpha().raw().toBuffer();
}

function writeWav() {
  const sampleRate = 48000;
  const channels = 2;
  const totalSamples = Math.floor(DURATION * sampleRate);
  const pcm = Buffer.alloc(totalSamples * channels * 2);
  const chords = [[146.83, 174.61, 220], [130.81, 164.81, 196], [110, 146.83, 174.61], [123.47, 155.56, 196]];
  let noise = 0x12345678;
  for (let index = 0; index < totalSamples; index += 1) {
    const t = index / sampleRate;
    const chord = chords[Math.floor(t / 8) % chords.length];
    const fadeIn = Math.min(1, t / 2.2);
    const fadeOut = Math.min(1, (DURATION - t) / 2.4);
    const envelope = fadeIn * fadeOut;
    let pad = 0;
    chord.forEach((frequency, note) => {
      pad += Math.sin(2 * Math.PI * frequency * t + note * 0.7) * (0.22 / chord.length);
      pad += Math.sin(2 * Math.PI * frequency * 0.5 * t) * (0.07 / chord.length);
    });
    const beatPhase = t % 2;
    const beat = beatPhase < .18 ? Math.sin(2 * Math.PI * (62 - beatPhase * 90) * beatPhase) * Math.exp(-beatPhase * 22) * .16 : 0;
    noise = (1664525 * noise + 1013904223) >>> 0;
    const air = ((noise / 0xffffffff) * 2 - 1) * .004;
    const sample = Math.max(-1, Math.min(1, (pad + beat + air) * envelope));
    const left = Math.round(sample * 32767);
    const right = Math.round((sample * .96 + Math.sin(2 * Math.PI * 0.08 * t) * .008) * 32767);
    pcm.writeInt16LE(left, index * 4);
    pcm.writeInt16LE(right, index * 4 + 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0); header.writeUInt32LE(36 + pcm.length, 4); header.write("WAVE", 8);
  header.write("fmt ", 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * channels * 2, 28); header.writeUInt16LE(channels * 2, 32); header.writeUInt16LE(16, 34);
  header.write("data", 36); header.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(SOUNDTRACK, Buffer.concat([header, pcm]));
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: options.stdin ? ["pipe", "inherit", "inherit"] : "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve(child) : reject(new Error(`${command} exited with ${code}`)));
    if (options.stdin) options.stdin(child.stdin).catch(reject);
  });
}

async function main() {
  const captures = {
    editor: await prepareCapture("editor.png", { left: 160, top: 0, width: 1760, height: 937 }),
    worldboard: await prepareCapture("worldboard.png", { left: 160, top: 0, width: 1760, height: 937 }),
    pulse: await prepareCapture("story-pulse.png", { left: 210, top: 0, width: 1710, height: 937 }),
    bible: await prepareCapture("story-bible.png", { left: 210, top: 0, width: 1710, height: 937 }),
    write: await prepareCapture("write-panel.png", { left: 380, top: 30, width: 1450, height: 900 }),
  };
  const logo = await sharp(path.join(ROOT, "public", "XVault.svg")).resize(72, 72).png().toBuffer();

  if (process.env.PREVIEW_ONLY === "1") {
    const times = [2.5, 6.5, 12, 21, 30.5, 42, 50, 57];
    const thumbs = [];
    for (const time of times) {
      const raw = await renderFrame(time, captures, logo);
      thumbs.push(await sharp(raw, { raw: { width: WIDTH, height: HEIGHT, channels: 4 } }).resize(480, 270).png().toBuffer());
    }
    await sharp({ create: { width: 1920, height: 540, channels: 4, background: "#F6F2FF" } })
      .composite(thumbs.map((input, index) => ({ input, left: (index % 4) * 480, top: Math.floor(index / 4) * 270 })))
      .png().toFile(path.join(OUT, "xvault-launch-preview-sheet.png"));
    console.log("Preview sheet rendered.");
    return;
  }

  console.log(`Rendering ${FRAME_COUNT} frames...`);
  await run("gst-launch-1.0", ["-q", "fdsrc", "!", "rawvideoparse", "format=rgba", `width=${WIDTH}`, `height=${HEIGHT}`, `framerate=${FPS}/1`, "!", "videoconvert", "!", "video/x-raw,format=I420", "!", "x264enc", "bitrate=5200", "speed-preset=medium", "key-int-max=48", "!", "h264parse", "!", "mp4mux", "faststart=true", "!", "filesink", `location=${SILENT_VIDEO}`], {
    stdin: async (stream) => {
      for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
        const raw = await renderFrame(frame / FPS, captures, logo);
        if (!stream.write(raw)) await new Promise((resolve) => stream.once("drain", resolve));
        if (frame % 240 === 0) console.log(`  ${Math.round(frame / FRAME_COUNT * 100)}%`);
      }
      stream.end();
    },
  });

  writeWav();
  await run("gst-launch-1.0", ["-q", "filesrc", `location=${SILENT_VIDEO}`, "!", "qtdemux", "name=video", "video.video_0", "!", "queue", "!", "h264parse", "!", "mux.", "filesrc", `location=${SOUNDTRACK}`, "!", "wavparse", "!", "audioconvert", "!", "audioresample", "!", "voaacenc", "bitrate=128000", "!", "aacparse", "!", "queue", "!", "mux.", "mp4mux", "name=mux", "faststart=true", "!", "filesink", `location=${FINAL_VIDEO}`]);

  const posterRaw = await renderFrame(30.5, captures, logo);
  await sharp(posterRaw, { raw: { width: WIDTH, height: HEIGHT, channels: 4 } }).png().toFile(POSTER);
  console.log(`Finished: ${FINAL_VIDEO}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
