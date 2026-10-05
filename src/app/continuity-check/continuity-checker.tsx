"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { ArrowRight, BookOpenCheck, Check, ChevronRight, CircleAlert, Clock3, LockKeyhole, ScanSearch, Sparkles, Users } from "lucide-react";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";

type ReviewFlag = { title: string; earlier: string; later: string };
type Analysis = {
  words: number;
  sharedNames: string[];
  flags: ReviewFlag[];
  passages: Array<{ name: string; earlier: string; later: string }>;
};

const SAMPLE_EARLIER = `Mara kept her left hand hidden beneath the table. The silver ring on her index finger would identify her immediately.

Captain Ilyan entered without knocking. Mara had never met Ilyan before, though his uniform marked him as one of the Queen's officers. She decided she could not trust him.`;

const SAMPLE_LATER = `Mara raised her right hand and the silver ring caught the firelight.

Ilyan smiled. “You still make that face when you're lying.”

“I've trusted you since childhood,” Mara said, stepping closer. “You know that.”`;

const NAME_STOP_WORDS = new Set([
  "And", "Before", "But", "Captain", "Chapter", "For", "From", "Her", "His", "Later",
  "She", "That", "The", "Their", "Then", "They", "This", "What", "When", "Where", "With", "You",
]);

const SIGNALS = [
  { title: "Knowledge may have changed", a: /\b(?:never met|had not met|didn't know|did not know|stranger)\b/i, b: /\b(?:since childhood|for years|old friend|grew up|always known)\b/i },
  { title: "Trust may have changed", a: /\b(?:could not trust|couldn't trust|distrusted|did not trust|didn't trust)\b/i, b: /\b(?:trusted|could trust|always trust)\b/i },
  { title: "Physical detail may have changed", a: /\bleft (?:hand|arm|eye|leg|shoulder)\b/i, b: /\bright (?:hand|arm|eye|leg|shoulder)\b/i },
  { title: "Character status may have changed", a: /\b(?:dead|died|killed|buried)\b/i, b: /\b(?:alive|survived|living|breathing)\b/i },
  { title: "Location state may have changed", a: /\b(?:locked|sealed|closed|blocked)\b/i, b: /\b(?:unlocked|open|unsealed|clear)\b/i },
];

function splitSentences(text: string) {
  return text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).map((value) => value.trim()).filter(Boolean);
}

function extractNames(text: string) {
  const found = text.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g) ?? [];
  return [...new Set(found.filter((name) => !NAME_STOP_WORDS.has(name.split(" ")[0])))];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findSentence(text: string, pattern: RegExp) {
  return splitSentences(text).find((sentence) => pattern.test(sentence)) ?? "";
}

function analyzeText(earlier: string, later: string): Analysis {
  const laterNames = new Set(extractNames(later));
  const sharedNames = extractNames(earlier).filter((name) => laterNames.has(name)).slice(0, 8);
  const flags: ReviewFlag[] = [];

  for (const signal of SIGNALS) {
    const forward = signal.a.test(earlier) && signal.b.test(later);
    const reverse = signal.b.test(earlier) && signal.a.test(later);
    if (!forward && !reverse) continue;
    const earlierPattern = forward ? signal.a : signal.b;
    const laterPattern = forward ? signal.b : signal.a;
    flags.push({
      title: signal.title,
      earlier: findSentence(earlier, earlierPattern),
      later: findSentence(later, laterPattern),
    });
  }

  const passages = sharedNames.slice(0, 4).map((name) => {
    const pattern = new RegExp("\\b" + escapeRegExp(name) + "\\b");
    return { name, earlier: findSentence(earlier, pattern), later: findSentence(later, pattern) };
  });

  return {
    words: (earlier + " " + later).trim().split(/\s+/).filter(Boolean).length,
    sharedNames,
    flags,
    passages,
  };
}

function ResultPanel({ analysis }: { analysis: Analysis }) {
  return (
    <div className="space-y-5" aria-live="polite">
      <div className="grid grid-cols-3 gap-3">
        {[
          [analysis.flags.length, "review flags"],
          [analysis.sharedNames.length, "shared names"],
          [analysis.words, "words checked"],
        ].map(([value, label]) => (
          <div key={label} className="border border-[#191714]/15 bg-white/45 p-4 text-center">
            <p className="font-display text-3xl tracking-[-0.04em] text-[#191714]">{value}</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#191714]/58">{label}</p>
          </div>
        ))}
      </div>

      {analysis.flags.length ? (
        <div className="space-y-3">
          {analysis.flags.map((flag) => (
            <article key={flag.title} className="border border-[#A6402D]/25 bg-[#EFE7DC] p-5">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 size-5 shrink-0 text-[#A6402D]" />
                <div>
                  <h3 className="font-semibold text-[#191714]">{flag.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#191714]/65">These details deserve a continuity check. The change may be intentional; confirm that the manuscript earns it on the page.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <blockquote className="border border-[#191714]/10 bg-[#F4F0E8] p-3 text-sm leading-6 text-[#191714]/68"><span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-wider text-[#A6402D]">Earlier</span>“{flag.earlier}”</blockquote>
                <blockquote className="border border-[#191714]/10 bg-[#F4F0E8] p-3 text-sm leading-6 text-[#191714]/68"><span className="mb-1 block font-mono text-[9px] font-semibold uppercase tracking-wider text-[#A6402D]">Later</span>“{flag.later}”</blockquote>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="border border-[#191714]/15 bg-white/45 p-5">
          <div className="flex gap-3"><Check className="mt-0.5 size-5 shrink-0 text-emerald-600" /><div><h3 className="font-semibold text-emerald-950">No obvious signal pairs found</h3><p className="mt-1 text-sm leading-6 text-emerald-900/65">This quick check only catches explicit changes. A full manuscript scan can follow subtler facts and relationships.</p></div></div>
        </div>
      )}

      {analysis.passages.length > 0 && (
        <div className="border border-[#191714]/15 bg-white/45 p-5">
          <h3 className="font-semibold text-[#191714]">Characters present in both excerpts</h3>
          <div className="mt-4 divide-y divide-[#191714]/10">
            {analysis.passages.map((passage) => (
              <details key={passage.name} className="group py-3 first:pt-0 last:pb-0">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-[#191714]">{passage.name}<ChevronRight className="size-4 transition group-open:rotate-90" /></summary>
                <div className="mt-3 grid gap-3 text-sm leading-6 text-[#191714]/62 sm:grid-cols-2"><p>Earlier: “{passage.earlier}”</p><p>Later: “{passage.later}”</p></div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContinuityChecker({ clinicOpen }: { clinicOpen: boolean }) {
  const posthog = usePostHog();
  const [earlier, setEarlier] = useState("");
  const [later, setLater] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const analysis = useMemo(() => submitted ? analyzeText(earlier, later) : null, [earlier, later, submitted]);

  function loadSample() {
    setEarlier(SAMPLE_EARLIER);
    setLater(SAMPLE_LATER);
    setSubmitted(false);
    posthog?.capture("continuity_checker_sample_loaded");
  }

  function runCheck() {
    if (!earlier.trim() || !later.trim()) return;
    setSubmitted(true);
    posthog?.capture("continuity_checker_completed", {
      earlier_length_bucket: Math.ceil(earlier.length / 500) * 500,
      later_length_bucket: Math.ceil(later.length / 500) * 500,
    });
  }

  return (
    <div className="min-h-screen bg-[#F4F0E8] text-[#191714]">
      <Navbar />
      <main className="pt-[72px]">
      <section className="px-6 pb-20 pt-16 lg:px-10 lg:pb-28 lg:pt-24">
        <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10">
          <div className="grid gap-10 lg:grid-cols-[0.32fr_1fr] lg:gap-16">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">Free continuity check</p>
              <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-[#191714]/62">Two excerpts / No signup</p>
            </div>
            <div>
              <h1 className="max-w-[980px] font-display text-[clamp(4rem,8vw,8.4rem)] leading-[0.88] tracking-[-0.062em]">Compare two moments in your story.</h1>
              <p className="mt-9 max-w-[680px] border-t border-[#191714]/15 pt-7 text-base leading-8 text-[#191714]/70">Paste an earlier and later excerpt. Xvault puts repeated characters and details side by side so you can review what changed.</p>
            </div>
          </div>

          <div className="mt-14 grid gap-4 border-t border-[#191714]/15 pt-8 lg:mt-20 lg:grid-cols-2 lg:pt-10">
            <ExcerptInput label="Earlier chapter" value={earlier} placeholder="Paste the earlier passage here…" onChange={(value) => { setEarlier(value); setSubmitted(false); }} />
            <ExcerptInput label="Later chapter" value={later} placeholder="Paste the later passage here…" onChange={(value) => { setLater(value); setSubmitted(false); }} />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={runCheck} disabled={!earlier.trim() || !later.trim()} className="inline-flex min-h-12 items-center justify-center gap-3 bg-[#191714] px-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F4F0E8] transition-colors hover:bg-[#A6402D] disabled:cursor-not-allowed disabled:opacity-40">Check these excerpts <ArrowRight className="size-4" /></button>
            <button type="button" onClick={loadSample} className="min-h-12 border border-[#191714]/20 bg-transparent px-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#191714] transition-colors hover:border-[#A6402D] hover:text-[#A6402D]">Use an example</button>
            <p className="flex items-center gap-1.5 text-sm text-[#191714]/58 sm:ml-auto"><LockKeyhole className="size-4" /> Your text never leaves this page.</p>
          </div>
          {analysis && <div className="mt-8"><ResultPanel analysis={analysis} /></div>}
        </div>
      </section>

      <DiagnosticOffer clinicOpen={clinicOpen} onClick={() => posthog?.capture("diagnostic_founder_cta_clicked")} />
      <WorkflowComparison />
      <LiveClinic />
      </main>
      <Footer />
    </div>
  );
}

function ExcerptInput({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <label className="block border border-[#191714]/15 bg-white/40 p-4">
      <span className="mb-3 block font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#A6402D]">{label}</span>
      <textarea data-private value={value} onChange={(event) => onChange(event.target.value.slice(0, 12000))} placeholder={placeholder} className="min-h-56 w-full resize-y border border-[#191714]/12 bg-[#F8F5EE] p-4 text-base leading-7 text-[#191714] outline-none transition placeholder:text-[#191714]/32 focus:border-[#A6402D] focus:ring-2 focus:ring-[#A6402D]/10" />
      <span className="mt-2 block text-right font-mono text-[9px] uppercase tracking-[0.1em] text-[#191714]/48">{value.length.toLocaleString()} / 12,000 characters</span>
    </label>
  );
}

function DiagnosticOffer({ clinicOpen, onClick }: { clinicOpen: boolean; onClick: () => void }) {
  const items = [
    { icon: BookOpenCheck, title: "Full-manuscript setup", text: "Your complete draft imported, organized, and ready to explore." },
    { icon: ScanSearch, title: "Complete story diagnostic", text: "Continuity, characters, relationships, plot threads, and emotional movement." },
    { icon: Clock3, title: "Personal walkthrough", text: "A focused session with the founder to interpret the results." },
    { icon: Sparkles, title: "Lifetime studio access", text: "Founder’s Circle access plus 1,000 AI credits each month." },
  ];
  return (
    <section id="founder-diagnostic" className="scroll-mt-[72px] bg-[#F4F0E8] px-6 py-20 lg:px-10 lg:py-28">
      <div className="mx-auto grid max-w-[1280px] gap-12 border-t border-[#191714]/15 pt-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start lg:gap-20 lg:pt-10">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">{clinicOpen ? "Founder review slots / through October 6" : "Founder manuscript diagnostic"}</p>
          <h2 className="mt-7 max-w-[720px] font-display text-[clamp(3.5rem,6vw,6.4rem)] leading-[0.92] tracking-[-0.055em]">Bring the manuscript. Leave with the whole story mapped.</h2>
          <p className="mt-7 max-w-[690px] text-base leading-8 text-[#191714]/70">I’ll personally help you import your complete manuscript, build its Story Bible and World Board, run the continuity and Story Pulse views, and walk you through what Xvault finds. The $59 one-time Founder membership is included.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth?mode=signup&next=%2Fpricing%3Fcheckout%3Dfounder_circle" onClick={onClick} className="inline-flex min-h-12 items-center justify-center gap-3 bg-[#A6402D] px-6 text-[10px] font-semibold uppercase tracking-[0.13em] text-white transition-colors hover:bg-[#7F2F22]">Claim the $59 founder diagnostic <ArrowRight className="size-4" /></Link>
            <a href="mailto:support@xvault.dev?subject=Question%20about%20the%20Founder%20Manuscript%20Diagnostic" className="inline-flex min-h-12 items-center justify-center border border-[#191714]/20 px-5 text-[10px] font-semibold uppercase tracking-[0.13em] transition-colors hover:border-[#A6402D] hover:text-[#A6402D]">Ask a question</a>
          </div>
          <p className="mt-4 text-sm text-[#191714]/58">One payment. No subscription. Your manuscript remains yours.</p>
        </div>
        <div className="border-y border-[#191714]/15">
          <p className="py-5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A6402D]">What you receive</p>
          <div>{items.map(({ icon: Icon, title, text }, index) => <div key={title} className={`grid grid-cols-[44px_1fr] gap-4 border-t border-[#191714]/15 py-5 ${index === items.length - 1 ? "border-b" : ""}`}><div className="flex size-10 items-center justify-center border border-[#191714]/15"><Icon className="size-5 text-[#A6402D]" /></div><div><p className="font-semibold text-[#191714]">{title}</p><p className="mt-1 text-sm leading-6 text-[#191714]/62">{text}</p></div></div>)}</div>
        </div>
      </div>
    </section>
  );
}

function WorkflowComparison() {
  const rows = [
    ["Provide story context", "Paste the relevant chapters and explain what matters", "Saved chapters and story entities stay attached to the project"],
    ["Check a later scene", "Remember which earlier passage might conflict", "Review the later chapter against the story already mapped"],
    ["Continue tomorrow", "Rebuild or reattach context in a new conversation", "Open the same manuscript and continue from its saved context"],
  ];
  return (
    <section className="bg-[#F4F0E8] px-6 py-20 lg:px-10 lg:py-28"><div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-8 lg:pt-10"><div className="grid gap-10 lg:grid-cols-[0.42fr_1fr] lg:gap-20"><div><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A6402D]">The workflow difference</p><h2 className="mt-7 font-display text-[clamp(3rem,5vw,5.4rem)] leading-[0.94] tracking-[-0.05em]">A chat answers the passage you remembered to paste. Xvault follows the manuscript.</h2></div><div className="border border-[#191714]/15"><div className="grid grid-cols-2 bg-white/35 sm:grid-cols-[1.1fr_1fr_1fr]"><div className="hidden p-4 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#191714]/55 sm:block">Continuity task</div><div className="p-4 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#191714]/55">General chatbot</div><div className="border-l border-[#191714]/15 bg-[#EFE7DC] p-4 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#A6402D]">Xvault Studio</div></div>{rows.map(([task, chat, xvault], index) => <div key={task} className={(index ? "border-t border-[#191714]/15 " : "") + "grid grid-cols-2 sm:grid-cols-[1.1fr_1fr_1fr]"}><div className="col-span-2 border-b border-[#191714]/10 bg-white/20 p-4 text-sm font-semibold text-[#191714] sm:col-span-1 sm:border-b-0">{task}</div><div className="p-4 text-sm leading-6 text-[#191714]/62">{chat}</div><div className="border-l border-[#191714]/15 bg-[#EFE7DC]/65 p-4 text-sm leading-6 text-[#191714]/70">{xvault}</div></div>)}</div></div><p className="mt-5 max-w-[720px] text-sm leading-6 text-[#191714]/58 lg:ml-[calc(42%+5rem)]">This compares the workflow, not model intelligence. General chatbots remain better for broad research and tasks outside the manuscript.</p></div></section>
  );
}

function LiveClinic() {
  return (
    <section className="bg-[#F4F0E8] px-6 pb-24 pt-16 lg:px-10 lg:pb-32"><div className="mx-auto flex max-w-[1280px] flex-col gap-9 border-y border-[#191714]/15 py-10 lg:flex-row lg:items-end lg:justify-between lg:py-14"><div className="max-w-[760px]"><div className="flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A6402D]"><Users className="size-4" /> Writing groups and communities</div><h2 className="mt-6 font-display text-[clamp(2.8rem,5vw,5.2rem)] leading-[0.95] tracking-[-0.05em]">Host a live manuscript continuity clinic.</h2><p className="mt-5 max-w-[680px] text-base leading-8 text-[#191714]/68">Invite the founder to map three volunteered chapters live, explain every finding, and answer questions. No manuscript is retained for the session.</p></div><a href="mailto:support@xvault.dev?subject=Live%20manuscript%20continuity%20clinic" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 bg-[#191714] px-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F4F0E8] transition-colors hover:bg-[#A6402D]">Invite Xvault <ArrowRight className="size-4" /></a></div></section>
  );
}
