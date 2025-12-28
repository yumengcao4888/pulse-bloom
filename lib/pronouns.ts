export const PRONOUNS_PATTERN = /^[a-z]+\/[a-z]+(\/[a-z]+)?$/;

export function normalizePronouns(input: string | null | undefined): string | null {
  if (input == null) return null;
  const trimmed = input.trim().toLowerCase();
  return trimmed === "" ? null : trimmed;
}

export function isValidPronouns(input: string | null | undefined): boolean {
  const normalized = normalizePronouns(input);
  if (!normalized) return true;
  return PRONOUNS_PATTERN.test(normalized);
}
