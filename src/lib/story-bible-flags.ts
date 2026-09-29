function canaryProjects(): Set<string> {
  return new Set(
    (process.env.STORY_BIBLE_CANARY_PROJECT_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

function enabledForProject(flag: string | undefined, projectId: string): boolean {
  if (flag?.trim().toLowerCase() === "true") return true;
  return canaryProjects().has(projectId);
}

/** Safe default is off. Enable globally or allowlist individual project IDs. */
export function storyMemoryRetrievalEnabled(projectId: string): boolean {
  return enabledForProject(process.env.STORY_MEMORY_RETRIEVAL_ENABLED, projectId);
}

/** Manual summary generation remains available even when auto-refresh is off. */
export function storyBibleAutoRefreshEnabled(projectId: string): boolean {
  return enabledForProject(process.env.STORY_BIBLE_AUTO_REFRESH_ENABLED, projectId);
}
