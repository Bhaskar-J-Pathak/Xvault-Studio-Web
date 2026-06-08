"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, ChevronRight, Settings, Loader2, Trash2, X } from "lucide-react";
import type { DbCoauthor, DbCoauthorMessage, CoauthorMessageType } from "@/types/database";
import GlobalChangePreview from "./global-change-preview";
import type { ChangePlan } from "@/app/api/ai/coauthor/global-change/route";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CoauthorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  message_type: CoauthorMessageType;
  created_at?: string;
  pending?: boolean;
}

interface Props {
  projectId: string;
  coauthor: DbCoauthor;
  recentText: string;           // last ~500 words from editor — updated by parent
  chapterId: string;
  onOpenSetup: () => void;
  slim: boolean;                // controlled by parent — true = collapsed
  onSlimChange: (slim: boolean) => void;
  // Called by parent's proactive observer
  pendingObservation: string | null;
  onObservationConsumed: () => void;
  // Called after a global change is applied, so the editor can reload content
  onGlobalChangeDone?: () => void;
  // Called after any credit-consuming AI call with the updated remaining count
  onCreditUpdate?: (remaining: number) => void;
  // Called when the first user message is sent
  onMessageSent?: () => void;
  // Called when Alex's response arrives (for tutorial step 3 advance)
  onResponseReceived?: () => void;
  // DOM id for tutorial targeting
  id?: string;
}

// ─── Quick reply chips shown after certain messages ───────────────────────────

const QUICK_REPLIES = [
  "Tell me more",
  "Want me to try?",
  "Give me 3 directions",
  "I'll keep it as is",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CoauthorPanel({
  projectId,
  coauthor,
  recentText,
  chapterId,
  onOpenSetup,
  slim,
  onSlimChange,
  pendingObservation,
  onObservationConsumed,
  onGlobalChangeDone,
  onCreditUpdate,
  onMessageSent,
  onResponseReceived,
  id,
}: Props) {
  const [messages, setMessages] = useState<CoauthorMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Global change state
  const [globalChangePlan, setGlobalChangePlan] = useState<ChangePlan | null>(null);
  const [globalChangeLoading, setGlobalChangeLoading] = useState(false);

  // Load recent message history on mount
  useEffect(() => {
    async function loadHistory() {
      const res = await fetch(
        `/api/coauthor/messages?projectId=${projectId}&limit=30`
      );
      if (!res.ok) return;
      const { messages: hist } = await res.json() as { messages: DbCoauthorMessage[] };
      if (!hist?.length) return;
      // API returns newest-first; sort ascending with tie-break (user before assistant)
      // so identical timestamps (legacy data) still display in the right order.
      const sorted = hist.slice().sort((a, b) => {
        const tA = new Date(a.created_at ?? 0).getTime();
        const tB = new Date(b.created_at ?? 0).getTime();
        if (tA !== tB) return tA - tB;
        // Tie-break: user message always before assistant reply
        if (a.role === "user" && b.role !== "user") return -1;
        if (b.role === "user" && a.role !== "user") return 1;
        return 0;
      });
      setMessages(
        sorted.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          message_type: m.message_type,
          created_at: m.created_at,
        }))
      );
    }
    loadHistory();
  }, [projectId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Consume pending proactive observations from parent
  useEffect(() => {
    if (!pendingObservation) return;
    const obs: CoauthorMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: pendingObservation,
      message_type: "observation",
    };
    setMessages((prev) => [...prev, obs]);
    onObservationConsumed();
    onSlimChange(false); // expand when co-author speaks up
  }, [pendingObservation, onObservationConsumed]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const userMsg: CoauthorMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        message_type: "chat",
      };
      const pendingMsg: CoauthorMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        message_type: "chat",
        pending: true,
      };
      setMessages((prev) => [...prev, userMsg, pendingMsg]);
      setInput("");
      setLoading(true);
      onMessageSent?.();

      try {
        const res = await fetch("/api/ai/coauthor/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            chapterId,
            message: text.trim(),
            recentText,
            // Pass last 20 messages as context (skip the pending placeholder)
            history: messages.slice(-20).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        const data = await res.json() as {
          reply?: string;
          error?: string;
          messageType?: string;
          instruction?: string;
          remaining?: number;
        };
        const reply = data.reply ?? "Sorry, something went wrong.";
        const msgType = (data.messageType ?? "chat") as CoauthorMessageType;

        if (data.remaining !== undefined) onCreditUpdate?.(data.remaining);

        setMessages((prev) =>
          prev.map((m) =>
            m.pending ? { ...m, content: reply, message_type: msgType, pending: false } : m
          )
        );
        onResponseReceived?.();

        // If Alex detected a global change request, trigger the analysis
        if (data.messageType === "global_change" && data.instruction) {
          setGlobalChangeLoading(true);
          try {
            const gcRes = await fetch("/api/ai/coauthor/global-change", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId, instruction: data.instruction }),
            });
            const gcData = await gcRes.json() as { plan?: ChangePlan; error?: string; remaining?: number };
            if (gcData.remaining !== undefined) onCreditUpdate?.(gcData.remaining);
            if (gcData.plan) {
              setGlobalChangePlan(gcData.plan);
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: gcData.error ?? "Couldn't analyze the manuscript. Try again.",
                  message_type: "chat",
                },
              ]);
            }
          } catch {
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "Something went wrong while scanning the manuscript.",
                message_type: "chat",
              },
            ]);
          } finally {
            setGlobalChangeLoading(false);
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.pending
              ? { ...m, content: "Something went wrong. Try again.", pending: false }
              : m
          )
        );
        onResponseReceived?.();
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, projectId, chapterId, recentText]
  );

  const clearAllMessages = useCallback(async () => {
    setMessages([]);
    setConfirmClear(false);
    await fetch(`/api/coauthor/messages?projectId=${projectId}`, { method: "DELETE" });
  }, [projectId]);

  const deleteMessage = useCallback(async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/coauthor/messages?projectId=${projectId}&id=${id}`, { method: "DELETE" });
  }, [projectId]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant" && !m.pending);

  // ─── Slim mode ──────────────────────────────────────────────────────────────
  if (slim) {
    return (
      <div id={id} className="flex flex-col h-full border-l border-neutral-200 bg-[#FAFAF8] w-[52px] items-center py-4 gap-3">
        <button
          onClick={() => onSlimChange(false)}
          className="text-neutral-400 hover:text-neutral-700 transition-colors"
          title={`Open ${coauthor.name}`}
        >
          <ChevronRight size={18} />
        </button>
        {lastAssistantMsg && (
          <div
            className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
            title="New message from your co-author"
          />
        )}
      </div>
    );
  }

  // ─── Full panel ─────────────────────────────────────────────────────────────
  return (
    <div id={id} className="flex flex-col h-full border-l border-neutral-200 bg-[#FAFAF8] w-[360px] flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">
              {coauthor.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900 leading-none">{coauthor.name}</p>
            <p className="text-[10px] text-neutral-400 leading-none mt-0.5">co-author</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Clear chat — two-step confirmation */}
          {confirmClear ? (
            <div className="flex items-center gap-1.5 mr-1">
              <span className="text-xs text-neutral-500">Clear all?</span>
              <button
                onClick={clearAllMessages}
                className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors font-medium"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors rounded"
              title="Clear conversation"
              disabled={messages.length === 0}
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={onOpenSetup}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 transition-colors rounded"
            title="Edit co-author"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={() => onSlimChange(true)}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 transition-colors rounded"
            title="Collapse"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-500">
              {coauthor.name} is reading along.
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Start writing, or say something.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1];
          // Show a "Earlier" divider before an assistant observation that has no
          // user message immediately before it — makes it clear it's a proactive
          // note, not a reply to something the user said.
          const showDivider =
            idx === 0 &&
            msg.role === "assistant" &&
            (msg.message_type === "observation" || msg.message_type === "nudge");
          return (
            <div key={msg.id}>
              {showDivider && (
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-neutral-100" />
                  <span className="text-[10px] text-neutral-400 shrink-0">Earlier</span>
                  <div className="flex-1 h-px bg-neutral-100" />
                </div>
              )}
              <MessageBubble
                msg={msg}
                coauthorName={coauthor.name}
                onDelete={deleteMessage}
              />
            </div>
          );
        })}

        {/* Scanning indicator while global change is being analyzed */}
        {globalChangeLoading && (
          <div className="flex gap-2 items-center px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
            <Loader2 size={13} className="animate-spin text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-700">Scanning manuscript…</p>
          </div>
        )}

        {/* Quick replies after last assistant message */}
        {lastAssistantMsg && !loading && !globalChangeLoading && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK_REPLIES.map((r) => (
              <button
                key={r}
                onClick={() => sendMessage(r)}
                className="text-xs px-2.5 py-1 rounded-full border border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 transition-colors bg-white"
              >
                {r}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-neutral-200">
        <div className="flex items-end gap-2 bg-white rounded-xl border border-neutral-200 px-3 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Talk to ${coauthor.name}…`}
            rows={1}
            className="flex-1 resize-none text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none bg-transparent max-h-24 leading-5"
            style={{ minHeight: "20px" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 96)}px`;
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 p-1 text-neutral-900 disabled:text-neutral-300 transition-colors"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
        <p className="text-[10px] text-neutral-400 mt-1.5 text-center">
          Enter to send · Shift+Enter for newline
        </p>
      </div>

      {/* Global change preview modal — rendered inside panel but covers full screen */}
      {globalChangePlan && (
        <GlobalChangePreview
          plan={globalChangePlan}
          projectId={projectId}
          coauthorName={coauthor.name}
          onDone={(summary) => {
            setGlobalChangePlan(null);
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: summary,
                message_type: "chat",
              },
            ]);
            onGlobalChangeDone?.();
          }}
          onCancel={() => setGlobalChangePlan(null)}
        />
      )}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  coauthorName,
  onDelete,
}: {
  msg: CoauthorMessage;
  coauthorName: string;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  if (msg.role === "user") {
    return (
      <div
        className="flex justify-end items-start gap-1 group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {hovered && !msg.pending && (
          <button
            onClick={() => onDelete(msg.id)}
            className="self-center p-0.5 text-neutral-300 hover:text-red-400 transition-colors flex-shrink-0"
            title="Delete message"
          >
            <X size={12} />
          </button>
        )}
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-neutral-900 text-white px-3 py-2 text-sm leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }

  const isObservation = msg.message_type === "observation" || msg.message_type === "nudge";
  const isCelebration = msg.message_type === "celebration";

  return (
    <div
      className="flex gap-2 items-start group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-5 h-5 rounded-full bg-neutral-200 flex-shrink-0 flex items-center justify-center mt-0.5">
        <span className="text-neutral-600 text-[9px] font-bold">
          {coauthorName.charAt(0).toUpperCase()}
        </span>
      </div>
      <div
        className={`max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 text-sm leading-relaxed ${
          msg.pending
            ? "bg-neutral-100 text-neutral-400 italic"
            : isCelebration
            ? "bg-amber-50 text-amber-900 border border-amber-200"
            : isObservation
            ? "bg-blue-50 text-blue-900 border border-blue-100"
            : "bg-white text-neutral-900 border border-neutral-100"
        }`}
      >
        {msg.pending ? (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
          </span>
        ) : (
          msg.content
        )}
      </div>
      {hovered && !msg.pending && (
        <button
          onClick={() => onDelete(msg.id)}
          className="self-start mt-1.5 p-0.5 text-neutral-300 hover:text-red-400 transition-colors flex-shrink-0"
          title="Delete message"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
