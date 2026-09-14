"use client";

import { useEffect, useState } from "react";
import { Loader2, Send, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePostHog } from "posthog-js/react";

type Panel = "hidden" | "nudge" | "help" | "expectation" | "thanks";

export default function StudioRetentionPrompts({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const ph = usePostHog();
  const [panel, setPanel] = useState<Panel>("hidden");
  const [message, setMessage] = useState("");
  const [expectation, setExpectation] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sessionKey = `xv_help_prompted_${projectId}`;
    if (sessionStorage.getItem(sessionKey)) return;
    const visitKey = `xv_studio_visits_${projectId}`;
    const expectationKey = `xv_expectation_asked_${projectId}`;
    let visits = 1;
    try {
      const previous = JSON.parse(localStorage.getItem(visitKey) ?? "null") as { count?: number; seenAt?: number } | null;
      const isNewVisit = !previous?.seenAt || Date.now() - previous.seenAt > 4 * 60 * 60 * 1000;
      visits = isNewVisit ? (previous?.count ?? 0) + 1 : (previous?.count ?? 1);
      localStorage.setItem(visitKey, JSON.stringify({ count: visits, seenAt: Date.now() }));
    } catch { /* storage is optional */ }
    const askExpectation = visits >= 2 && !localStorage.getItem(expectationKey);
    const idleDelay = askExpectation ? 120_000 : 90_000;
    let timer: number | undefined;
    let shown = false;

    const showPrompt = () => {
      if (shown || document.visibilityState !== "visible") return;
      shown = true;
      sessionStorage.setItem(sessionKey, "1");
      if (askExpectation) {
        localStorage.setItem(expectationKey, "1");
        setPanel("expectation");
        ph?.capture("expectation_prompt_shown", { project_id: projectId, visit: visits });
      } else {
        setPanel("nudge");
        ph?.capture("founder_help_prompt_shown", { project_id: projectId });
      }
    };

    const schedule = () => {
      if (shown) return;
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(showPrompt, idleDelay);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") schedule();
      else if (timer !== undefined) window.clearTimeout(timer);
    };

    const activityEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart", "scroll"];
    activityEvents.forEach(event => window.addEventListener(event, schedule, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibility);
    schedule();

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      activityEvents.forEach(event => window.removeEventListener(event, schedule));
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [ph, projectId]);

  async function submit(kind: "founder_help" | "expectation") {
    if (!message.trim()) return;
    setSending(true); setError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: kind === "expectation" ? "meh" : "bad",
          kind, message: message.trim(), expectation: expectation || undefined, page: pathname,
        }),
      });
      if (!response.ok) throw new Error("Your message could not be sent. Please try again.");
      ph?.capture("contextual_feedback_submitted", { kind, expectation: expectation || undefined });
      setPanel("thanks"); setMessage("");
      window.setTimeout(() => setPanel("hidden"), 2500);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send message."); }
    finally { setSending(false); }
  }

  if (panel === "hidden") return null;

  return <div className="fixed bottom-4 right-4 z-[180] flex flex-col items-end gap-2">
    <div className="xv-retention-card w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-black/10 bg-white p-4 text-[#1A1A1A] shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="xv-retention-title text-sm font-semibold">{panel === "nudge" ? "Stuck or confused?" : panel === "expectation" ? "What were you hoping Xvault would do?" : panel === "thanks" ? "Message received" : "Ask the founder"}</p>
          <p className="xv-retention-body mt-1 text-xs leading-5 text-black/50">{panel === "nudge" ? "Send me what is blocking you. I read these personally." : panel === "thanks" ? "I will read it personally and reply through your account email." : "This goes directly to the founder, not a support bot."}</p>
        </div>
        <button onClick={() => { setPanel("hidden"); ph?.capture("contextual_prompt_dismissed"); }} className="xv-retention-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-black/35" aria-label="Dismiss"><X size={14}/></button>
      </div>
      {panel === "nudge" && <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => { setPanel("help"); ph?.capture("founder_help_opened"); }} className="rounded-xl bg-[#1A1A1A] px-3 py-2 text-xs font-medium text-white">Ask for help</button><button onClick={() => setPanel("expectation")} className="rounded-xl border border-black/10 px-3 py-2 text-xs">Not what I expected</button></div>}
      {(panel === "help" || panel === "expectation") && <>
        {panel === "expectation" && <div className="mt-3 flex flex-wrap gap-2">{["Better prose", "Story organization", "Continuity help", "Simpler workflow", "Something else"].map(value => <button key={value} onClick={() => setExpectation(value)} className={`rounded-full border px-2.5 py-1 text-[11px] ${expectation === value ? "border-violet-500 bg-violet-50 text-violet-700" : "border-black/10"}`}>{value}</button>)}</div>}
        <textarea autoFocus value={message} onChange={e => setMessage(e.target.value)} placeholder={panel === "help" ? "Tell me what you are trying to do and where you got stuck…" : "What did you expect to happen? What felt missing or disappointing?"} rows={4} className="xv-retention-input mt-3 w-full resize-none rounded-xl border border-black/10 bg-black/[0.025] p-3 text-sm outline-none focus:border-violet-400" />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <button onClick={() => submit(panel === "help" ? "founder_help" : "expectation")} disabled={sending || !message.trim()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] py-2.5 text-xs font-medium text-white disabled:opacity-40">{sending ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>} Send directly</button>
      </>}
    </div>
  </div>;
}
