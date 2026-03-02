import { useEffect, useState } from "react";
import { format, getISOWeek, getYear } from "date-fns";
import { fr } from "date-fns/locale";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import { fetchHouseholdScope } from "../../../lib/households";
import { DayPlan } from "../utils/types";
import { normalizeDays } from "../utils/helpers";
import { DEFAULT_MENU } from "../utils/constants";

export const usePlannerData = (
  session: Session | null,
  referenceDate: Date
) => {
  const [days, setDays] = useState<DayPlan[]>(DEFAULT_MENU);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const weekNumber = getISOWeek(referenceDate);
  const month = format(referenceDate, "MMMM", { locale: fr });
  const year = getYear(referenceDate);

  useEffect(() => {
    if (!session) {
      return;
    }

    let cancelled = false;
    setSyncing(true);
    setSyncError(null);

    const loadWeek = async () => {
      try {
        const scope = await fetchHouseholdScope(session.user.id);
        const { data, error } = await supabase
          .from("weekly_menus")
          .select("days")
          .eq(scope.filterColumn, scope.filterValue)
          .eq("year", year)
          .eq("week_number", weekNumber)
          .eq("month", month)
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          throw error;
        }

        setDays(normalizeDays(data?.days as DayPlan[] | undefined));
      } catch (error) {
        if (cancelled) return;
        setSyncError("Impossible de récupérer cette semaine.");
        console.error("fetch planner", error);
      } finally {
        if (!cancelled) {
          setSyncing(false);
        }
      }
    };

    loadWeek();

    return () => {
      cancelled = true;
    };
  }, [session, weekNumber, year, month]);

  return {
    days,
    setDays,
    syncing,
    syncError,
    weekNumber,
    month,
    year,
  };
};
