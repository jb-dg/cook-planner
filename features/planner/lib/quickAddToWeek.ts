import { addDays, format, getISOWeek, getYear, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Session } from "@supabase/supabase-js";

import { fetchHouseholdScope } from "@/lib/households";
import { supabase } from "@/lib/supabase";

import { normalizeDays } from "../utils/helpers";
import { DEFAULT_MENU } from "../utils/constants";
import { DayPlan, MealKey } from "../utils/types";

// Shared by the recipe-book "Ajouter au planning" quick action — deliberately
// standalone rather than reusing usePlannerData/useAutoSave, which are wired
// to the planner screen's own live state (selected week, autosave queue,
// realtime). This only ever targets "the current week" and performs one
// fetch + one save, so a small dedicated module is safer than threading a
// one-off write path through those stateful hooks.
const getCurrentWeekMeta = () => {
  const referenceDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  return {
    referenceDate,
    weekNumber: getISOWeek(referenceDate),
    month: format(referenceDate, "MMMM", { locale: fr }),
    year: getYear(referenceDate),
  };
};

export type WeekDayLabel = { day: string; dateLabel: string };

// Aligned by index with DEFAULT_MENU / the DayPlan[] order (Lundi → Dimanche).
export const getCurrentWeekDayLabels = (): WeekDayLabel[] => {
  const { referenceDate } = getCurrentWeekMeta();
  return DEFAULT_MENU.map((template, index) => {
    const raw = format(addDays(referenceDate, index), "d MMM", { locale: fr });
    return { day: template.day, dateLabel: raw };
  });
};

export const getCurrentWeekRangeLabel = (): string => {
  const { referenceDate } = getCurrentWeekMeta();
  const startLabel = format(referenceDate, "d MMM", { locale: fr });
  const endLabel = format(addDays(referenceDate, 6), "d MMM", { locale: fr });
  return `${startLabel} → ${endLabel}`;
};

export const fetchCurrentWeekDays = async (session: Session): Promise<DayPlan[]> => {
  const { weekNumber, month, year } = getCurrentWeekMeta();
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

  if (error) throw error;
  return normalizeDays(data?.days as DayPlan[] | undefined);
};

// Fetches the current week fresh (so a slot changed elsewhere in the
// meantime isn't clobbered), writes the recipe into the given slot, and
// upserts — mirroring useAutoSave's existing-row lookup (incl. the legacy
// user_id fallback and unique-constraint race retry) without its
// save-queue/status machinery, since this is a single one-shot write.
export const saveRecipeToCurrentWeekSlot = async (
  session: Session,
  dayIndex: number,
  meal: MealKey,
  recipeTitle: string,
): Promise<DayPlan[]> => {
  const { weekNumber, month, year } = getCurrentWeekMeta();
  const scope = await fetchHouseholdScope(session.user.id);

  const current = await fetchCurrentWeekDays(session);
  const nextDays = current.map((day, index) =>
    index === dayIndex ? { ...day, [meal]: { recipe: recipeTitle } } : day,
  );

  const payload = {
    user_id: session.user.id,
    household_id: scope.householdId,
    week_number: weekNumber,
    month,
    year,
    days: nextDays,
  };

  const findExistingId = async (): Promise<string | null> => {
    const { data, error } = await supabase
      .from("weekly_menus")
      .select("id")
      .eq(scope.filterColumn, scope.filterValue)
      .eq("year", year)
      .eq("week_number", weekNumber)
      .limit(1)
      .maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    if (data?.id) return data.id;

    // Legacy compatibility: row may exist for this user/week under a
    // different scope (e.g. household_id was null before migration).
    if (scope.filterColumn === "household_id") {
      const { data: legacy, error: legacyError } = await supabase
        .from("weekly_menus")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("year", year)
        .eq("week_number", weekNumber)
        .limit(1)
        .maybeSingle();
      if (legacyError && legacyError.code !== "PGRST116") throw legacyError;
      if (legacy?.id) return legacy.id;
    }
    return null;
  };

  const existingId = await findExistingId();

  let { error: saveError } = existingId
    ? await supabase.from("weekly_menus").update(payload).eq("id", existingId)
    : await supabase.from("weekly_menus").insert(payload);

  // Race safety: another write created the row between our lookup and this
  // insert — fall back to updating whatever now exists for this week.
  if (saveError?.code === "23505") {
    const retryId = await findExistingId();
    if (retryId) {
      const { error: retryError } = await supabase
        .from("weekly_menus")
        .update(payload)
        .eq("id", retryId);
      saveError = retryError ?? null;
    }
  }

  if (saveError) throw saveError;
  return nextDays;
};
