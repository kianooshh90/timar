/**
 * Score suggestion for a designer's work on one case (0..100).
 * Shared by the server (validation) and the admin panel (shows the suggestion).
 *
 *   start at 100
 *   - 10 points for every revision (sent back by admin or lab), at most -50
 *   - satisfaction of the lab/doctor:  5 stars: 0,  4: -5,  3: -10,  2: -20,  1: -30   (no rating: 0)
 *   - 10 points if delivered after the deadline
 */
export interface ScoreInput {
  revisions: number;
  rating?: number | null;
  late?: boolean;
}

export interface ScoreSuggestion {
  score: number;
  base: number;
  revisionPenalty: number;
  ratingPenalty: number;
  latePenalty: number;
}

const RATING_PENALTY: Record<number, number> = { 5: 0, 4: 5, 3: 10, 2: 20, 1: 30 };

export function suggestScore({ revisions, rating, late }: ScoreInput): ScoreSuggestion {
  const base = 100;
  const revisionPenalty = Math.min(50, Math.max(0, Math.floor(revisions || 0)) * 10);
  const ratingPenalty = rating && RATING_PENALTY[rating] !== undefined ? RATING_PENALTY[rating] : 0;
  const latePenalty = late ? 10 : 0;
  const score = Math.max(0, Math.min(100, base - revisionPenalty - ratingPenalty - latePenalty));
  return { score, base, revisionPenalty, ratingPenalty, latePenalty };
}

/** Parses a score typed by the admin; returns null when it is not an integer between 0 and 100. */
export function parseScore(input: unknown): number | null {
  const n = typeof input === "string" && input.trim() !== "" ? Number(input) : input;
  if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 100) return null;
  return n;
}
