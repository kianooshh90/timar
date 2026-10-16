/** Performance numbers of a designer, computed from the cases assigned to them. */
export interface StatCase {
  status: string;
  assignedAt?: Date | string | null;
  dueAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  revisionCount?: number | null;
  rating?: number | null;
  score?: number | null;
}

export interface DesignerStats {
  open: number; // assigned and not delivered/cancelled
  inDesign: number;
  inReview: number; // waiting for the admin's review
  delivered: number;
  overdue: number; // open cases past their deadline
  avgScore: number | null; // admin scores
  scoredCount: number;
  avgRevisions: number | null; // per delivered case
  avgRating: number | null; // lab satisfaction (1..5)
  ratedCount: number;
  onTimeRate: number | null; // % of delivered cases that had a deadline and met it
  avgTurnaroundHours: number | null; // assignment -> delivery
}

const OPEN = new Set(["RECEIVED", "IN_DESIGN", "QC"]);

const ts = (d?: Date | string | null): number | null => {
  if (!d) return null;
  const v = new Date(d).getTime();
  return Number.isNaN(v) ? null : v;
};

const avg = (xs: number[], digits = 1): number | null =>
  xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10 ** digits) / 10 ** digits : null;

export function computeDesignerStats(cases: StatCase[], now: number = Date.now()): DesignerStats {
  const live = cases.filter((c) => c.status !== "CANCELLED");
  const open = live.filter((c) => OPEN.has(c.status));
  const delivered = live.filter((c) => c.status === "DELIVERED");

  const scores = delivered.map((c) => c.score).filter((x): x is number => typeof x === "number");
  const ratings = delivered.map((c) => c.rating).filter((x): x is number => typeof x === "number");
  const revisions = delivered.map((c) => c.revisionCount ?? 0);

  const withDeadline = delivered.filter((c) => ts(c.dueAt) !== null && ts(c.deliveredAt) !== null);
  const onTime = withDeadline.filter((c) => (ts(c.deliveredAt) as number) <= (ts(c.dueAt) as number));

  const turnarounds = delivered
    .map((c) => {
      const a = ts(c.assignedAt);
      const d = ts(c.deliveredAt);
      return a !== null && d !== null && d >= a ? (d - a) / 3_600_000 : null;
    })
    .filter((x): x is number => x !== null);

  return {
    open: open.length,
    inDesign: live.filter((c) => c.status === "IN_DESIGN" || c.status === "RECEIVED").length,
    inReview: live.filter((c) => c.status === "QC").length,
    delivered: delivered.length,
    overdue: open.filter((c) => {
      const due = ts(c.dueAt);
      return due !== null && due < now;
    }).length,
    avgScore: avg(scores),
    scoredCount: scores.length,
    avgRevisions: avg(revisions),
    avgRating: avg(ratings),
    ratedCount: ratings.length,
    onTimeRate: withDeadline.length ? Math.round((onTime.length / withDeadline.length) * 100) : null,
    avgTurnaroundHours: avg(turnarounds),
  };
}
