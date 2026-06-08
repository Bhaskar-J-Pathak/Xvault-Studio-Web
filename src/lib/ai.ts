/**
 * AI client utilities — server-side only.
 * Never import this file in client components.
 */

// ---------------------------------------------------------------------------
// Gemini key priority
// ---------------------------------------------------------------------------

/**
 * Returns Gemini API keys in priority order: free key first, paid fallback.
 * Filters out any undefined/empty values so callers always get a clean list.
 */
function getGeminiKeys(): string[] {
  return [
    process.env.GEMINI_API_KEY_FREE,
    process.env.GEMINI_API_KEY,
  ].filter((k): k is string => Boolean(k));
}

/**
 * HTTP status codes from Gemini that mean "this key is out of quota / rate
 * limited" — safe to retry with the next key rather than giving up.
 */
const RATE_LIMIT_STATUSES = new Set([429, 503]);

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------

/**
 * Embed a text string using gemini-embedding-001 (768-dim).
 * Used for Story Bible semantic search.
 * Tries the free key first; falls back to the paid key on any error.
 */
export async function geminiEmbed(text: string): Promise<number[]> {
  const keys = getGeminiKeys();
  let lastError = "";

  for (const key of keys) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/gemini-embedding-001",
          content: { parts: [{ text }] },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      lastError = `embed (${res.status}): ${body.slice(0, 200)}`;
      // Always try the next key — covers rate limits, bad keys, and model access issues
      console.warn(`[gemini] Embed key failed (${res.status}), trying next key…`);
      continue;
    }

    const data = await res.json();
    return data.embedding.values as number[];
  }

  throw new Error(`Gemini embed failed on all keys — ${lastError}`);
}

/**
 * Stream a Gemini response (gemini-2.5-flash).
 * Returns the raw SSE ReadableStream — pipe it directly to the client.
 * Tries the free key first; falls back to the paid key on rate-limit errors.
 */
export async function geminiStream(
  prompt: string,
  systemPrompt?: string,
  maxTokens = 512
): Promise<ReadableStream<Uint8Array>> {
  const keys = getGeminiKeys();
  let lastError = "";

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.85,
    },
  };

  if (systemPrompt) {
    body.system_instruction = { parts: [{ text: systemPrompt }] };
  }

  for (const key of keys) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${key}&alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      lastError = `stream (${res.status}): ${text.slice(0, 200)}`;
      if (RATE_LIMIT_STATUSES.has(res.status)) {
        console.warn(`[gemini] Free key rate-limited (${res.status}), trying paid key…`);
        continue;
      }
      throw new Error(`Gemini stream failed — ${lastError}`);
    }

    return res.body;
  }

  throw new Error(`Gemini stream failed on all keys — ${lastError}`);
}

/**
 * Single-shot (non-streaming) Gemini call.
 * Tries the free key first; falls back to the paid key on rate-limit errors.
 */
export async function geminiGenerate(
  prompt: string,
  systemPrompt?: string,
  maxTokens = 2048,
  jsonMode = false,
  model = "gemini-2.5-flash"
): Promise<string> {
  const keys = getGeminiKeys();
  let lastError = "";

  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: maxTokens,
    temperature: 0.7,
  };

  // In the v1beta REST API, thinking tokens count against maxOutputTokens.
  // Flash: always disable thinking — it adds latency/cost with no benefit for
  // the short, structured tasks we use it for (summaries, JSON extraction, etc.).
  // Pro: cap thinking at 1024 in jsonMode so the budget goes to JSON output.
  if (model.includes("flash")) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  } else if (jsonMode) {
    generationConfig.thinkingConfig = { thinkingBudget: 1024 };
  }

  if (jsonMode) {
    generationConfig.responseMimeType = "application/json";
  }

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig,
  };

  if (systemPrompt) {
    body.system_instruction = { parts: [{ text: systemPrompt }] };
  }

  for (const key of keys) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      lastError = `generate [${model}] (${res.status}): ${text.slice(0, 200)}`;
      if (RATE_LIMIT_STATUSES.has(res.status)) {
        console.warn(`[gemini] Free key rate-limited (${res.status}), trying paid key…`);
        continue;
      }
      throw new Error(`Gemini generate failed — ${lastError}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  throw new Error(`Gemini generate failed on all keys — ${lastError}`);
}

// ---------------------------------------------------------------------------
// OpenRouter  (with automatic fallback to next free model)
// ---------------------------------------------------------------------------

// Free models in priority order. The requested model is tried first;
// if it fails or is at capacity the next one is tried automatically.
// Keep this list updated — free model availability changes on OpenRouter.
const FREE_MODELS = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-2-9b-it:free",
  "qwen/qwen-2.5-7b-instruct:free",
  "microsoft/phi-3-mini-128k-instruct:free",
];

export type OpenRouterMessage = { role: "user" | "assistant" | "system"; content: string };

/**
 * Call OpenRouter with automatic fallback across free models.
 * Pass the preferred model as the first argument; it will try others
 * if the first is at capacity or returns an error.
 */
export async function openRouterCall(
  preferredModel: string,
  messages: OpenRouterMessage[],
  maxTokens = 1000
): Promise<string> {
  const modelsToTry = [
    preferredModel,
    ...FREE_MODELS.filter((m) => m !== preferredModel),
  ];

  let lastError = "";

  for (const model of modelsToTry) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000); // 30s timeout

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://xvault.dev",
          "X-Title": "XVault Studio",
        },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        lastError = `${model} → HTTP ${res.status}: ${body.slice(0, 200)}`;
        console.error(`[openrouter] ${lastError}`);
        continue;
      }

      const data = await res.json();
      const content: string | undefined =
        data.choices?.[0]?.message?.content;

      if (content) return content;

      lastError = `${model} → empty response`;
      console.error(`[openrouter] ${lastError}`);
    } catch (err) {
      lastError = `${model} → ${String(err)}`;
      console.error(`[openrouter] ${lastError}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`All OpenRouter models failed. Last error: ${lastError}`);
}
