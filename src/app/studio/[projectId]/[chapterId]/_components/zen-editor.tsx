"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $getRoot, $getSelection, $isRangeSelection } from "lexical";
import type { EditorState } from "lexical";

// ── Ghost writer types ────────────────────────────────────────────────────────
type GhostMode = "write" | "rewrite" | "continue";
interface CursorContext {
  beforeCursor: string;    // all text before cursor position
  afterCursor: string;     // all text after cursor position
  selectedText: string;    // selected text, empty if no selection
}
import { createClient } from "@/lib/supabase";
import { Loader2, Wand2 } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import CoauthorPanel from "@/app/studio/[projectId]/_components/coauthor-panel";
import CoauthorSetup from "@/app/studio/[projectId]/_components/coauthor-setup";
import TutorialOverlay from "@/app/studio/[projectId]/_components/tutorial-overlay";
import type { DbCoauthor } from "@/types/database";

// ── Theme ─────────────────────────────────────────────────────────────────────

const EDITOR_THEME = {
  root:      "zen-editor-root",
  paragraph: "zen-paragraph",
  heading:   { h1: "zen-h1", h2: "zen-h2", h3: "zen-h3" },
  quote:     "zen-blockquote",
  text: {
    bold:          "zen-bold",
    italic:        "zen-italic",
    underline:     "zen-underline",
    strikethrough: "zen-strikethrough",
    code:          "zen-code",
  },
  list: {
    ul:       "zen-ul",
    ol:       "zen-ol",
    listitem: "zen-listitem",
  },
};

// ── Word count helper ─────────────────────────────────────────────────────────

function countWords(editorState: EditorState): number {
  let count = 0;
  editorState.read(() => {
    const text = $getRoot().getTextContent().trim();
    count = text ? text.split(/\s+/).length : 0;
  });
  return count;
}

// ── AutoSave plugin ───────────────────────────────────────────────────────────

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AutoSavePluginProps {
  chapterId:          string;
  onWordCountChange:  (n: number) => void;
  onSaveStatusChange: (s: SaveStatus) => void;
}

function AutoSavePlugin({
  chapterId,
  onWordCountChange,
  onSaveStatusChange,
}: AutoSavePluginProps) {
  const [editor] = useLexicalComposerContext();

  const cbRef = useRef({ onWordCountChange, onSaveStatusChange });
  cbRef.current = { onWordCountChange, onSaveStatusChange };

  const saveTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialRef  = useRef(true);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      cbRef.current.onWordCountChange(countWords(editorState));

      if (isInitialRef.current) {
        isInitialRef.current = false;
        return;
      }

      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;

      cbRef.current.onSaveStatusChange("saving");
      if (saveTimerRef.current)  clearTimeout(saveTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

      saveTimerRef.current = setTimeout(async () => {
        try {
          const json = editorState.toJSON();
          const wc   = countWords(editorState);

          const supabase = createClient();
          const { error } = await supabase
            .from("chapters")
            .update({
              content:    json,
              word_count: wc,
              updated_at: new Date().toISOString(),
            })
            .eq("id", chapterId);

          cbRef.current.onSaveStatusChange(error ? "error" : "saved");
        } catch {
          cbRef.current.onSaveStatusChange("error");
        }

        resetTimerRef.current = setTimeout(
          () => cbRef.current.onSaveStatusChange("idle"),
          2000
        );
      }, 1000);
    });
  }, [editor, chapterId]);

  return null;
}

// ── Extraction plugin ─────────────────────────────────────────────────────────

const EXTRACTION_CHUNK_SIZE     = 5000;
const EXTRACTION_WORD_THRESHOLD = 1500;

interface ExtractionPluginProps {
  projectId:            string;
  chapterId:            string;
  chapterNumber:        number;
  initialLastExtracted: number;
  onStatusChange:       (s: "idle" | "extracting") => void;
  onCreditUpdate?:      (remaining: number) => void;
}

function ExtractionPlugin({
  projectId,
  chapterId,
  chapterNumber,
  initialLastExtracted,
  onStatusChange,
  onCreditUpdate,
}: ExtractionPluginProps) {
  const [editor] = useLexicalComposerContext();

  const lastExtractedRef = useRef(initialLastExtracted);
  const extractingRef    = useRef(false);
  const timerRef         = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onStatusRef = useRef(onStatusChange);
  onStatusRef.current = onStatusChange;

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      const wc    = countWords(editorState);
      const delta = wc - lastExtractedRef.current;

      if (delta < EXTRACTION_WORD_THRESHOLD || extractingRef.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        if (extractingRef.current) return;
        extractingRef.current = true;
        onStatusRef.current("extracting");

        let fullText = "";
        editorState.read(() => {
          fullText = $getRoot().getTextContent().trim();
        });

        const words      = fullText ? fullText.split(/\s+/) : [];
        const deltaWords = words.slice(lastExtractedRef.current);

        if (deltaWords.length < 50) {
          extractingRef.current = false;
          onStatusRef.current("idle");
          return;
        }

        for (let i = 0; i < deltaWords.length; i += EXTRACTION_CHUNK_SIZE) {
          const chunk = deltaWords.slice(i, i + EXTRACTION_CHUNK_SIZE).join(" ");
          try {
            const res = await fetch("/api/ai/worldboard", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectId,
                chapterId,
                chapterNumber,
                deltaText: chunk,
              }),
            });
            if (res.ok) {
              lastExtractedRef.current += deltaWords.slice(i, i + EXTRACTION_CHUNK_SIZE).length;
              const data = await res.json() as { remaining?: number };
              if (data.remaining !== undefined) onCreditUpdate?.(data.remaining);
            } else {
              break;
            }
          } catch {
            break;
          }
        }

        extractingRef.current = false;
        onStatusRef.current("idle");
      }, 3000);
    });
  }, [editor, projectId, chapterId, chapterNumber]);

  return null;
}

// ── Story Bible plugin ────────────────────────────────────────────────────────

interface StoryBiblePluginProps {
  projectId:           string;
  chapterId:           string;
  initialLastEmbedded: number;
  hasSummary:          boolean;
}

function StoryBiblePlugin({
  projectId,
  chapterId,
  initialLastEmbedded,
  hasSummary,
}: StoryBiblePluginProps) {
  const [editor] = useLexicalComposerContext();

  const lastEmbeddedRef  = useRef(initialLastEmbedded);
  const hasSummarizedRef = useRef(hasSummary);
  const embedTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      let fullText = "";
      editorState.read(() => {
        fullText = $getRoot().getTextContent().trim();
      });
      const words = fullText ? fullText.split(/\s+/) : [];
      const wc    = words.length;

      if (Math.abs(wc - lastEmbeddedRef.current) >= 200) {
        if (embedTimerRef.current) clearTimeout(embedTimerRef.current);
        embedTimerRef.current = setTimeout(() => {
          lastEmbeddedRef.current = wc;
          fetch("/api/ai/story-bible/embed", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ chapterId, projectId }),
          }).catch(console.error);
        }, 5000);
      }

      if (!hasSummarizedRef.current && wc >= 300) {
        hasSummarizedRef.current = true;
        fetch("/api/ai/story-bible/summarize", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ chapterId, projectId }),
        }).catch(console.error);
      }
    });
  }, [editor, chapterId, projectId]);

  return null;
}

// ── Co-Author plugin ──────────────────────────────────────────────────────────
// Handles: recent text tracking, proactive observer, Ctrl+K ghost writer

interface CoAuthorPluginProps {
  projectId:            string;
  chapterId:            string;
  coauthor:             DbCoauthor | null;
  onRecentTextChange:   (text: string) => void;
  onObservation:        (obs: string) => void;
  onCtrlK:              (context: CursorContext) => void;
  ghostSuggestion:      string | null;
  ghostMode:            GhostMode;
  ghostOriginalText:    string;   // original selected text for rewrite accept
  onGhostAccepted:      () => void;
  onGhostDismissed:     () => void;
}

function CoAuthorPlugin({
  projectId,
  chapterId,
  coauthor,
  onRecentTextChange,
  onObservation,
  onCtrlK,
  ghostSuggestion,
  ghostMode,
  ghostOriginalText,
  onGhostAccepted,
  onGhostDismissed,
}: CoAuthorPluginProps) {
  const [editor] = useLexicalComposerContext();

  const observeTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isObservingRef       = useRef(false);
  const lastObservedWCRef    = useRef(-1); // -1 = not yet initialised
  const burstStartWCRef      = useRef(0);
  const lastObservationAtRef = useRef(0); // timestamp of last observation sent

  const coauthorRef          = useRef(coauthor);
  coauthorRef.current        = coauthor;
  const onRecentTextRef      = useRef(onRecentTextChange);
  onRecentTextRef.current    = onRecentTextChange;
  const onObservationRef     = useRef(onObservation);
  onObservationRef.current   = onObservation;
  const onCtrlKRef           = useRef(onCtrlK);
  onCtrlKRef.current         = onCtrlK;
  const ghostSuggestionRef   = useRef(ghostSuggestion);
  ghostSuggestionRef.current = ghostSuggestion;
  const ghostModeRef         = useRef(ghostMode);
  ghostModeRef.current       = ghostMode;
  const ghostOriginalTextRef = useRef(ghostOriginalText);
  ghostOriginalTextRef.current = ghostOriginalText;
  const onGhostAcceptedRef   = useRef(onGhostAccepted);
  onGhostAcceptedRef.current = onGhostAccepted;
  const onGhostDismissedRef  = useRef(onGhostDismissed);
  onGhostDismissedRef.current = onGhostDismissed;

  // Track recent text + proactive observer
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      let fullText = "";
      editorState.read(() => {
        fullText = $getRoot().getTextContent().trim();
      });
      const words = fullText ? fullText.split(/\s+/) : [];
      const wc    = words.length;

      // Update recent text (last ~500 words)
      const recentWords = words.slice(Math.max(0, wc - 500));
      onRecentTextRef.current(recentWords.join(" "));

      if (!coauthorRef.current) return;

      // First update after mount — set the baseline so existing chapter text
      // doesn't register as a fresh burst (prevents chapter-switch from firing).
      if (lastObservedWCRef.current === -1) {
        lastObservedWCRef.current = wc;
        burstStartWCRef.current   = wc;
        return;
      }

      const burst = wc - burstStartWCRef.current;
      // Only trigger after 150+ new words, with a 5-minute cooldown between observations
      const MIN_COOLDOWN_MS = 5 * 60 * 1000;
      if (burst >= 150) {
        if (observeTimerRef.current) clearTimeout(observeTimerRef.current);
        observeTimerRef.current = setTimeout(async () => {
          if (isObservingRef.current) return;
          if (wc <= lastObservedWCRef.current) return;
          if (Date.now() - lastObservationAtRef.current < MIN_COOLDOWN_MS) return;

          isObservingRef.current    = true;
          lastObservedWCRef.current = wc;
          burstStartWCRef.current   = wc;
          lastObservationAtRef.current = Date.now();

          let recentSnap = "";
          editor.getEditorState().read(() => {
            const allWords = $getRoot().getTextContent().trim().split(/\s+/);
            recentSnap = allWords.slice(Math.max(0, allWords.length - 500)).join(" ");
          });

          try {
            const res = await fetch("/api/ai/coauthor/observe", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({
                projectId,
                chapterId,
                recentText:     recentSnap,
                wordCountDelta: burst,
              }),
            });
            const data = await res.json() as { observation?: string | null };
            if (data.observation) onObservationRef.current(data.observation);
          } catch {
            // silently ignore observe errors
          } finally {
            isObservingRef.current = false;
          }
        }, 15000);
      }
    });
  }, [editor, projectId, chapterId]);

  // Keyboard: Ctrl+K to open command bar, Tab to accept, Escape to dismiss
  useEffect(() => {
    return editor.registerRootListener((rootElement, prevRootElement) => {
      function handleKeyDown(e: KeyboardEvent) {
        // Ctrl+K — capture cursor context and open command bar
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
          e.preventDefault();
          e.stopPropagation();
          if (!coauthorRef.current) return;

          // Capture full text split at cursor position
          let beforeCursor = "";
          let afterCursor = "";
          let selectedText = "";

          editor.getEditorState().read(() => {
            const root = $getRoot();
            const fullText = root.getTextContent();
            const sel = $getSelection();

            if ($isRangeSelection(sel)) {
              selectedText = sel.getTextContent();

              // Walk all text nodes to find byte-offset of anchor
              const allTextNodes: string[] = [];
              function walk(node: ReturnType<typeof $getRoot>) {
                if ("getTextContent" in node && typeof (node as { getType: () => string }).getType === "function") {
                  const type = (node as { getType: () => string }).getType();
                  if (type === "text") {
                    allTextNodes.push((node as unknown as { getTextContent: () => string }).getTextContent());
                  }
                }
                if ("getChildren" in node && typeof (node as { getChildren: () => unknown[] }).getChildren === "function") {
                  for (const child of (node as { getChildren: () => ReturnType<typeof $getRoot>[] }).getChildren()) {
                    walk(child);
                  }
                }
              }
              walk(root as ReturnType<typeof $getRoot>);

              // Simple approach: split full text at anchor node
              const anchorNode = sel.anchor.getNode();
              const anchorOffset = sel.anchor.offset;
              const anchorText = "getTextContent" in anchorNode
                ? (anchorNode as unknown as { getTextContent: () => string }).getTextContent()
                : "";

              const beforeAnchor = anchorText.slice(0, anchorOffset);
              const anchorIdx = fullText.indexOf(beforeAnchor.slice(-100));
              if (anchorIdx !== -1) {
                beforeCursor = fullText.slice(0, anchorIdx + beforeAnchor.length);
                afterCursor = fullText.slice(anchorIdx + beforeAnchor.length + selectedText.length);
              } else {
                // Fallback: use full text as beforeCursor
                beforeCursor = fullText;
              }
            }
          });

          onCtrlKRef.current({ beforeCursor, afterCursor, selectedText });
          return;
        }

        // Tab — accept ghost text
        if (e.key === "Tab" && ghostSuggestionRef.current) {
          e.preventDefault();
          e.stopPropagation();
          const suggestion = ghostSuggestionRef.current;
          const mode = ghostModeRef.current;
          const originalText = ghostOriginalTextRef.current;

          editor.update(() => {
            if (mode === "rewrite" && originalText) {
              // Find and replace the original selected text in the document
              const root = $getRoot();
              function replaceInNode(node: ReturnType<typeof $getRoot>): boolean {
                const type = (node as { getType: () => string }).getType?.();
                if (type === "text") {
                  const textNode = node as unknown as { getTextContent: () => string; setTextContent: (t: string) => void; getKey: () => string };
                  const text = textNode.getTextContent();
                  const idx = text.indexOf(originalText);
                  if (idx !== -1) {
                    textNode.setTextContent(
                      text.slice(0, idx) + suggestion + text.slice(idx + originalText.length)
                    );
                    return true;
                  }
                }
                if ("getChildren" in node) {
                  for (const child of (node as { getChildren: () => ReturnType<typeof $getRoot>[] }).getChildren()) {
                    if (replaceInNode(child)) return true;
                  }
                }
                return false;
              }
              const replaced = replaceInNode(root as ReturnType<typeof $getRoot>);
              if (!replaced) {
                // Fallback: insert at cursor
                const sel = $getSelection();
                if ($isRangeSelection(sel)) sel.insertText(suggestion);
              }
            } else {
              // write / continue: insert at current cursor
              const sel = $getSelection();
              if ($isRangeSelection(sel)) sel.insertText(suggestion);
            }
          });
          onGhostAcceptedRef.current();
          return;
        }

        // Escape — dismiss ghost text
        if (e.key === "Escape" && ghostSuggestionRef.current) {
          e.preventDefault();
          onGhostDismissedRef.current();
        }
      }

      prevRootElement?.removeEventListener("keydown", handleKeyDown);
      rootElement?.addEventListener("keydown", handleKeyDown);
    });
  }, [editor]);

  return null;
}

// ── ContentReloadPlugin ───────────────────────────────────────────────────────
// After a global change is applied to the DB, re-hydrate the editor with
// the freshly fetched content so the writer sees changes immediately.

function ContentReloadPlugin({
  pendingContent,
  onLoaded,
}: {
  pendingContent: Record<string, unknown> | null;
  onLoaded: () => void;
}) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!pendingContent) return;
    const state = editor.parseEditorState(JSON.stringify(pendingContent));
    editor.setEditorState(state);
    onLoaded();
  }, [pendingContent, editor, onLoaded]);
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  chapterId:            string;
  chapterTitle:         string;
  initialContent:       Record<string, unknown> | null;
  initialWordCount:     number;
  projectId:            string;
  chapterNumber:        number;
  initialLastExtracted: number;
  initialLastEmbedded:  number;
  initialSummary:       string | null;
  initialCoauthor:      DbCoauthor | null;
  initialCredits:       number;
  isTrial:              boolean;
  // Tutorial
  onboardingStep?:      number;
  onboardingDone?:      boolean;
}

export default function ZenEditor({
  chapterId,
  chapterTitle,
  initialContent,
  initialWordCount,
  projectId,
  chapterNumber,
  initialLastExtracted,
  initialLastEmbedded,
  initialSummary,
  initialCoauthor,
  initialCredits,
  isTrial,
  onboardingStep = 9,
  onboardingDone = true,
}: Props) {
  const ph = usePostHog();
  const ctrlkTracked = useRef(false);

  const [wordCount,        setWordCount]        = useState(initialWordCount);
  const [saveStatus,       setSaveStatus]       = useState<SaveStatus>("idle");
  const [extractionStatus, setExtractionStatus] = useState<"idle" | "extracting">("idle");

  // Credits
  const [credits,          setCredits]          = useState(initialCredits);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);


  // Co-author
  const [coauthor,           setCoauthor]           = useState<DbCoauthor | null>(initialCoauthor);
  const [coauthorSlim,       setCoauthorSlim]       = useState(true);  // starts collapsed; resets on chapter navigation
  const [showCoauthorSetup,  setShowCoauthorSetup]  = useState(false);
  const [pendingObservation, setPendingObservation] = useState<string | null>(null);
  const [recentText,         setRecentText]         = useState("");
  const [chatResponseReceived, setChatResponseReceived] = useState(false);
  const [editorFocused,        setEditorFocused]        = useState(false);

  // Global change reload
  const [pendingReloadContent, setPendingReloadContent] = useState<Record<string, unknown> | null>(null);
  const handleReloadLoaded = useCallback(() => setPendingReloadContent(null), []);
  const handleGlobalChangeDone = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("chapters")
        .select("content")
        .eq("id", chapterId)
        .single();
      if (data?.content) {
        setPendingReloadContent(data.content as Record<string, unknown>);
      }
    } catch {
      // editor stays as-is; change will appear on next page load
    }
  }, [chapterId]);

  // Ghost writer (Ctrl+K)
  const [commandBarOpen,    setCommandBarOpen]    = useState(false);
  const [cursorContext,     setCursorContext]      = useState<CursorContext | null>(null);
  const [ghostSuggestion,   setGhostSuggestion]   = useState<string | null>(null);
  const [ghostMode,         setGhostMode]         = useState<GhostMode>("write");
  const [ghostOriginalText, setGhostOriginalText] = useState("");
  const [ghostLoading,      setGhostLoading]      = useState(false);

  const handleCreditUpdate = useCallback((remaining: number) => {
    setCredits(remaining);
    if (remaining <= 0) setShowUpgradeModal(true);
  }, []);

  const handleCtrlK = useCallback((context: CursorContext) => {
    if (ghostLoading) return;
    if (!ctrlkTracked.current) {
      ctrlkTracked.current = true;
      ph?.capture("feature_used", { feature: "ctrlk_first_use" });
    }
    setCursorContext(context);
    setCommandBarOpen(true);
  }, [ghostLoading, ph]);

  const handleGhostRequest = useCallback(async (instruction: string, context: CursorContext) => {
    const mode: GhostMode = context.selectedText ? "rewrite" : instruction ? "write" : "continue";
    setCommandBarOpen(false);
    setGhostMode(mode);
    setGhostOriginalText(context.selectedText);
    setGhostLoading(true);
    try {
      const res = await fetch("/api/ai/coauthor/suggest", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          projectId,
          chapterId,
          mode,
          instruction:  instruction || undefined,
          beforeCursor: context.beforeCursor,
          afterCursor:  context.afterCursor,
          selectedText: context.selectedText || undefined,
        }),
      });
      const data = await res.json() as { suggestion?: string; error?: string; remaining?: number };
      if (data.remaining !== undefined) handleCreditUpdate(data.remaining);
      if (data.suggestion) setGhostSuggestion(data.suggestion);
    } catch {
      // silently ignore
    } finally {
      setGhostLoading(false);
    }
  }, [projectId, chapterId]);

  const handleCoauthorSave = useCallback(async (name: string, personality: string) => {
    const res = await fetch("/api/coauthor/setup", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ projectId, name, personality }),
    });
    const data = await res.json() as { coauthor?: DbCoauthor };
    if (data.coauthor) {
      setCoauthor(data.coauthor);
      setShowCoauthorSetup(false);
      setCoauthorSlim(false); // expand after setup
    }
  }, [projectId]);

  function openCoauthorPanel() {
    if (!coauthor) {
      setShowCoauthorSetup(true);
      return;
    }
    setCoauthorSlim(false);
  }


  const initialConfig = {
    namespace:   "ZenEditor",
    nodes:       [HeadingNode, QuoteNode],
    theme:       EDITOR_THEME,
    editorState: initialContent ? JSON.stringify(initialContent) : null,
    onError:     (err: Error) => console.error("[Lexical]", err),
  };

  return (
    <div className="flex h-full">

      {/* ── Editor column ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 bg-white">

        {/* Title bar */}
        <div className="shrink-0 flex items-center justify-between px-8 py-3 border-b border-black/[0.06]">
          <h1 className="text-sm font-semibold text-[#1A1A1A] tracking-tight truncate">
            {chapterTitle}
          </h1>
          <div className="flex items-center gap-2">
            <SaveIndicator status={saveStatus} />

            {/* Co-author toggle */}
            <button
              onClick={openCoauthorPanel}
              title={coauthor ? `${coauthor.name} (co-author)` : "Set up co-author"}
              className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${
                coauthor && !coauthorSlim
                  ? "bg-amber-100 text-amber-600"
                  : "text-[#1A1A1A]/30 hover:text-[#1A1A1A]/60 hover:bg-black/[0.05]"
              }`}
            >
              <Wand2 size={13} />
            </button>
          </div>
        </div>

        {/* Lexical editor */}
        <LexicalComposer initialConfig={initialConfig}>
          <div id="tutorial-editor" className="flex-1 overflow-y-auto relative" onClick={() => !editorFocused && setEditorFocused(true)}>
            <div className="relative max-w-[680px] mx-auto px-8 py-14">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="outline-none text-[17px] leading-[1.85] text-[#1A1A1A] font-display min-h-[60vh]"
                    aria-label="Story editor"
                  />
                }
                placeholder={
                  <div
                    className="absolute top-14 left-8 pointer-events-none text-[17px] leading-[1.85] text-[#1A1A1A]/20 font-display select-none"
                    aria-hidden
                  >
                    Begin your story…
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>

            {/* Ctrl+K command bar */}
            {commandBarOpen && cursorContext && (
              <InlineCommandBar
                context={cursorContext}
                onSubmit={(instruction) => handleGhostRequest(instruction, cursorContext)}
                onCancel={() => setCommandBarOpen(false)}
              />
            )}

            {/* Ghost text overlay */}
            {(ghostLoading || ghostSuggestion) && (
              <GhostTextOverlay
                loading={ghostLoading}
                suggestion={ghostSuggestion}
                mode={ghostMode}
                originalText={ghostOriginalText}
                coauthorName={coauthor?.name ?? "Alex"}
                onDismiss={() => setGhostSuggestion(null)}
              />
            )}
          </div>

          <HistoryPlugin />
          <AutoFocusPlugin />
          <OnChangePlugin
            ignoreSelectionChange
            ignoreHistoryMergeTagChange
            onChange={() => {}}
          />
          <AutoSavePlugin
            chapterId={chapterId}
            onWordCountChange={setWordCount}
            onSaveStatusChange={setSaveStatus}
          />
          <ExtractionPlugin
            projectId={projectId}
            chapterId={chapterId}
            chapterNumber={chapterNumber}
            initialLastExtracted={initialLastExtracted}
            onStatusChange={setExtractionStatus}
            onCreditUpdate={handleCreditUpdate}
          />
          <StoryBiblePlugin
            projectId={projectId}
            chapterId={chapterId}
            initialLastEmbedded={initialLastEmbedded}
            hasSummary={initialSummary !== null}
          />
          <CoAuthorPlugin
            projectId={projectId}
            chapterId={chapterId}
            coauthor={coauthor}
            onRecentTextChange={setRecentText}
            onObservation={(obs) => {
              setPendingObservation(obs);
              setCoauthorSlim(false);
            }}
            onCtrlK={handleCtrlK}
            ghostSuggestion={ghostSuggestion}
            ghostMode={ghostMode}
            ghostOriginalText={ghostOriginalText}
            onGhostAccepted={() => { setGhostSuggestion(null); setGhostOriginalText(""); }}
            onGhostDismissed={() => { setGhostSuggestion(null); setGhostOriginalText(""); }}
          />
          <ContentReloadPlugin
            pendingContent={pendingReloadContent}
            onLoaded={handleReloadLoaded}
          />
        </LexicalComposer>

        {/* Status bar */}
        <div className="shrink-0 flex items-center justify-between px-8 py-2 border-t border-black/[0.06] bg-[#FAFAF8]">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#1A1A1A]/35">
              {wordCount.toLocaleString()} word{wordCount !== 1 ? "s" : ""}
            </span>
            {extractionStatus === "extracting" && (
              <span className="text-xs text-violet-500/70">World Board updating…</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Credit balance */}
            <button
              onClick={() => credits <= 0 ? setShowUpgradeModal(true) : undefined}
              className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                credits <= 0
                  ? "text-red-500 cursor-pointer hover:text-red-600"
                  : credits <= 20
                  ? "text-amber-500"
                  : "text-[#1A1A1A]/30"
              }`}
              title={isTrial ? `Trial credits: ${credits} of 100 remaining` : `Credits this month: ${credits} remaining`}
            >
              <span>✦</span>
              <span>
                {credits <= 0 ? "No credits · Upgrade" : `${credits} credit${credits !== 1 ? "s" : ""}${credits <= 20 ? " · Low" : ""}`}
              </span>
            </button>
            <span className="text-xs text-[#1A1A1A]/25 font-mono">
              Ctrl+K write · Tab accept · Esc dismiss
            </span>
          </div>
        </div>

        {/* Upgrade modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-[min(400px,92%)] p-8 text-center">
              <div className="text-3xl mb-3">✦</div>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                You&apos;ve used all your beta credits
              </h2>
              <p className="text-sm text-[#1A1A1A]/55 mb-6">
                Thanks for exploring — you&apos;ve hit the limit for this beta. Paid plans are coming soon. Your work stays saved.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-2.5 rounded-xl bg-[#1A1A1A] text-white text-sm font-semibold hover:bg-[#1A1A1A]/80 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Co-Author panel — always present when configured, just collapsible ── */}
      {coauthor && (
        <CoauthorPanel
          id="tutorial-coauthor"
            projectId={projectId}
            coauthor={coauthor}
            recentText={recentText}
            chapterId={chapterId}
            onOpenSetup={() => setShowCoauthorSetup(true)}
            slim={coauthorSlim}
            onSlimChange={(v) => {
              setCoauthorSlim(v);
            }}
            pendingObservation={pendingObservation}
            onObservationConsumed={() => setPendingObservation(null)}
            onGlobalChangeDone={handleGlobalChangeDone}
            onCreditUpdate={handleCreditUpdate}
            onMessageSent={() => {}}
            onResponseReceived={() => setChatResponseReceived(true)}
          />
      )}

      {/* ── Co-author setup modal ──────────────────────────────────────────── */}
      {showCoauthorSetup && (
        <CoauthorSetup
          onSave={handleCoauthorSave}
          onClose={() => setShowCoauthorSetup(false)}
          initial={coauthor ? { name: coauthor.name, personality: coauthor.personality } : undefined}
        />
      )}

      {/* ── Tutorial overlay (steps 1-5, 8) ───────────────────────────────── */}
      {!onboardingDone && onboardingStep >= 1 && onboardingStep <= 8 && (
        <TutorialOverlay
          projectId={projectId}
          initialStep={onboardingStep}
          initialDone={onboardingDone}
          commandBarOpen={commandBarOpen}
          ghostSuggestion={ghostSuggestion}
          ghostLoading={ghostLoading}
          chatResponseReceived={chatResponseReceived}
          editorFocused={editorFocused}
          onExpandCoauthor={() => {
            setCoauthorSlim(false);
          }}
        />
      )}

    </div>
  );
}

// ── Inline command bar (Ctrl+K) ───────────────────────────────────────────────

function InlineCommandBar({
  context,
  onSubmit,
  onCancel,
}: {
  context: CursorContext;
  onSubmit: (instruction: string) => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Small delay so focus doesn't get grabbed back by the editor
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const hasSelection = !!context.selectedText.trim();
  const selWordCount = hasSelection
    ? context.selectedText.trim().split(/\s+/).length
    : 0;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const val = input.trim();
      if (val) onSubmit(val);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[min(640px,92%)] z-[100]">
      <div className="rounded-xl border border-neutral-300 bg-white shadow-2xl overflow-hidden">
        {/* Context badge */}
        <div className="px-3.5 py-1.5 border-b border-neutral-100 bg-neutral-50 flex items-center gap-2">
          <span className="text-[11px] text-neutral-400 font-mono">
            {hasSelection
              ? `✦ Rewriting ${selWordCount} word${selWordCount !== 1 ? "s" : ""}`
              : "✦ Write at cursor"}
          </span>
          {hasSelection && (
            <span className="text-[11px] text-neutral-300 italic truncate max-w-[300px]">
              "{context.selectedText.trim().slice(0, 60)}{context.selectedText.length > 60 ? "…" : ""}"
            </span>
          )}
        </div>

        {/* Input row */}
        <div className="flex items-center gap-2.5 px-3.5 py-3">
          <Wand2 size={14} className="text-neutral-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasSelection
                ? "How should I change this? e.g. make it more tense, simplify the wording…"
                : "What should I write? e.g. a confrontation where Maya reveals the truth…"
            }
            className="flex-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none bg-transparent"
          />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <kbd className="text-[10px] font-mono bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">
              ↵ write
            </kbd>
            <kbd className="text-[10px] font-mono bg-neutral-100 text-neutral-400 px-1.5 py-0.5 rounded">
              Esc
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Ghost text overlay ────────────────────────────────────────────────────────

function GhostTextOverlay({
  loading,
  suggestion,
  mode,
  originalText,
  coauthorName,
  onDismiss,
}: {
  loading: boolean;
  suggestion: string | null;
  mode: GhostMode;
  originalText: string;
  coauthorName: string;
  onDismiss: () => void;
}) {
  const wordCount = suggestion ? suggestion.trim().split(/\s+/).length : 0;
  const modeLabel =
    mode === "rewrite" ? "rewrites" :
    mode === "write"   ? "writes"   : "suggests";

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[min(640px,92%)] z-[100]">
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 bg-neutral-50">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-neutral-900 flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">
                {coauthorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-xs font-medium text-neutral-600">
              {coauthorName} {modeLabel}
              {!loading && suggestion && (
                <span className="text-neutral-400 font-normal ml-1">· {wordCount} words</span>
              )}
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            Esc to dismiss
          </button>
        </div>

        {/* Original text (rewrite mode) */}
        {mode === "rewrite" && originalText && !loading && suggestion && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-[11px] text-neutral-400 mb-1 font-mono uppercase tracking-wide">Original</p>
            <p className="text-[14px] leading-relaxed text-neutral-400 line-through decoration-red-300 font-display">
              {originalText.length > 300 ? originalText.slice(0, 300) + "…" : originalText}
            </p>
          </div>
        )}

        {/* Generated content */}
        <div className={`px-4 py-3 ${mode === "rewrite" && originalText && !loading && suggestion ? "pt-2" : ""} min-h-[60px] max-h-[280px] overflow-y-auto`}>
          {loading ? (
            <div className="flex items-center gap-2 text-neutral-400">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-sm italic">
                {mode === "rewrite" ? "Rewriting…" : mode === "write" ? "Writing…" : "Continuing…"}
              </span>
            </div>
          ) : (
            <>
              {mode === "rewrite" && originalText && (
                <p className="text-[11px] text-neutral-400 mb-1 font-mono uppercase tracking-wide">New</p>
              )}
              <p className="text-[15px] leading-relaxed text-neutral-700 font-display whitespace-pre-wrap">
                {suggestion}
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        {suggestion && !loading && (
          <div className="flex items-center gap-2 px-4 py-2.5 border-t border-neutral-100 bg-neutral-50">
            <kbd className="text-xs font-mono bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded">Tab</kbd>
            <span className="text-xs text-neutral-500">
              {mode === "rewrite" ? "to replace" : "to insert"}
            </span>
            <span className="text-neutral-300 mx-1">·</span>
            <kbd className="text-xs font-mono bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded">Esc</kbd>
            <span className="text-xs text-neutral-500">to dismiss</span>
            <span className="text-neutral-300 mx-1">·</span>
            <kbd className="text-xs font-mono bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded">Ctrl+K</kbd>
            <span className="text-xs text-neutral-500">to refine</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Save indicator ────────────────────────────────────────────────────────────

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  return (
    <span
      className={`text-xs transition-opacity ${
        status === "saving" ? "text-[#1A1A1A]/35" :
        status === "saved"  ? "text-green-600"     :
                              "text-red-500"
      }`}
    >
      {status === "saving" && "Saving…"}
      {status === "saved"  && "Saved"}
      {status === "error"  && "Failed to save"}
    </span>
  );
}
