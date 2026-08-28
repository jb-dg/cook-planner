import { format } from "date-fns";

import type { MissingSlot } from "../types";

// Shared by both home layouts (phone + iPad split view) so tapping the
// "X repas manquants" line jumps the planner straight to that day instead
// of just opening on today, which is all a plain "/planner" push gives you.
export const buildPlannerRoute = (slot: MissingSlot) =>
  slot
    ? {
        pathname: "/planner" as const,
        params: { date: format(slot.date, "yyyy-MM-dd"), meal: slot.meal },
      }
    : "/planner";
