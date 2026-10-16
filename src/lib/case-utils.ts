import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

export type EventType =
  | "ASSIGNED"
  | "UNASSIGNED"
  | "STARTED"
  | "SUBMITTED"
  | "REVISION"
  | "DELIVERED"
  | "RATED"
  | "SCORED"
  | "NOTE"
  | "STATUS";

/** Append an entry to a case's activity log. Never throws: logging must not break the action itself. */
export async function logEvent(
  caseId: string,
  type: EventType,
  actor: Pick<SessionUser, "id" | "role" | "name"> | null,
  note?: string | null
) {
  try {
    await db.caseEvent.create({
      data: {
        caseId,
        type,
        note: note ? String(note).slice(0, 1000) : null,
        actorId: actor?.id ?? null,
        actorRole: actor?.role ?? null,
        actorName: actor?.name ?? null,
      },
    });
  } catch (e) {
    console.error("logEvent failed", e);
  }
}

/** Fields that only staff may see (designer assignment, internal score...). Labs never receive them. */
const INTERNAL_FIELDS = [
  "designerId",
  "designer",
  "assignedAt",
  "dueAt",
  "designerNote",
  "submittedAt",
  "score",
  "scoreNote",
  "scoredAt",
  "events",
] as const;

/** Removes the internal fields from a case before it is sent to a lab. */
export function publicCase<T extends Record<string, unknown>>(kase: T): Omit<T, (typeof INTERNAL_FIELDS)[number]> {
  const copy: Record<string, unknown> = { ...kase };
  for (const key of INTERNAL_FIELDS) delete copy[key];
  // Work sent in by a designer stays hidden from the lab until the admin has approved and delivered it
  if (copy.status !== "DELIVERED") copy.deliveryFiles = "[]";
  return copy as Omit<T, (typeof INTERNAL_FIELDS)[number]>;
}

/** What a designer is allowed to see of a case: no lab identity, no prices, no chat with the lab. */
export const DESIGNER_CASE_SELECT = {
  id: true,
  code: true,
  serviceType: true,
  patientName: true,
  toothNumbers: true,
  notes: true,
  status: true,
  files: true,
  deliveryFiles: true,
  designerNote: true,
  assignedAt: true,
  dueAt: true,
  submittedAt: true,
  deliveredAt: true,
  revisionCount: true,
  rating: true,
  ratingComment: true,
  score: true,
  scoreNote: true,
  createdAt: true,
  updatedAt: true,
} as const;
