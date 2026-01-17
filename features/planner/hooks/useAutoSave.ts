import { useEffect, useRef, useState } from "react";
import { format, getISOWeek, getYear } from "date-fns";
import { fr } from "date-fns/locale";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import { fetchHouseholdScope } from "../../../lib/households";
import { DayPlan } from "../utils/types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export const useAutoSave = (
  days: DayPlan[],
  session: Session | null,
  referenceDate: Date,
  enabled: boolean = true,
  debounceMs: number = 2000
) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousDaysRef = useRef<string>(JSON.stringify(days));
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !session) {
      return;
    }

    const currentDays = JSON.stringify(days);
    const hasChanged = currentDays !== previousDaysRef.current;

    if (!hasChanged || isSavingRef.current) {
      return;
    }

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set saving status immediately to show user
    setSaveStatus("saving");

    // Debounce save
    saveTimeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;

      isSavingRef.current = true;

      try {
        const weekNumber = getISOWeek(referenceDate);
        const month = format(referenceDate, "MMMM", { locale: fr });
        const year = getYear(referenceDate);

        const scope = await fetchHouseholdScope(session.user.id);

        // Sanitize days
        const sanitizedDays = days.map((day) => {
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

        // Check if menu exists
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

          if (error && error.code !== "PGRST116") {
            throw error;
          }

          if (data?.id) {
            existingMenu = data;
            break;
          }
        }

        // Upsert
        const mutation = existingMenu?.id
          ? supabase
              .from("weekly_menus")
              .update(payload)
              .eq("id", existingMenu.id)
          : supabase.from("weekly_menus").insert(payload);

        const { error: saveError } = await mutation;

        if (saveError) {
          throw saveError;
        }

        // Success
        previousDaysRef.current = currentDays;
        setSaveStatus("saved");
        setLastSaved(new Date());
        setError(null);

        // Reset to idle after 2s
        setTimeout(() => {
          setSaveStatus("idle");
        }, 2000);
      } catch (err) {
        console.error("Auto-save error:", err);
        setSaveStatus("error");
        setError("Erreur lors de la sauvegarde");

        // Retry after error
        setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);
      } finally {
        isSavingRef.current = false;
      }
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [days, session, referenceDate, enabled, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    lastSaved,
    error,
    isSaving: saveStatus === "saving",
    isSaved: saveStatus === "saved",
    hasError: saveStatus === "error",
  };
};
