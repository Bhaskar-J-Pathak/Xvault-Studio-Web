type PostHogProperty = string | number | boolean | null | undefined;

const DEFAULT_POSTHOG_INGEST_HOST = "https://us.i.posthog.com";
const CAPTURE_TIMEOUT_MS = 1500;

export type ServerAnalyticsProperties = Record<string, PostHogProperty>;

export function classifyAnalyticsError(error: unknown): string {
  const name = error instanceof Error ? error.name.toLowerCase() : "";
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (name.includes("abort") || message.includes("abort")) return "aborted";
  if (name.includes("timeout") || message.includes("timeout") || message.includes("deadline")) return "timeout";
  if (message.includes("quota") || message.includes("rate limit") || message.includes("429")) return "quota";
  if (message.includes("json") || message.includes("parse") || message.includes("format")) return "invalid_response";
  if (message.includes("fetch") || message.includes("network") || message.includes("socket")) return "network";
  if (message.includes("database") || message.includes("supabase") || message.includes("rpc")) return "database";
  if (message.includes("gemini") || message.includes("model") || message.includes("provider")) return "ai_provider";
  return "unknown";
}

/**
 * Sends a privacy-safe server event to PostHog.
 *
 * Never pass manuscript text, prompts, generated prose, chapter/project IDs,
 * email addresses, or raw error messages in properties.
 */
export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: ServerAnalyticsProperties = {}
): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey || !distinctId) return;

  const host = (process.env.POSTHOG_INGEST_HOST || DEFAULT_POSTHOG_INGEST_HOST).replace(/\/$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CAPTURE_TIMEOUT_MS);

  try {
    const response = await fetch(`${host}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        properties: {
          ...properties,
          source: "server",
        },
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn("[posthog-server] Capture failed with status", response.status);
    }
  } catch (error) {
    console.warn("[posthog-server] Capture failed:", classifyAnalyticsError(error));
  } finally {
    clearTimeout(timeout);
  }
}
