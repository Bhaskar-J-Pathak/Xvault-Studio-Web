// Keep the program built but out of the product until we deliberately launch it.
// Set AFFILIATE_PROGRAM_ENABLED=true in the deployment environment to expose it.
export const AFFILIATE_PROGRAM_ENABLED = process.env.AFFILIATE_PROGRAM_ENABLED === "true";
