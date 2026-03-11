import { useCallback, useRef, useState } from "react";
import { format, getISOWeek, getYear } from "date-fns";
import { fr } from "date-fns/locale";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import { fetchHouseholdScope, HouseholdScope } from "../../../lib/households";
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
  // Queued data: if a save arrives while one is in progress, we keep the latest here
  const pendingDaysRef = useRef<DayPlan[] | null>(null);
  // Exposed to usePlannerRealtime so it can skip applying remote updates during local edits
  const hasLocalChangesRef = useRef(false);
  // Cache household scope per week to avoid fetching on every save
  const cachedScopeRef = useRef<{ scope: HouseholdScope; weekKey: string } | null>(null);

  const doSave = useCallback(async (initialData: DayPlan[]) => {
    if (!session) return;

    let dataToSave = initialData;

    // Loop: after each save, process any pending data that arrived while saving
    while (true) {
      isSavingRef.current = true;
      hasLocalChangesRef.current = true;
      setSaveStatus("saving");

      try {
        const weekNumber = getISOWeek(referenceDate);
        const month = format(referenceDate, "MMMM", { locale: fr });
        const year = getYear(referenceDate);
        const weekKey = `${year}-${weekNumber}-${month}`;

        // Cache household scope per week
        let scope: HouseholdScope;
        if (cachedScopeRef.current?.weekKey === weekKey) {
          scope = cachedScopeRef.current.scope;
        } else {
          scope = await fetchHouseholdScope(session.user.id);
          cachedScopeRef.current = { scope, weekKey };
        }

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

        const { data: existing, error: fetchError } = await supabase
          .from("weekly_menus")
          .select("id")
          .eq(scope.filterColumn, scope.filterValue)
          .eq("year", year)
          .eq("week_number", weekNumber)
          .eq("month", month)
          .limit(1)
          .maybeSingle();

        if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

        const mutation = existing?.id
          ? supabase.from("weekly_menus").update(payload).eq("id", existing.id)
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
        isSavingRef.current = false;
        hasLocalChangesRef.current = false;
        pendingDaysRef.current = null;
        return;
      }

      isSavingRef.current = false;

      // Check if a new save was queued while we were saving
      const queued = pendingDaysRef.current;
      pendingDaysRef.current = null;
      if (queued && !daysEqual(queued, lastSavedDaysRef.current)) {
        dataToSave = queued;
        // continue loop → save the queued data
      } else {
        hasLocalChangesRef.current = false;
        break;
      }
    }
  }, [session, referenceDate]);

  const save = useCallback((explicitDays?: DayPlan[]) => {
    if (!session) return;

    const dataToSave = explicitDays ?? days;
    if (!Array.isArray(dataToSave) || dataToSave.length === 0) return;
    if (daysEqual(dataToSave, lastSavedDaysRef.current)) return;

    hasLocalChangesRef.current = true;

    if (isSavingRef.current) {
      // Queue it — the save loop will pick it up after the current save finishes
      pendingDaysRef.current = dataToSave;
      return;
    }

    doSave(dataToSave);
  }, [days, session, doSave]);

  return {
    save,
    saveStatus,
    lastSaved,
    error,
    isSaving: saveStatus === "saving",
    isSaved: saveStatus === "saved",
    hasError: saveStatus === "error",
    hasLocalChangesRef,
  };
};
