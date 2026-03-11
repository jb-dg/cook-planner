import { Dispatch, MutableRefObject, SetStateAction, useEffect } from "react";
import { format, getISOWeek, getYear } from "date-fns";
import { fr } from "date-fns/locale";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import { fetchHouseholdScope } from "../../../lib/households";
import { DayPlan } from "../utils/types";
import { normalizeDays } from "../utils/helpers";

/**
 * Subscribes to Supabase Realtime for the current week's menu.
 * When another household member saves, the local state is updated —
 * but only if there are no local unsaved changes (hasLocalChangesRef = false).
 *
 * Own saves are ignored by comparing record.user_id to the current user.
 */
export const usePlannerRealtime = (
  session: Session | null,
  referenceDate: Date,
  setDays: Dispatch<SetStateAction<DayPlan[]>>,
  hasLocalChangesRef: MutableRefObject<boolean>,
) => {
  const weekNumber = getISOWeek(referenceDate);
  const month = format(referenceDate, "MMMM", { locale: fr });
  const year = getYear(referenceDate);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    fetchHouseholdScope(session.user.id).then((scope) => {
      if (cancelled) return;

      // Channel name is unique per household/user + week
      const channelName = `planner_${scope.filterColumn}_${scope.filterValue}_${year}_w${weekNumber}`;

      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "weekly_menus" },
          (payload) => {
            const record = payload.new as Record<string, any>;
            if (!record) return;

            // Filter: only events for this week
            if (
              record.week_number !== weekNumber ||
              record.year !== year ||
              record.month !== month
            ) return;

            // Filter: only events matching the household or user scope
            if (scope.householdId) {
              if (record.household_id !== scope.householdId) return;
            } else {
              if (record.user_id !== session.user.id) return;
            }

            // Skip events triggered by own saves
            if (record.user_id === session.user.id) return;

            // Skip if the local user has unsaved changes (avoid overwriting in-progress edits)
            if (hasLocalChangesRef.current) return;

            setDays(normalizeDays(record.days as DayPlan[] | undefined));
          }
        )
        .subscribe();
    }).catch((err) => {
      console.warn("usePlannerRealtime: could not fetch household scope", err);
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [session?.user.id, weekNumber, year, month]);
};
