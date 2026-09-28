import DodoPayments from "dodopayments";

export type DodoEnvironment = "test_mode" | "live_mode";

export class DodoConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DodoConfigurationError";
  }
}

export function getDodoEnvironment(): DodoEnvironment {
  const configured = process.env.DODO_PAYMENTS_ENVIRONMENT;
  if (configured === "test_mode" || configured === "live_mode") return configured;
  if (configured) {
    throw new DodoConfigurationError("DODO_PAYMENTS_ENVIRONMENT must be either test_mode or live_mode");
  }
  if (process.env.NODE_ENV === "production") {
    throw new DodoConfigurationError("DODO_PAYMENTS_ENVIRONMENT must be set explicitly in production");
  }
  return "test_mode";
}

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new DodoConfigurationError(`${name} is not configured`);
  return value;
}

export function createDodoClient(environment = getDodoEnvironment()): DodoPayments {
  const keyName = environment === "live_mode" ? "DODO_API_KEY_LIVE" : "DODO_API_KEY_TEST";
  return new DodoPayments({ bearerToken: requireEnvironmentVariable(keyName), environment });
}

export function getDodoWebhookSecret(environment = getDodoEnvironment()): string {
  const modeSpecificName = environment === "live_mode"
    ? "DODO_PAYMENTS_WEBHOOK_SECRET_LIVE"
    : "DODO_PAYMENTS_WEBHOOK_SECRET_TEST";
  const modeSpecificSecret = process.env[modeSpecificName]?.trim();
  if (modeSpecificSecret) return modeSpecificSecret;

  // Preserve the existing local test setup while requiring an unambiguous
  // secret for the production endpoint.
  if (environment === "test_mode") return requireEnvironmentVariable("DODO_PAYMENTS_WEBHOOK_SECRET");
  throw new DodoConfigurationError(`${modeSpecificName} is not configured`);
}

export function getDodoProductId(baseEnvironmentName: string, environment = getDodoEnvironment()): string {
  const modeSpecificName = `${baseEnvironmentName}_${environment === "live_mode" ? "LIVE" : "TEST"}`;
  const modeSpecificId = process.env[modeSpecificName]?.trim();
  if (modeSpecificId) return modeSpecificId;

  // Existing test environments used the unsuffixed names. Live mode never
  // falls back, which prevents test product IDs from leaking into production.
  if (environment === "test_mode") return requireEnvironmentVariable(baseEnvironmentName);
  throw new DodoConfigurationError(`${modeSpecificName} is not configured`);
}

export function getCheckoutBaseUrl(requestUrl: string, environment = getDodoEnvironment()): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured && environment === "live_mode") {
    throw new DodoConfigurationError("NEXT_PUBLIC_APP_URL must be set for live payments");
  }

  let url: URL;
  try {
    url = new URL(configured || requestUrl);
  } catch {
    throw new DodoConfigurationError("NEXT_PUBLIC_APP_URL is not a valid absolute URL");
  }

  if (environment === "live_mode" && url.protocol !== "https:") {
    throw new DodoConfigurationError("NEXT_PUBLIC_APP_URL must use HTTPS for live payments");
  }
  return url.origin;
}
