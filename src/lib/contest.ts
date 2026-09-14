/** Contest code remains available for a later campaign but is hidden by default. */
export function isContestEnabled(): boolean {
  return process.env.CONTEST_ENABLED === "true";
}
