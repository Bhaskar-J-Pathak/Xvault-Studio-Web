"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $getRoot, $getSelection, $isRangeSelection, $setSelection } from "lexical";
import { $readProseCursor, $readProseInsertionCursor, insertProse } from "@/lib/prose-cursor";
import type { ProseCursorContext } from "@/lib/prose-cursor";
import type { EditorState } from "lexical";

// ── Ghost writer types ────────────────────────────────────────────────────────
type GhostMode = "write" | "rewrite" | "continue";
type ProseLength = "short" | "medium" | "long";
type EditorThemeName = EditorPrefs["theme"];
const PROSE_LENGTH_KEY = "xv_prose_length";

// ── Direct editor action (toolbar → Lexical, bypasses ghost overlay) ──────────
type DirectAction =
  | { type: "replace";      original: string; replacement: string }
  | { type: "insert-after"; text: string };
type CursorContext = ProseCursorContext & {
  viewportAnchor?: { x: number; top: number; bottom: number };
};
import { createClient, creditsRemaining } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { Check, ChevronDown, GripHorizontal, Loader2, Wand2, X, PenLine, Settings, MoreHorizontal, Share2 } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import CoauthorPanel from "@/app/studio/[projectId]/_components/coauthor-panel";
import CoauthorSetup from "@/app/studio/[projectId]/_components/coauthor-setup";
import TutorialOverlay from "@/app/studio/[projectId]/_components/tutorial-overlay";
import EditPreviewModal from "@/app/studio/[projectId]/_components/edit-preview-modal";
import SelectionToolbar from "./selection-toolbar";
import type { Branch } from "./selection-toolbar";
import StudioSettingsPanel from "./studio-settings-panel";
import type { EditorPrefs } from "./studio-settings-panel";
import { DEFAULT_PREFS, PREFS_KEY, THEME_MAP, FONT_MAP, LINE_SPACING_MAP } from "./studio-settings-panel";
import type { DbCoauthor } from "@/types/database";
import type { EditPlan } from "@/app/api/ai/coauthor/edit/analyze/route";

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
              const failure = await res.json().catch(() => ({}));
              window.dispatchEvent(new CustomEvent("worldboard-error", { detail: failure.error ?? "World Board extraction failed. Please retry from the World Board." }));
              break;
            }
          } catch {
            window.dispatchEvent(new CustomEvent("worldboard-error", { detail: "World Board extraction could not connect. Please retry from the World Board." }));
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
// Handles recent text tracking, proactive observation, and AI writing actions.

interface CoAuthorPluginProps {
  projectId:            string;
  chapterId:            string;
  coauthor:             DbCoauthor | null;
  onRecentTextChange:   (text: string) => void;
  onObservation:        (obs: string) => void;
  onWrite:              (context: CursorContext) => void;
  ghostContext:         CursorContext | null;
  ghostSuggestion:      string | null;
  ghostMode:            GhostMode;
  ghostOriginalText:    string;   // original selected text for rewrite accept
  onGhostAccepted:      () => void;
  onGhostDismissed:     () => void;
  acceptTrigger:        number;   // increment from outside to trigger accept (mobile)
  directAction:         DirectAction | null;  // toolbar replace/insert bypassing ghost
  onDirectActionDone:   () => void;
  triggerWriteRef?:     React.MutableRefObject<(() => void) | null>;
}

function CoAuthorPlugin({
  projectId,
  chapterId,
  coauthor,
  onRecentTextChange,
  onObservation,
  onWrite,
  ghostContext,
  ghostSuggestion,
  ghostMode,
  ghostOriginalText,
  onGhostAccepted,
  onGhostDismissed,
  acceptTrigger,
  directAction,
  onDirectActionDone,
  triggerWriteRef,
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
  const onWriteRef           = useRef(onWrite);
  onWriteRef.current         = onWrite;
  const ghostContextRef = useRef(ghostContext);
  ghostContextRef.current = ghostContext;
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

  const acceptTriggerSeenRef = useRef(0);

  // ── Direct action (toolbar replace / insert-after, bypasses ghost overlay) ──
  const directActionRef        = useRef(directAction);
  directActionRef.current      = directAction;
  const directActionSeenRef    = useRef<DirectAction | null>(null);
  const onDirectActionDoneRef  = useRef(onDirectActionDone);
  onDirectActionDoneRef.current = onDirectActionDone;

  // ── Expose triggerWrite to parent (Write button in title bar) ──────────────
  useEffect(() => {
    if (!triggerWriteRef) return;
    triggerWriteRef.current = () => {
      if (!coauthorRef.current) return;
      let context!: CursorContext;
      editor.getEditorState().read(() => { context = $readProseInsertionCursor(); });
      const domSelection = window.getSelection();
      const editorRoot = editor.getRootElement();
      if (domSelection?.rangeCount && editorRoot?.contains(domSelection.anchorNode)) {
        const caretRange = domSelection.getRangeAt(0).cloneRange();
        caretRange.collapse(false);
        const rect = caretRange.getBoundingClientRect();
        if (rect.height || rect.width) {
          context.viewportAnchor = { x: rect.left, top: rect.top, bottom: rect.bottom };
        }
      }
      onWriteRef.current(context);
    };
    return () => { if (triggerWriteRef) triggerWriteRef.current = null; };
  }, [editor, triggerWriteRef]);

  useEffect(() => {
    if (!directAction || directAction === directActionSeenRef.current) return;
    directActionSeenRef.current = directAction;

    // Capture in local const so TypeScript can narrow the discriminated union inside callbacks
    const action = directAction;

    editor.update(() => {
      if (action.type === "replace") {
        const { original, replacement } = action;
        const root = $getRoot();
        function replaceInNode(node: ReturnType<typeof $getRoot>): boolean {
          const type = (node as { getType: () => string }).getType?.();
          if (type === "text") {
            const tn = node as unknown as { getTextContent: () => string; setTextContent: (t: string) => void };
            const text = tn.getTextContent();
            const idx  = text.indexOf(original);
            if (idx !== -1) {
              tn.setTextContent(text.slice(0, idx) + replacement + text.slice(idx + original.length));
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
          const sel = $getSelection();
          if ($isRangeSelection(sel)) sel.insertText(replacement);
        }
      } else if (action.type === "insert-after") {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) {
          if (!sel.isCollapsed()) {
            sel.anchor.set(sel.focus.key, sel.focus.offset, sel.focus.type);
          }
          sel.insertText(action.text);
        }
      }
    });

    onDirectActionDoneRef.current();
  }, [directAction, editor]);

  // Shared accept logic — called from keyboard (Tab) and mobile button
  const doAcceptRef = useRef<() => void>(() => {});
  useEffect(() => {
    doAcceptRef.current = () => {
      const suggestion = ghostSuggestionRef.current;
      if (!suggestion) return;
      const mode = ghostModeRef.current;

      if (suggestion.startsWith("[Error:")) return;
      editor.update(() => {
        const context = ghostContextRef.current;
        if (!context?.selection || $getRoot().getTextContent() !== context.documentText) {
          window.alert("The chapter changed after generation. Generate again at your desired cursor position.");
          return;
        }
        const selection = context.selection.clone();
        if (mode !== "rewrite" && !selection.isCollapsed()) {
          const end = selection.isBackward() ? selection.anchor : selection.focus;
          selection.anchor.set(end.key, end.offset, end.type);
          selection.focus.set(end.key, end.offset, end.type);
        }
        $setSelection(selection);
        let prose = suggestion;
        if (mode !== "rewrite") {
          const before = context.beforeCursor + context.selectedText;
          // Normalization trims model output; restore whitespace at the join.
          if (before && !/\s$/.test(before) && !/^[\s,.;:!?"”’]/.test(prose)) prose = " " + prose;
          if (context.afterCursor && !/^\s|^[,.;:!?"”’]/.test(context.afterCursor)) prose += " ";
        }
        insertProse(selection, prose);
      });
      onGhostAcceptedRef.current();
    };
  }, [editor]);

  // Watch accept trigger from parent (mobile button)
  useEffect(() => {
    if (acceptTrigger === 0 || acceptTrigger === acceptTriggerSeenRef.current) return;
    acceptTriggerSeenRef.current = acceptTrigger;
    doAcceptRef.current();
  }, [acceptTrigger]);

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

  // Suggestion keyboard actions. Writing and refinement are button-driven so
  // they do not conflict with browser search/address shortcuts.
  useEffect(() => {
    return editor.registerRootListener((rootElement, prevRootElement) => {
      function handleKeyDown(e: KeyboardEvent) {
        // Tab — accept ghost text
        if (e.key === "Tab" && ghostSuggestionRef.current) {
          e.preventDefault();
          e.stopPropagation();
          doAcceptRef.current();
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

// ── SelectionPlugin ───────────────────────────────────────────────────────────
// Tracks text selections inside the Lexical editor and calls onSelectionChange
// with the viewport rect + cursor context whenever a non-empty selection exists.

function SelectionPlugin({
  onSelectionChange,
}: {
  onSelectionChange: (data: { rect: DOMRect; context: CursorContext } | null) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const cbRef = useRef(onSelectionChange);
  cbRef.current = onSelectionChange;

  useEffect(() => {
    function handleSelectionChange() {
      const domSel = window.getSelection();
      if (!domSel || domSel.isCollapsed || domSel.rangeCount === 0) {
        cbRef.current(null);
        return;
      }
      const range = domSel.getRangeAt(0);
      const rect  = range.getBoundingClientRect();
      if (rect.width < 4) {
        cbRef.current(null);
        return;
      }

      let beforeCursor  = "";
      let afterCursor   = "";
      let selectedText  = "";

      let context!: CursorContext;
      editor.getEditorState().read(() => { context = $readProseCursor(); });
      selectedText = context.selectedText;

      if (!selectedText.trim()) {
        cbRef.current(null);
        return;
      }

      cbRef.current({ rect, context });
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
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
  initialCreditCap:     number;
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
  initialCreditCap,
  isTrial,
  onboardingStep = 9,
  onboardingDone = true,
}: Props) {
  const ph = usePostHog();
  const writeTracked = useRef(false);

  const [wordCount,        setWordCount]        = useState(initialWordCount);
  const [saveStatus,       setSaveStatus]       = useState<SaveStatus>("idle");
  const [extractionStatus, setExtractionStatus] = useState<"idle" | "extracting">("idle");
  const [extractionError, setExtractionError] = useState<string | null>(null);
  useEffect(() => {
    const report = (event: Event) => setExtractionError(String((event as CustomEvent).detail));
    window.addEventListener("worldboard-error", report);
    return () => window.removeEventListener("worldboard-error", report);
  }, []);

  // Credits
  const [credits,          setCredits]          = useState(initialCredits);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Keep credits in sync with server via Supabase Realtime
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return;
      channel = supabase
        .channel(`profile-credits-${user.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
          (payload) => {
            const updated = payload.new as Profile;
            const remaining = creditsRemaining(updated);
            setCredits(remaining);
            if (remaining <= 0) setShowUpgradeModal(true);
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Co-author
  const [coauthor,           setCoauthor]           = useState<DbCoauthor | null>(initialCoauthor);
  const [coauthorSlim,       setCoauthorSlim]       = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("xv_coauthor_slim") !== "false" : true
  );
  const userClosedPanel = useRef(false);
  const [showCoauthorSetup,  setShowCoauthorSetup]  = useState(false);
  const [pendingObservation, setPendingObservation] = useState<string | null>(null);
  const [recentText,         setRecentText]         = useState("");
  const [chatResponseReceived, setChatResponseReceived] = useState(false);
  const [editorFocused,        setEditorFocused]        = useState(false);

  // Line edit state
  const [editPlan,    setEditPlan]    = useState<EditPlan | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  async function handleEditChapter() {
    if (editLoading) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/ai/coauthor/edit/analyze", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ projectId, chapterId }),
      });
      const data = await res.json() as { plan?: EditPlan; error?: string };
      if (data.plan) {
        setEditPlan(data.plan);
      } else {
        console.error("[edit] analyze failed:", data.error);
      }
    } catch (err) {
      console.error("[edit] analyze error:", err);
    } finally {
      setEditLoading(false);
    }
  }

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

  // Share modal
  const [showShareModal,   setShowShareModal]   = useState(false);
  const [shareLoading,     setShareLoading]     = useState(false);
  const [shareUrl,         setShareUrl]         = useState<string | null>(null);
  const [shareTitle,       setShareTitle]       = useState("");
  const [shareAuthor,      setShareAuthor]      = useState("");
  const [shareCopied,      setShareCopied]      = useState(false);

  function openShareModal() {
    setShareTitle(`Chapter ${chapterNumber} · ${chapterTitle}`);
    setShareUrl(null);
    setShareCopied(false);
    setShowShareModal(true);
  }

  async function handleCreateShare() {
    setShareLoading(true);
    try {
      const res = await fetch("/api/studio/share", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          projectId,
          chapterId,
          excerptTitle:       shareTitle.trim() || undefined,
          authorDisplayName:  shareAuthor.trim() || undefined,
        }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) setShareUrl(data.url);
    } catch {
      // silently ignore
    } finally {
      setShareLoading(false);
    }
  }

  function handleCopyShareUrl() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  }

  // AI prose generation
  const [commandBarOpen,    setCommandBarOpen]    = useState(false);
  const [cursorContext,     setCursorContext]      = useState<CursorContext | null>(null);
  const [ghostContext, setGhostContext] = useState<CursorContext | null>(null);
  const [ghostSuggestion,   setGhostSuggestion]   = useState<string | null>(null);
  const [ghostMode,         setGhostMode]         = useState<GhostMode>("write");
  const [proseLength,       setProseLength]       = useState<ProseLength>("medium");
  const [ghostOriginalText, setGhostOriginalText] = useState("");
  const [ghostLoading,      setGhostLoading]      = useState(false);
  const [triggerAcceptGhost, setTriggerAcceptGhost] = useState(0);

  // Write button → CoAuthorPlugin bridge
  const triggerWriteRef = useRef<(() => void) | null>(null);
  const writeViewportAnchorRef = useRef<CursorContext["viewportAnchor"]>(undefined);

  const captureWriteViewportAnchor = useCallback(() => {
    writeViewportAnchorRef.current = undefined;
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0).cloneRange();
    const editorElement = document.querySelector('[aria-label="Story editor"]');
    if (!editorElement?.contains(range.startContainer)) return;
    range.collapse(false);
    const rect = range.getBoundingClientRect();
    if (rect.height || rect.width) {
      writeViewportAnchorRef.current = { x: rect.left, top: rect.top, bottom: rect.bottom };
    }
  }, []);

  // Editor preferences (font / line-spacing / theme)
  const [editorPrefs, setEditorPrefs] = useState<EditorPrefs>(DEFAULT_PREFS);
  const [settingsOpen,    setSettingsOpen]    = useState(false);
  const [mobileMoreOpen,  setMobileMoreOpen]  = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) setEditorPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
      const storedLength = localStorage.getItem(PROSE_LENGTH_KEY);
      if (storedLength === "short" || storedLength === "medium" || storedLength === "long") {
        setProseLength(storedLength);
      }
    } catch { /* ignore */ }
  }, []);

  const handleProseLengthChange = useCallback((length: ProseLength) => {
    setProseLength(length);
    try { localStorage.setItem(PROSE_LENGTH_KEY, length); } catch { /* ignore */ }
  }, []);

  // Propagate theme to the entire studio (sidebar, shell, etc.)
  useEffect(() => {
    document.documentElement.setAttribute("data-editor-theme", editorPrefs.theme);
    return () => document.documentElement.removeAttribute("data-editor-theme");
  }, [editorPrefs.theme]);

  // Inject paragraph styles imperatively — bypasses React 19's <style> hoisting
  useEffect(() => {
    const id = "xv-dyn-styles";
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = `.zen-paragraph { line-height: ${LINE_SPACING_MAP[editorPrefs.lineSpacing]} !important; text-indent: ${editorPrefs.indentParagraphs ? "2em" : "0"} !important; }`;
    return () => { document.getElementById(id)?.remove(); };
  }, [editorPrefs.lineSpacing, editorPrefs.indentParagraphs]);

  function handlePrefsChange(p: EditorPrefs) {
    setEditorPrefs(p);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
  }

  // Selection toolbar + What If + Rewrite
  const [selectionData,  setSelectionData]  = useState<{ rect: DOMRect; context: CursorContext } | null>(null);
  const [lockedToolbar,  setLockedToolbar]  = useState<{ rect: DOMRect; context: CursorContext } | null>(null);
  const [whatIfExpanded, setWhatIfExpanded] = useState(false);
  const [whatIfInput,    setWhatIfInput]    = useState("");
  const [whatIfLoading,  setWhatIfLoading]  = useState(false);
  const [whatIfBranches, setWhatIfBranches] = useState<Branch[] | null>(null);
  const [rewriteResult,  setRewriteResult]  = useState<string | null>(null);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [directAction,   setDirectAction]   = useState<DirectAction | null>(null);

  const handleCreditUpdate = useCallback((remaining: number) => {
    setCredits(remaining);
    if (remaining <= 0) setShowUpgradeModal(true);
  }, []);

  const [refineError, setRefineError] = useState<string | null>(null);

  const handleWriteOpen = useCallback((context: CursorContext) => {
    if (ghostLoading) return;
    if (!writeTracked.current) {
      writeTracked.current = true;
      ph?.capture("feature_used", { feature: "write_first_use" });
    }
    // Refinement is intentionally button-only because browser search shortcuts
    // must never change an existing suggestion.
    if (ghostSuggestion) return;
    setCursorContext({
      ...context,
      viewportAnchor: writeViewportAnchorRef.current ?? context.viewportAnchor,
    });
    writeViewportAnchorRef.current = undefined;
    setCommandBarOpen(true);
  }, [ghostLoading, ghostSuggestion, ph]);

  const handleGhostRequest = useCallback(async (instruction: string, context: CursorContext, draft?: string) => {
    const mode: GhostMode = draft ? ghostMode : context.selectedText ? "rewrite" : instruction ? "write" : "continue";
    setRefineError(null);
    setCommandBarOpen(false);
    setGhostContext(context);
    setGhostSuggestion(null);
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
          draft,
          length: proseLength,
          beforeCursor: mode === "continue" ? context.beforeCursor + context.selectedText : context.beforeCursor,
          afterCursor:  context.afterCursor,
          selectedText: context.selectedText || undefined,
        }),
      });
      const data = await res.json() as { suggestion?: string; error?: string; remaining?: number };
      if (data.remaining !== undefined) handleCreditUpdate(data.remaining);
      if (!res.ok || !data.suggestion) {
        ph?.capture("api_error", { feature: "ghost_write", status: res.status, error: data.error, mode });
        const msg = res.status === 429
          ? (data.error ?? "You've run out of AI credits.")
          : (data.error ?? `Something went wrong (${res.status}). Try again.`);
        if (draft) { setGhostSuggestion(draft); setRefineError(msg); }
        else setGhostSuggestion(`[Error: ${msg}]`);
        return;
      }
      if (data.suggestion) setGhostSuggestion(data.suggestion);
    } catch (err) {
      ph?.capture("api_error", { feature: "ghost_write", error: "network_error", detail: String(err), mode });
      const message = err instanceof Error ? err.message : "Network error. Check your connection.";
      if (draft) { setGhostSuggestion(draft); setRefineError(message); }
      else setGhostSuggestion(`[Error: ${message}]`);
    } finally {
      setGhostLoading(false);
    }
  }, [projectId, chapterId, ph, ghostMode, proseLength, handleCreditUpdate]);

  // ── Selection toolbar callbacks ──────────────────────────────────────────────

  function dismissToolbar() {
    setLockedToolbar(null);
    setSelectionData(null);
    setWhatIfExpanded(false);
    setWhatIfBranches(null);
    setWhatIfInput("");
    setRewriteResult(null);
    setRewriteLoading(false);
  }

  const handleToolbarContinue = useCallback(async (context: CursorContext) => {
    dismissToolbar();
    setGhostContext(context);
    setGhostMode("continue");
    setGhostOriginalText("");
    setGhostSuggestion(null);
    setGhostLoading(true);
    try {
      const res = await fetch("/api/ai/coauthor/suggest", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          projectId,
          chapterId,
          mode:         "continue",
          length:       proseLength,
          // Move past the selection so generation continues after it
          beforeCursor: context.beforeCursor + context.selectedText,
          afterCursor:  context.afterCursor,
        }),
      });
      const data = await res.json().catch(() => ({})) as { suggestion?: string; error?: string; remaining?: number };
      if (data.remaining !== undefined) handleCreditUpdate(data.remaining);
      if (!res.ok || !data.suggestion) {
        const message = data.error ?? `Could not continue writing (${res.status}). Please try again.`;
        ph?.capture("api_error", { feature: "toolbar_continue", status: res.status, error: message });
        setGhostSuggestion(`[Error: ${message}]`);
        return;
      }
      setGhostSuggestion(data.suggestion);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error. Check your connection.";
      ph?.capture("api_error", { feature: "toolbar_continue", error: "network_error", detail: String(err) });
      setGhostSuggestion(`[Error: ${message}]`);
    }
    finally { setGhostLoading(false); }
  }, [projectId, chapterId, proseLength, handleCreditUpdate, ph]);

  const handleToolbarRewrite = useCallback(async (context: CursorContext) => {
    dismissToolbar();
    await handleGhostRequest("Rewrite the selected passage with clearer phrasing while preserving its meaning, events, voice, POV, tense, and approximate length.", context);
  }, [handleGhostRequest]);

  const handleWhatIfSubmit = useCallback(async (context: CursorContext, input: string) => {
    if (!input.trim()) return;
    setWhatIfLoading(true);
    setWhatIfBranches(null);
    try {
      const res = await fetch("/api/ai/coauthor/whatif", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          projectId,
          chapterId,
          selectedText:  context.selectedText,
          contextBefore: context.beforeCursor,
          whatIf:        input.trim(),
        }),
      });
      const data = await res.json() as { branches?: Branch[]; remaining?: number };
      if (data.remaining !== undefined) handleCreditUpdate(data.remaining);
      if (data.branches) setWhatIfBranches(data.branches);
    } catch { /* silently ignore */ }
    finally { setWhatIfLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, chapterId, handleCreditUpdate]);

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
      userClosedPanel.current = false;
      setCoauthorSlim(false);
      localStorage.setItem("xv_coauthor_slim", "false");
    }
  }, [projectId]);

  function openCoauthorPanel() {
    if (!coauthor) {
      setShowCoauthorSetup(true);
      return;
    }
    if (!coauthorSlim) {
      // Already open — toggle closed
      setCoauthorSlim(true);
      userClosedPanel.current = true;
      localStorage.setItem("xv_coauthor_slim", "true");
      return;
    }
    userClosedPanel.current = false;
    setCoauthorSlim(false);
    localStorage.setItem("xv_coauthor_slim", "false");
  }


  const initialConfig = {
    namespace:   "ZenEditor",
    nodes:       [HeadingNode, QuoteNode],
    theme:       EDITOR_THEME,
    editorState: initialContent ? JSON.stringify(initialContent) : null,
    onError:     (err: Error) => console.error("[Lexical]", err),
  };

  const th = THEME_MAP[editorPrefs.theme];

  return (
    <div className="flex h-full">

      {/* ── Editor column ──────────────────────────────────────────────────── */}
      <div
        className="xv-editor-col flex flex-col flex-1 min-w-0 transition-colors duration-300"
        style={{
          backgroundColor: th.bg,
          "--zen-line-height": LINE_SPACING_MAP[editorPrefs.lineSpacing],
          "--zen-text-indent": editorPrefs.indentParagraphs ? "2em" : "0",
          "--zen-text":        th.text,
          "--zen-border":      th.border,
        } as React.CSSProperties}
      >

        {/* Title bar */}
        <div
          className="shrink-0 flex items-center justify-between px-4 md:px-8 py-3 border-b"
          style={{ backgroundColor: th.bg, borderBottomColor: th.border }}
        >
          <div className="min-w-0">
            <h1 className="text-sm md:text-[15px] font-semibold tracking-tight truncate" style={{ color: th.text }}>
              {chapterTitle}
            </h1>
            <p className="hidden md:block mt-0.5 text-[10px]" style={{ color: th.textMuted }}>
              {wordCount.toLocaleString()} words
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SaveIndicator status={saveStatus} theme={th} />

            {/* Primary creation action — desktop only; mobile uses Write FAB */}
            <button
              onPointerDown={captureWriteViewportAnchor}
              onClick={() => {
                if (!coauthor) { setShowCoauthorSetup(true); return; }
                triggerWriteRef.current?.();
              }}
              disabled={ghostLoading}
              title="Write with AI at the current cursor"
              className="hidden md:flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold shadow-sm transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: th.text, color: th.bg }}
            >
              <Wand2 size={13} />
              Write
            </button>

            <span className="hidden md:block h-5 w-px" style={{ backgroundColor: th.border }} />

            {/* Line edit — desktop only; mobile uses ••• menu */}
            <button
              onClick={handleEditChapter}
              disabled={editLoading}
              title="Line edit this chapter"
              className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium xv-chrome-btn transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {editLoading
                ? <Loader2 size={12} className="animate-spin" />
                : <PenLine size={12} />
              }
              {editLoading ? "Scanning…" : "Edit"}
            </button>

            {/* Share — desktop only; mobile uses ••• menu */}
            <button
              onClick={openShareModal}
              title="Share this chapter"
              className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium xv-chrome-btn transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share
            </button>

            {/* Co-author toggle — desktop only; mobile uses FAB */}
            <button
              onClick={openCoauthorPanel}
              title={coauthor ? `${coauthor.name} (co-author)` : "Set up co-author"}
              className={`hidden md:flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-colors ${
                coauthor && !coauthorSlim
                  ? "bg-amber-100 text-amber-600"
                  : "xv-chrome-btn"
              }`}
            >
              <Wand2 size={13} />
              <span className="hidden xl:inline">{coauthor?.name ?? "Co-author"}</span>
            </button>

            {/* Settings — visible on all sizes */}
            <button
              onClick={() => setSettingsOpen(s => !s)}
              title="Editor settings"
              className={`flex w-8 h-8 md:w-6 md:h-6 items-center justify-center rounded-lg transition-colors xv-chrome-btn ${
                settingsOpen ? "xv-chrome-btn-active" : ""
              }`}
            >
              <Settings size={14} />
            </button>

            {/* ••• mobile overflow — Share + Line Edit */}
            <button
              onClick={() => setMobileMoreOpen(true)}
              title="More options"
              className="md:hidden flex w-8 h-8 items-center justify-center rounded-lg xv-chrome-btn transition-colors"
            >
              <MoreHorizontal size={16} />
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
                    className="outline-none min-h-[60vh]"
                    style={{
                      fontSize:   "17px",
                      color:      THEME_MAP[editorPrefs.theme].text,
                      fontFamily: FONT_MAP[editorPrefs.font],
                      transition: "color 0.3s, font-family 0.2s",
                    }}
                    aria-label="Story editor"
                  />
                }
                placeholder={
                  <div
                    className="absolute top-0 left-0 pointer-events-none select-none"
                    style={{
                      fontSize:   "17px",
                      lineHeight: LINE_SPACING_MAP[editorPrefs.lineSpacing],
                      color:      THEME_MAP[editorPrefs.theme].placeholder,
                      fontFamily: FONT_MAP[editorPrefs.font],
                    }}
                    aria-hidden
                  >
                    Start writing…
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>

            {/* Write / rewrite command bar */}
            {commandBarOpen && cursorContext && (
              <InlineCommandBar
                context={cursorContext}
                themeName={editorPrefs.theme}
                length={proseLength}
                onLengthChange={handleProseLengthChange}
                onSubmit={(instruction) => handleGhostRequest(instruction, cursorContext)}
                onCancel={() => setCommandBarOpen(false)}
              />
            )}

            {/* Ghost text overlay */}
            {(ghostLoading || ghostSuggestion) && (
              <GhostTextOverlay
                themeName={editorPrefs.theme}
                refineError={refineError}
                onRefine={(instruction) => {
                  if (ghostContext && ghostSuggestion && !ghostLoading) {
                    void handleGhostRequest(instruction, ghostContext, ghostSuggestion);
                  }
                }}
                loading={ghostLoading}
                suggestion={ghostSuggestion}
                mode={ghostMode}
                originalText={ghostOriginalText}
                coauthorName={coauthor?.name ?? "Alex"}
                onDismiss={() => setGhostSuggestion(null)}
                onAccept={() => setTriggerAcceptGhost(t => t + 1)}
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
              if (!userClosedPanel.current) setCoauthorSlim(false);
            }}
            onWrite={handleWriteOpen}
            ghostContext={ghostContext}
            ghostSuggestion={ghostSuggestion}
            ghostMode={ghostMode}
            ghostOriginalText={ghostOriginalText}
            onGhostAccepted={() => { setGhostSuggestion(null); setGhostOriginalText(""); }}
            onGhostDismissed={() => { setGhostSuggestion(null); setGhostOriginalText(""); }}
            acceptTrigger={triggerAcceptGhost}
            directAction={directAction}
            onDirectActionDone={() => setDirectAction(null)}
            triggerWriteRef={triggerWriteRef}
          />
          <ContentReloadPlugin
            pendingContent={pendingReloadContent}
            onLoaded={handleReloadLoaded}
          />
          <SelectionPlugin onSelectionChange={setSelectionData} />
        </LexicalComposer>

        {/* ── Selection toolbar (Continue / Rewrite / What If) ── */}
        {(() => {
          const activeToolbar = lockedToolbar ?? selectionData;
          if (!activeToolbar || ghostLoading || ghostSuggestion || commandBarOpen) return null;
          return (
            <SelectionToolbar
              rect={activeToolbar.rect}
              whatIfExpanded={whatIfExpanded}
              whatIfInput={whatIfInput}
              whatIfLoading={whatIfLoading}
              whatIfBranches={whatIfBranches}
              rewriteLoading={rewriteLoading}
              rewriteResult={rewriteResult}
              onContinue={() => handleToolbarContinue(activeToolbar.context)}
              onRewrite={() => {
                setLockedToolbar(activeToolbar);
                handleToolbarRewrite(activeToolbar.context);
              }}
              onWhatIfToggle={() => {
                if (whatIfExpanded || whatIfBranches) {
                  dismissToolbar();
                } else {
                  setLockedToolbar(activeToolbar);
                  setWhatIfExpanded(true);
                  setWhatIfInput("");
                  setWhatIfBranches(null);
                  setRewriteResult(null);
                }
              }}
              onWhatIfChange={setWhatIfInput}
              onWhatIfSubmit={() => handleWhatIfSubmit(activeToolbar.context, whatIfInput)}
              onBranchUse={(text) => {
                setDirectAction({ type: "insert-after", text });
                dismissToolbar();
              }}
              onRewriteAccept={(replacement) => {
                setDirectAction({ type: "replace", original: activeToolbar.context.selectedText, replacement });
                dismissToolbar();
              }}
              onDismiss={dismissToolbar}
            />
          );
        })()}

        {/* Status bar */}
        <div
          className="shrink-0 flex items-center justify-between px-8 py-2 border-t"
          style={{ backgroundColor: th.bg, borderTopColor: th.border }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs xv-chrome-label">
              {wordCount.toLocaleString()} word{wordCount !== 1 ? "s" : ""}
            </span>
            {extractionError && <span role="alert" className="text-xs text-red-600" onClick={() => setExtractionError(null)}>{extractionError}</span>}
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
                  : "xv-chrome-label"
              }`}
              title={isTrial ? `Trial credits: ${credits} of 100 remaining` : `Credits this month: ${credits} remaining`}
            >
              <span>✦</span>
              <span>
                {credits <= 0 ? "No credits · Upgrade" : `${credits} credit${credits !== 1 ? "s" : ""}${credits <= 20 ? " · Low" : ""}`}
              </span>
            </button>
            <span className="hidden md:inline text-xs xv-chrome-label">
              {ghostLoading
                ? "Generating prose…"
                : ghostSuggestion
                  ? "Tab insert · Esc dismiss"
                  : lockedToolbar || selectionData
                    ? "Choose Continue after, Rewrite, or What If"
                    : "Select text for passage tools"}
            </span>
          </div>
        </div>

        {/* Mobile ••• bottom sheet */}
        {mobileMoreOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 z-[190] bg-black/40"
              onClick={() => setMobileMoreOpen(false)}
            />
            <div className="md:hidden fixed inset-x-0 bottom-0 z-[200] rounded-t-2xl bg-white shadow-2xl pb-safe">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-8 h-1 rounded-full bg-neutral-200" />
              </div>
              <div className="px-4 py-2 space-y-1">
                <button
                  onClick={() => { setMobileMoreOpen(false); openShareModal(); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] text-[#1A1A1A] hover:bg-black/[0.04] transition-colors"
                >
                  <Share2 size={16} className="text-[#71717A]" />
                  Share chapter
                </button>
                <button
                  onClick={() => { setMobileMoreOpen(false); handleEditChapter(); }}
                  disabled={editLoading}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] text-[#1A1A1A] hover:bg-black/[0.04] disabled:opacity-40 transition-colors"
                >
                  {editLoading
                    ? <Loader2 size={16} className="animate-spin text-[#71717A]" />
                    : <PenLine size={16} className="text-[#71717A]" />
                  }
                  {editLoading ? "Scanning chapter…" : "Line edit chapter"}
                </button>
              </div>
              <div className="h-6" />
            </div>
          </>
        )}

        {/* Upgrade modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-[min(400px,92%)] p-8 text-center">
              <div className="text-3xl mb-3">✦</div>
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                You&apos;ve used all your beta credits
              </h2>
              <p className="text-sm text-[#1A1A1A]/55 mb-6">
                Thanks for exploring. You&apos;ve hit the limit for this beta. Paid plans are coming soon. Your work stays saved.
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

      {/* ── Mobile: primary Write action, stacked above the co-author bubble ── */}
      {(!coauthor || coauthorSlim) && (
        <button
          id="tutorial-write-fab"
          className={`md:hidden fixed ${coauthor ? "bottom-[7.5rem]" : "bottom-16"} right-4 z-40 h-11 rounded-full px-4 shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform`}
          style={{ backgroundColor: th.text, color: th.bg }}
          onPointerDown={captureWriteViewportAnchor}
          onClick={() => {
            if (!coauthor) { setShowCoauthorSetup(true); return; }
            triggerWriteRef.current?.();
          }}
          aria-label="Write with AI"
        >
          <Wand2 size={16} />
          <span className="text-sm font-semibold">Write</span>
        </button>
      )}

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
              userClosedPanel.current = v;
              localStorage.setItem("xv_coauthor_slim", v ? "true" : "false");
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

      {/* ── Edit preview modal ─────────────────────────────────────────────── */}
      {editPlan && (
        <EditPreviewModal
          plan={editPlan}
          projectId={projectId}
          onDone={async (summary) => {
            setEditPlan(null);
            await handleGlobalChangeDone(); // reuse existing reload mechanism
            console.info("[edit] done:", summary);
          }}
          onCancel={() => setEditPlan(null)}
        />
      )}

      {/* ── Share modal ────────────────────────────────────────────────────── */}
      {showShareModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-[min(440px,92%)] overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
              <div>
                <h2 className="text-sm font-semibold text-[#1A1A1A]">Share this chapter</h2>
                <p className="text-[11px] text-[#1A1A1A]/40 mt-0.5">
                  Anyone with the link can read it. No login required.
                </p>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-[#1A1A1A]/30 hover:text-[#1A1A1A]/60 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              {!shareUrl ? (
                <>
                  {/* Title field */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#1A1A1A]/50 mb-1.5 uppercase tracking-wide">
                      Title shown on the page
                    </label>
                    <input
                      type="text"
                      value={shareTitle}
                      onChange={(e) => setShareTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-black/[0.10] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-violet-200 bg-white"
                      placeholder={`Chapter ${chapterNumber} · ${chapterTitle}`}
                    />
                  </div>

                  {/* Author field */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#1A1A1A]/50 mb-1.5 uppercase tracking-wide">
                      Author name <span className="normal-case text-[#1A1A1A]/30">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={shareAuthor}
                      onChange={(e) => setShareAuthor(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-black/[0.10] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-violet-200 bg-white"
                      placeholder="Your pen name or real name"
                    />
                  </div>

                  <p className="text-[11px] text-[#1A1A1A]/35">
                    The latest saved version of this chapter will be shared.
                  </p>

                  <button
                    onClick={handleCreateShare}
                    disabled={shareLoading}
                    className="w-full py-2.5 rounded-xl bg-[#1A1A1A] text-white text-sm font-semibold hover:bg-[#1A1A1A]/80 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {shareLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Creating link…
                      </>
                    ) : (
                      "Create share link"
                    )}
                  </button>
                </>
              ) : (
                <>
                  {/* Success state */}
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[#1A1A1A]">Your link is ready</p>
                      <p className="text-[11px] text-[#1A1A1A]/40 mt-0.5">Anyone with this link can read your excerpt.</p>
                    </div>
                  </div>

                  {/* Link display */}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FAFAF8] border border-black/[0.07]">
                    <span className="flex-1 text-[12px] font-mono text-[#1A1A1A]/60 truncate">
                      {shareUrl}
                    </span>
                    <button
                      onClick={handleCopyShareUrl}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                        shareCopied
                          ? "bg-green-500 text-white"
                          : "bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/80"
                      }`}
                    >
                      {shareCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <button
                    onClick={() => setShowShareModal(false)}
                    className="w-full py-2 rounded-xl text-sm text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60 transition-colors"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tutorial overlay (steps 0-5) ───────────────────────────────────── */}
      {!onboardingDone && onboardingStep <= 5 && (
        <TutorialOverlay
          projectId={projectId}
          initialStep={onboardingStep}
          initialDone={onboardingDone}
        />
      )}

      {/* ── Editor settings panel ───────────────────────────────────────────── */}
      <StudioSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        credits={credits}
        isTrial={isTrial}
        cap={initialCreditCap}
        prefs={editorPrefs}
        onChange={handlePrefsChange}
      />

    </div>
  );
}

// ── Inline Write / Rewrite command bar ───────────────────────────────────────

function InlineCommandBar({
  context,
  themeName,
  length,
  onLengthChange,
  onSubmit,
  onCancel,
}: {
  context: CursorContext;
  themeName: EditorThemeName;
  length: ProseLength;
  onLengthChange: (length: ProseLength) => void;
  onSubmit: (instruction: string) => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState("");
  const [lengthMenuOpen, setLengthMenuOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lengthMenuRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ pointerId: -1, offsetX: 0, offsetY: 0 });
  const panelTheme = THEME_MAP[themeName];
  const elevatedBg = themeName === "dark" ? "#252525" : themeName === "sepia" ? "#F2EAD8" : "#FAFAFA";
  const controlBg = themeName === "dark" ? "#2C2C2C" : panelTheme.bg;
  const selectedBg = themeName === "dark" ? "rgba(224,221,213,0.10)" : themeName === "sepia" ? "rgba(107,62,26,0.09)" : "rgba(26,26,26,0.06)";

  const lengthOptions: ReadonlyArray<{ value: ProseLength; label: string; range: string; detail: string }> = [
    { value: "short", label: "Short", range: "100–200 words", detail: "A quick beat or exchange" },
    { value: "medium", label: "Medium", range: "250–450 words", detail: "A developed scene beat" },
    { value: "long", label: "Long", range: "500–800 words", detail: "An extended scene passage" },
  ];
  const selectedLength = lengthOptions.find(option => option.value === length) ?? lengthOptions[1];

  const clampPosition = useCallback((x: number, y: number) => {
    const rect = panelRef.current?.getBoundingClientRect();
    const width = rect?.width ?? Math.min(560, window.innerWidth * 0.92);
    const height = rect?.height ?? 150;
    const gutter = 12;
    return {
      x: Math.min(Math.max(gutter, x), Math.max(gutter, window.innerWidth - width - gutter)),
      y: Math.min(Math.max(gutter, y), Math.max(gutter, window.innerHeight - height - gutter)),
    };
  }, []);

  useEffect(() => {
    // Small delay so focus doesn't get grabbed back by the editor
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const anchor = context.viewportAnchor;
    // On wide screens, the manuscript has useful margin space beside it. Use
    // that as the fallback so an unavailable native caret rect never causes
    // the palette to cover the line the writer is working on.
    let initial = window.innerWidth >= 1200
      ? { x: window.innerWidth - rect.width - 56, y: Math.max(80, (window.innerHeight - rect.height) / 2) }
      : { x: (window.innerWidth - rect.width) / 2, y: window.innerHeight - rect.height - 24 };
    if (anchor) {
      const gap = 18;
      if (anchor.x + gap + rect.width <= window.innerWidth - 12) {
        initial = { x: anchor.x + gap, y: anchor.top - 18 };
      } else if (anchor.x - gap - rect.width >= 12) {
        initial = { x: anchor.x - gap - rect.width, y: anchor.top - 18 };
      } else if (anchor.bottom + gap + rect.height <= window.innerHeight - 12) {
        initial = { x: anchor.x - rect.width / 2, y: anchor.bottom + gap };
      } else {
        initial = { x: anchor.x - rect.width / 2, y: anchor.top - rect.height - gap };
      }
    }
    setPosition(clampPosition(initial.x, initial.y));
  }, [clampPosition, context.viewportAnchor]);

  useEffect(() => {
    function closeLengthMenu(event: PointerEvent) {
      if (!lengthMenuRef.current?.contains(event.target as Node)) setLengthMenuOpen(false);
    }
    function keepPaletteVisible() {
      setPosition(current => current ? clampPosition(current.x, current.y) : current);
    }
    document.addEventListener("pointerdown", closeLengthMenu);
    window.addEventListener("resize", keepPaletteVisible);
    return () => {
      document.removeEventListener("pointerdown", closeLengthMenu);
      window.removeEventListener("resize", keepPaletteVisible);
    };
  }, [clampPosition]);

  function startDragging(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function movePalette(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || event.pointerId !== dragRef.current.pointerId) return;
    setPosition(clampPosition(
      event.clientX - dragRef.current.offsetX,
      event.clientY - dragRef.current.offsetY,
    ));
  }

  function stopDragging(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerId !== dragRef.current.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
  }

  const hasSelection = !!context.selectedText.trim();
  const selWordCount = hasSelection
    ? context.selectedText.trim().split(/\s+/).length
    : 0;

  // Last ~8 words before the cursor — shown when no selection so the user
  // can see exactly where in the document generation will land.
  const cursorPreview = !hasSelection
    ? (() => {
        const trimmed = context.beforeCursor.trim();
        if (!trimmed) return null;
        const words = trimmed.split(/\s+/);
        const tail  = words.slice(-8).join(" ");
        return words.length > 8 ? `…${tail}` : tail;
      })()
    : null;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const val = input.trim();
      if (val) onSubmit(val);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (lengthMenuOpen) setLengthMenuOpen(false);
      else onCancel();
    }
  }

  return (
    <div
      ref={panelRef}
      className={`fixed w-[min(560px,92%)] z-[100] ${position ? "" : "bottom-6 left-1/2 -translate-x-1/2"}`}
      style={position ? { left: position.x, top: position.y } : undefined}
      role="dialog"
      aria-label="Write with AI"
    >
      <div className="rounded-xl border shadow-2xl" style={{ backgroundColor: panelTheme.bg, borderColor: panelTheme.border, color: panelTheme.text }}>
        {/* Context badge + drag handle */}
        <div
          className={`px-3.5 py-2 border-b rounded-t-xl flex items-center gap-2.5 min-w-0 select-none touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ backgroundColor: elevatedBg, borderColor: panelTheme.border }}
          title="Drag to move"
          onPointerDown={startDragging}
          onPointerMove={movePalette}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        >
          <GripHorizontal size={14} className="shrink-0 opacity-40" aria-hidden />
          <span className="text-[11px] font-semibold shrink-0" style={{ color: panelTheme.textMuted }}>
            {hasSelection
              ? `✦ Rewrite · ${selWordCount} word${selWordCount !== 1 ? "s" : ""}`
              : "✦ Write"}
          </span>
          {/* Selection preview */}
          {hasSelection && (
            <span className="hidden md:inline text-[11px] italic truncate opacity-50">
              &ldquo;{context.selectedText.trim().slice(0, 80)}{context.selectedText.length > 80 ? "…" : ""}&rdquo;
            </span>
          )}
          {/* Cursor position preview — the key UX fix */}
          {!hasSelection && cursorPreview && (
            <span className="hidden md:inline text-[11px] italic truncate opacity-50">
              &ldquo;{cursorPreview}&rdquo; &#x2502;
            </span>
          )}
          {!hasSelection && !cursorPreview && (
            <span className="hidden md:inline text-[11px] opacity-50">
              start of document
            </span>
          )}
          {/* Mobile: close */}
          <button
            onClick={onCancel}
            className="ml-auto flex-shrink-0 p-0.5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Cancel"
          >
            <X size={14} />
          </button>
        </div>

        {/* Input row */}
        <div className="flex items-center gap-2.5 px-3.5 py-3">
          <Wand2 size={14} className="flex-shrink-0 opacity-55" />
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
            className="flex-1 text-sm focus:outline-none bg-transparent"
            style={{ color: panelTheme.text, caretColor: panelTheme.text }}
          />
          <button
            onClick={() => { const v = input.trim(); if (v) onSubmit(v); }}
            disabled={!input.trim()}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30 transition-opacity hover:opacity-80"
            style={{ backgroundColor: panelTheme.text, color: panelTheme.bg }}
          >
            Write
          </button>
        </div>

        {!hasSelection && (
          <div className="flex items-center justify-between gap-3 px-3.5 pb-3">
            <div ref={lengthMenuRef} className="relative" role="group" aria-label="Generation length">
              <button
                type="button"
                onClick={() => setLengthMenuOpen(open => !open)}
                aria-haspopup="listbox"
                aria-expanded={lengthMenuOpen}
                className="flex min-w-[176px] items-center justify-between gap-3 rounded-lg border px-2.5 py-1.5 text-left transition-opacity hover:opacity-80"
                style={{ backgroundColor: controlBg, borderColor: panelTheme.border, color: panelTheme.text }}
              >
                <span>
                  <span className="block text-[11px] font-semibold leading-none">{selectedLength.label}</span>
                  <span className="mt-1 block text-[9px] leading-none" style={{ color: panelTheme.textMuted }}>{selectedLength.range}</span>
                </span>
                <ChevronDown size={13} className={`opacity-50 transition-transform ${lengthMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {lengthMenuOpen && (
                <div
                  role="listbox"
                  aria-label="Choose generation length"
                  className="absolute bottom-full left-0 z-10 mb-1.5 w-[250px] overflow-hidden rounded-xl border p-1.5 shadow-xl"
                  style={{ backgroundColor: panelTheme.bg, borderColor: panelTheme.border }}
                >
                  {lengthOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={length === option.value}
                      onClick={() => {
                        onLengthChange(option.value);
                        setLengthMenuOpen(false);
                      }}
                      className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-opacity hover:opacity-75"
                      style={{ backgroundColor: length === option.value ? selectedBg : "transparent" }}
                    >
                      <Check size={13} className={`mt-0.5 shrink-0 ${length === option.value ? "" : "text-transparent"}`} style={length === option.value ? { color: panelTheme.text } : undefined} />
                      <span className="min-w-0">
                        <span className="flex items-baseline gap-1.5 text-xs font-semibold" style={{ color: panelTheme.text }}>
                          {option.label}
                          <span className="text-[10px] font-normal" style={{ color: panelTheme.textMuted }}>{option.range}</span>
                        </span>
                        <span className="mt-0.5 block text-[10px]" style={{ color: panelTheme.textMuted }}>{option.detail}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="hidden md:inline text-[10px]" style={{ color: panelTheme.textMuted }}>
              Enter to write · Esc to close
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ghost text overlay ────────────────────────────────────────────────────────

function GhostTextOverlay({
  themeName,
  onRefine,
  refineError,
  loading,
  suggestion,
  mode,
  originalText,
  coauthorName,
  onDismiss,
  onAccept,
}: {
  themeName: EditorThemeName;
  onRefine: (instruction: string) => void;
  refineError: string | null;
  loading: boolean;
  suggestion: string | null;
  mode: GhostMode;
  originalText: string;
  coauthorName: string;
  onDismiss: () => void;
  onAccept?: () => void;
}) {
  const [refining, setRefining] = useState(false);
  const [refinement, setRefinement] = useState("");
  const refineInput = useRef<HTMLInputElement>(null);
  const panelTheme = THEME_MAP[themeName];
  const elevatedBg = themeName === "dark" ? "#252525" : themeName === "sepia" ? "#F2EAD8" : "#FAFAFA";
  const controlBg = themeName === "dark" ? "#2C2C2C" : panelTheme.bg;
  useEffect(() => { if (refining && !loading) refineInput.current?.focus(); }, [refining, loading]);
  const isError = !!suggestion?.startsWith("[Error:");
  const wordCount = suggestion ? suggestion.trim().split(/\s+/).length : 0;
  const modeLabel =
    mode === "rewrite" ? "rewrites" :
    mode === "write"   ? "writes"   : "suggests";

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[min(640px,92%)] z-[100]">
      <div className="rounded-2xl border shadow-xl overflow-hidden" style={{ backgroundColor: panelTheme.bg, borderColor: panelTheme.border, color: panelTheme.text }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ backgroundColor: elevatedBg, borderColor: panelTheme.border }}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: panelTheme.text }}>
              <span className="text-[8px] font-bold" style={{ color: panelTheme.bg }}>
                {coauthorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-xs font-medium" style={{ color: panelTheme.text }}>
              {coauthorName} {modeLabel}
              {!loading && suggestion && (
                <span className="font-normal ml-1" style={{ color: panelTheme.textMuted }}>· {wordCount} words</span>
              )}
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="text-xs opacity-55 hover:opacity-100 transition-opacity"
          >
            Esc to dismiss
          </button>
        </div>

        {/* Original text (rewrite mode) */}
        {mode === "rewrite" && originalText && !loading && suggestion && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-[11px] mb-1 font-mono uppercase tracking-wide" style={{ color: panelTheme.textMuted }}>Original</p>
            <p className="text-[14px] leading-relaxed line-through decoration-red-300 font-display" style={{ color: panelTheme.textMuted }}>
              {originalText.length > 300 ? originalText.slice(0, 300) + "…" : originalText}
            </p>
          </div>
        )}

        {/* Generated content */}
        <div className={`px-4 py-3 ${mode === "rewrite" && originalText && !loading && suggestion ? "pt-2" : ""} min-h-[60px] max-h-[280px] overflow-y-auto`}>
          {loading ? (
            <div className="flex items-center gap-2" style={{ color: panelTheme.textMuted }}>
              <Loader2 size={14} className="animate-spin" />
              <span className="text-sm italic">
                {mode === "rewrite" ? "Rewriting…" : mode === "write" ? "Writing…" : "Continuing…"}
              </span>
            </div>
          ) : (
            <>
              {mode === "rewrite" && originalText && (
                <p className="text-[11px] mb-1 font-mono uppercase tracking-wide" style={{ color: panelTheme.textMuted }}>New</p>
              )}
              <p className="text-[15px] leading-relaxed font-display whitespace-pre-wrap" style={{ color: panelTheme.text }}>
                {suggestion}
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        {suggestion && !loading && !isError && (
          <div className="border-t" style={{ backgroundColor: elevatedBg, borderColor: panelTheme.border }}>
            <div className="px-4 py-2.5">
              <button
                type="button"
                onClick={() => setRefining(value => !value)}
                aria-expanded={refining}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-opacity hover:opacity-75"
                style={{ backgroundColor: controlBg, borderColor: panelTheme.border, color: panelTheme.text }}
              >
                <Wand2 size={13} />
                Refine
              </button>
              {refining && (
                <form className="mt-2 flex flex-wrap gap-2" onSubmit={(event) => {
                  event.preventDefault();
                  if (refinement.trim()) onRefine(refinement.trim());
                }}>
                  <input ref={refineInput} aria-label="How should this draft change?" value={refinement} onChange={event => setRefinement(event.target.value)}
                    placeholder="e.g. No new powers. Have Arthur try to escape."
                    className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
                    style={{ backgroundColor: controlBg, borderColor: panelTheme.border, color: panelTheme.text, caretColor: panelTheme.text }}
                    onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); setRefining(false); } }} />
                  <button type="submit" disabled={!refinement.trim()} className="rounded-lg px-3 py-2 text-sm disabled:opacity-40 hover:opacity-80" style={{ backgroundColor: panelTheme.text, color: panelTheme.bg }}>Refine draft · 1 credit</button>
                  <p className="w-full text-xs" style={{ color: panelTheme.textMuted }}>Revises this suggestion before you insert it.</p>
                </form>
              )}
              {refineError && <p role="alert" className="mt-2 text-sm text-red-600">{refineError}</p>}
            </div>
            {/* Desktop: keyboard hints */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2.5">
              <kbd className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: controlBg, color: panelTheme.text }}>Tab</kbd>
              <span className="text-xs" style={{ color: panelTheme.textMuted }}>
                {mode === "rewrite" ? "to replace" : "to insert"}
              </span>
              <span className="mx-1 opacity-30">·</span>
              <kbd className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: controlBg, color: panelTheme.text }}>Esc</kbd>
              <span className="text-xs" style={{ color: panelTheme.textMuted }}>to dismiss</span>
              <span className="mx-1 opacity-30">·</span>
              <button type="button" onClick={onAccept} className="text-xs font-medium hover:opacity-75" style={{ color: panelTheme.text }}>{mode === "rewrite" ? "Replace selection" : "Insert at cursor"}</button>
            </div>
            {/* Mobile: touch buttons */}
            <div className="md:hidden flex gap-2 px-4 py-2.5">
              <button
                onClick={onAccept}
                className="flex-1 py-2 rounded-lg text-sm font-semibold active:opacity-75 transition-opacity"
                style={{ backgroundColor: panelTheme.text, color: panelTheme.bg }}
              >
                {mode === "rewrite" ? "Replace" : "Insert"}
              </button>
              <button
                onClick={onDismiss}
                className="flex-1 py-2 rounded-lg text-sm font-semibold active:opacity-75 transition-opacity"
                style={{ backgroundColor: controlBg, color: panelTheme.text }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Save indicator ────────────────────────────────────────────────────────────

function SaveIndicator({ status, theme }: { status: SaveStatus; theme: typeof THEME_MAP[keyof typeof THEME_MAP] }) {
  if (status === "idle") return null;

  return (
    <span
      className={`text-xs transition-opacity ${
        status === "saved"  ? "text-green-600" :
        status === "error"  ? "text-red-500"   : ""
      }`}
      style={status === "saving" ? { color: theme.text, opacity: 0.35 } : undefined}
    >
      {status === "saving" && "Saving…"}
      {status === "saved"  && "Saved"}
      {status === "error"  && "Failed to save"}
    </span>
  );
}
