// TypeScript types mirroring every Supabase table.
// Keep in sync with supabase/migrations/001_initial.sql.

export type Plan = "free" | "scribe" | "pro";
export type EntityType = "character" | "location" | "faction" | "item" | "event";
export type ThreadStatus = "open" | "resolved" | "dead";

export interface DbProfile {
  id: string;
  email: string;
  plan: Plan;
  ai_requests_this_month: number;
  ai_requests_total: number;
  requests_reset_at: string;
  trial_ends_at: string | null;
  onboarding_step: number;
  onboarding_done: boolean;
  updated_at: string;
}

export interface DbProject {
  id: string;
  user_id: string;
  title: string;
  genre: string | null;
  is_sample: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DbChapter {
  id: string;
  project_id: string;
  title: string;
  content: Record<string, unknown> | null; // Lexical editor state
  word_count: number;
  position: number;
  summary: string | null;
  last_embedded_word: number;
  last_extracted_word: number;
  created_at: string;
  updated_at: string;
}

export interface DbStoryBible {
  id: string;
  project_id: string;
  project_intent: string | null;
  style_notes:    string | null;
  synopsis:       string | null;
  created_at: string;
  updated_at: string;
}

export interface DbStoryChunk {
  id: string;
  project_id: string;
  chapter_id: string;
  content: string;
  embedding: number[] | null; // 768-dim float array
  chunk_index: number;
  word_start: number;
  created_at: string;
}

export interface DbPlotThread {
  id: string;
  project_id: string;
  description: string;
  introduced_chapter_id: string | null;
  last_seen_chapter_id: string | null;
  last_seen_word_position: number;
  total_project_words: number;
  status: ThreadStatus;
  created_at: string;
  updated_at: string;
}

export interface DbEntity {
  id: string;
  project_id: string;
  name: string;
  type: EntityType;
  description: string | null;
  attributes: Record<string, unknown>;
  position: { x: number; y: number };
  created_at: string;
}

export interface DbRelationship {
  id: string;
  project_id: string;
  source_id: string;
  target_id: string;
  label: string | null;
  created_at: string;
}

export interface DbCorkCard {
  id: string;
  project_id: string;
  title: string | null;
  content: string | null;
  color: string;
  position: { x: number; y: number };
  created_at: string;
}

export interface DbStyleProfile {
  id: string;
  project_id: string;
  pov: string | null;
  tense: string | null;
  sentence_length: string | null;
  dialogue_ratio: string | null;
  description_density: string | null;
  tone: string | null;
  vocabulary_level: string | null;
  sample_sentences: string[];
  analyzed_at_words: number;
  created_at: string;
  updated_at: string;
}

export interface DbChatMemory {
  id: string;
  project_id: string;
  summary: string;
  tags: string[];
  created_at: string;
}

export interface DbSampleProject {
  id: string;
  genre: string;
  title: string;
  chapters: SampleChapter[];
  chunks: SampleChunk[];
  entities: SampleEntity[];
  relationships: SampleRelationship[];
  threads: SampleThread[];
}

// Sub-types for sample_projects JSONB columns
export interface SampleChapter {
  title: string;
  content: string; // plain text
  word_count: number;
}

export interface SampleChunk {
  content: string;
  embedding: number[];
  chunk_index: number;
  word_start: number;
}

export interface SampleEntity {
  name: string;
  type: EntityType;
  description: string;
  attributes: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface SampleRelationship {
  source_name: string;
  target_name: string;
  label: string;
}

export interface SampleThread {
  description: string;
  introduced_chapter: string; // chapter title
  last_seen_chapter: string;  // chapter title
  status: ThreadStatus;
}

// Return type from the consume_ai_request RPC
export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; reason: "plan_limit" | "trial_limit"; remaining: number };

export interface DbFeedback {
  id: string;
  user_id: string | null;
  mood: "good" | "meh" | "bad";
  text: string | null;
  page: string | null;
  created_at: string;
}

// Return type from the search_story_chunks RPC
export interface StoryChunkMatch {
  id: string;
  chapter_id: string;
  content: string;
  similarity: number;
}

export type CoauthorMessageType = "chat" | "observation" | "celebration" | "nudge" | "ghost_accepted";

export interface DbCoauthor {
  id: string;
  project_id: string;
  name: string;
  personality: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCoauthorMessage {
  id: string;
  project_id: string;
  role: "user" | "assistant";
  content: string;
  message_type: CoauthorMessageType;
  created_at: string;
}
