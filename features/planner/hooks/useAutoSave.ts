import { useCallback, useRef, useState } from "react";
import { format, getISOWeek, getYear } from "date-fns";
import { fr } from "date-fns/locale";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import { fetchHouseholdScope } from "../../../lib/households";
import { DayPlan } from "../utils/types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

// Field-by-field comparison to avoid JSON.stringify on React Proxy objects
const daysEqual = (a: DayPlan[], b: DayPlan[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((day, i) => {
    const other = b[i];
    return (
      day.lunch?.recipe === other.lunch?.recipe &&
      day.dinner?.recipe === other.dinner?.recipe &&
      (day.notes ?? "") === (other.notes ?? "")
    );
  });
};

export const useAutoSave = (
  days: DayPlan[],
  session: Session | null,
  referenceDate: Date,
) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lastSavedDaysRef = useRef<DayPlan[]>([]);
  const isSavingRef = useRef(false);

  // `days` is included in deps so the closure always has the latest value
  const save = useCallback(async (explicitDays?: DayPlan[]) => {
    if (!session || isSavingRef.current) return;

    const dataToSave = explicitDays ?? days;

    if (!Array.isArray(dataToSave) || dataToSave.length === 0) return;
    if (daysEqual(dataToSave, lastSavedDaysRef.current)) return;

    isSavingRef.current = true;
    setSaveStatus("saving");

    try {
      const weekNumber = getISOWeek(referenceDate);
      const month = format(referenceDate, "MMMM", { locale: fr });
      const year = getYear(referenceDate);

      const scope = await fetchHouseholdScope(session.user.id);

      const sanitizedDays = dataToSave.map((day) => {
        const sanitize = (value?: { recipe?: string }) => ({
          recipe: value?.recipe?.trim() ?? "",
        });
        return {
          ...day,
          lunch: sanitize(day.lunch),
          dinner: sanitize(day.dinner),
        };
      });

      const payload = {
        user_id: session.user.id,
        household_id: scope.householdId,
        week_number: weekNumber,
        month,
        year,
        days: sanitizedDays,
      };

      const commonFilters = { year, week_number: weekNumber, month };
      const candidateFilters: Record<string, any>[] = [
        { [scope.filterColumn]: scope.filterValue, ...commonFilters },
      ];
      if (scope.householdId) {
        candidateFilters.push({ user_id: session.user.id, ...commonFilters });
      }

      let existingMenu: { id: string } | null = null;
      for (const matcher of candidateFilters) {
        const { data, error } = await supabase
          .from("weekly_menus")
          .select("id")
          .match(matcher)
          .limit(1)
          .maybeSingle();

        if (error && error.code !== "PGRST116") throw error;
        if (data?.id) {
          existingMenu = data;
          break;
        }
      }

      const mutation = existingMenu?.id
        ? supabase.from("weekly_menus").update(payload).eq("id", existingMenu.id)
        : supabase.from("weekly_menus").insert(payload);

      const { error: saveError } = await mutation;
      if (saveError) throw saveError;

      lastSavedDaysRef.current = dataToSave;
      setSaveStatus("saved");
      setLastSaved(new Date());
      setError(null);
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("error");
      setError("Erreur lors de la sauvegarde");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      isSavingRef.current = false;
    }
  }, [days, session, referenceDate]);

  return {
    save,
    saveStatus,
    lastSaved,
    error,
    isSaving: saveStatus === "saving",
    isSaved: saveStatus === "saved",
    hasError: saveStatus === "error",
  };
};
