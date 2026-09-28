/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const WebSocket = require("ws");

const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "growth", "launch-video", "captures");
const auth = JSON.parse(fs.readFileSync("/tmp/xvault-launch-demo.json", "utf8"));
fs.mkdirSync(outputDir, { recursive: true });

const port = 9333;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function json(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
  }
  async ready() {
    await new Promise((resolve, reject) => {
      this.ws.once("open", resolve);
      this.ws.once("error", reject);
    });
    this.ws.on("message", (raw) => {
      const message = JSON.parse(raw.toString());
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  close() { this.ws.close(); }
}

async function waitForBrowser() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { return await json(`http://127.0.0.1:${port}/json`); } catch { await delay(250); }
  }
  throw new Error("Chromium did not expose its debugging endpoint.");
}

async function preparePage(cdp, url) {
  await cdp.send("Page.navigate", { url });
  await delay(4500);
  await cdp.send("Runtime.evaluate", { expression: `
    localStorage.setItem('xv_editor_prefs', JSON.stringify({theme:'light',font:'serif',lineSpacing:'relaxed',indentParagraphs:false}));
    document.documentElement.setAttribute('data-editor-theme','light');
    for (const node of document.querySelectorAll('[data-nextjs-toast], nextjs-portal')) node.remove();
  ` });
  await delay(1000);
}

async function screenshot(cdp, name) {
  await cdp.send("Runtime.evaluate", { expression: "window.scrollTo(0,0)" });
  const result = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
  fs.writeFileSync(path.join(outputDir, `${name}.png`), Buffer.from(result.data, "base64"));
  console.log(`Captured ${name}`);
}

async function main() {
  const chrome = spawn("/usr/bin/chromium-browser", [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
    "--disable-dev-shm-usage", `--remote-debugging-port=${port}`,
    "--window-size=1920,1080", "--force-device-scale-factor=1",
    "--user-data-dir=/tmp/xvault-video-profile-5", "http://localhost:3000",
  ], { stdio: "ignore" });

  try {
    const pages = await waitForBrowser();
    const page = pages.find((candidate) => candidate.type === "page");
    if (!page) throw new Error("No Chromium page was available.");
    const cdp = new Cdp(page.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");

    const cookieKey = `sb-${auth.projectRef}-auth-token`;
    const cookieValue = `base64-${Buffer.from(JSON.stringify(auth.session)).toString("base64url")}`;
    const cookieChunks = [];
    for (let offset = 0; offset < cookieValue.length; offset += 3000) cookieChunks.push(cookieValue.slice(offset, offset + 3000));
    for (let index = 0; index < cookieChunks.length; index += 1) {
      await cdp.send("Network.setCookie", {
        name: cookieChunks.length === 1 ? cookieKey : `${cookieKey}.${index}`,
        value: cookieChunks[index], url: "http://localhost:3000", path: "/", sameSite: "Lax",
      });
    }
    await delay(500);

    const base = `http://localhost:3000/studio/${auth.projectId}`;
    await preparePage(cdp, `${base}/${auth.chapterId}`);
    await screenshot(cdp, "editor");

    await cdp.send("Runtime.evaluate", { expression: `document.querySelector('[data-tour="write"]')?.click()` });
    await delay(700);
    await screenshot(cdp, "write-panel");

    await preparePage(cdp, `${base}/worldboard`);
    await screenshot(cdp, "worldboard");

    await preparePage(cdp, `${base}/pulse`);
    await screenshot(cdp, "story-pulse");

    await preparePage(cdp, `${base}/bible`);
    await screenshot(cdp, "story-bible");

    cdp.close();
  } finally {
    chrome.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
