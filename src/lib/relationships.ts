/** Normalize a stored predicate for display between two entity names. */
export function relationshipPredicate(label: string): string {
  const trimmed = label.trim();
  return /\s+of$/i.test(trimmed) ? trimmed.replace(/^is\s+/i, "") : trimmed;
}

function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

/** Turn a directed graph edge into a sentence that requires no arrow decoding. */
export function relationshipStatement(sourceName: string, label: string, targetName: string): string {
  const predicate = relationshipPredicate(label);
  const roleMatch = predicate.match(/^(.+?)\s+of$/i);

  if (roleMatch) {
    return `${sourceName} is ${possessive(targetName)} ${roleMatch[1]}`;
  }

  if (/^(?:is|are|was|were|has|have)\b/i.test(predicate)) {
    return `${sourceName} ${predicate} ${targetName}`;
  }

  return `${sourceName} ${predicate} ${targetName}`;
}
