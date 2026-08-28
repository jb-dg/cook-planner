import {
  addDays,
  differenceInCalendarDays,
  format,
  getISOWeek,
  getYear,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { mapRecipe, type Recipe } from "@/features/recipes/types";
import { fetchHouseholdScope } from "@/lib/households";
import { ensureProfileRecord } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

import type { MissingSlot, PlanProgress, TodayMenu } from "../types";

const RECENT_RECIPES_LIMIT = 4;
const RECIPE_SELECT =
  "id,title,duration,difficulty,servings,description,ingredients,steps,source_url,image_urls,cover_image_url";

export const useHomeScreenState = () => {
  const { session } = useAuth();

  const weekStart = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    [],
  );
  const weekNumber = getISOWeek(weekStart);
  const weekLabel = `${format(weekStart, "d MMM", { locale: fr })} – ${format(
    addDays(weekStart, 6),
    "d MMM",
    { locale: fr },
  )}`;
  const todayLabel = useMemo(() => {
    const raw = format(new Date(), "EEEE d MMMM", { locale: fr });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, []);
  const todayIndex = Math.min(
    6,
    Math.max(0, differenceInCalendarDays(new Date(), weekStart)),
  );

  const [displayName, setDisplayName] = useState(
    session?.user.email?.split("@")[0] ?? "Chef",
  );

  const [planProgress, setPlanProgress] = useState<PlanProgress>({
    percent: 0,
    filled: 0,
    total: 14,
  });
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  const [todayMenu, setTodayMenu] = useState<TodayMenu>({ lunch: "", dinner: "" });
  const [nextMissingSlot, setNextMissingSlot] = useState<MissingSlot>(null);

  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [recentRecipesLoading, setRecentRecipesLoading] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const [shoppingRemaining, setShoppingRemaining] = useState(0);
  const [shoppingLoading, setShoppingLoading] = useState(false);

  const loadDisplayName = useCallback(async () => {
    if (!session) return;
    try {
      const pseudo = await ensureProfileRecord(session.user);
      setDisplayName(pseudo);
    } catch (error) {
      console.error("home load display name", error);
    }
  }, [session]);

  const loadProgress = useCallback(
    async (cancelRef?: { cancelled: boolean }) => {
      if (!session) {
        setPlanProgress({ percent: 0, filled: 0, total: 14 });
        setNextMissingSlot(null);
        return;
      }

      setProgressLoading(true);
      setProgressError(null);
      try {
        const scope = await fetchHouseholdScope(session.user.id);
        const wn = getISOWeek(weekStart);
        const month = format(weekStart, "MMMM", { locale: fr });
        const year = getYear(weekStart);

        const { data, error } = await supabase
          .from("weekly_menus")
          .select("days")
          .eq(scope.filterColumn, scope.filterValue)
          .eq("year", year)
          .eq("week_number", wn)
          .eq("month", month)
          .limit(1)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        const slots: ("lunch" | "dinner")[] = ["lunch", "dinner"];
        const days =
          (data?.days as
            | { lunch?: { recipe?: string }; dinner?: { recipe?: string } }[]
            | undefined) ?? [];
        const total = (days.length || 7) * slots.length;
        const filled = days.reduce((acc, day) => {
          return (
            acc + slots.filter((slot) => !!day?.[slot]?.recipe?.trim()).length
          );
        }, 0);
        const percent = total
          ? Math.min(100, Math.round((filled / total) * 100))
          : 0;

        const today = days[todayIndex];

        // Search from today onward (wrapping) rather than from Monday, so
        // this points at the next actionable gap instead of a day that's
        // already past.
        const dayCount = days.length || 7;
        let missingSlot: MissingSlot = null;
        for (let offset = 0; offset < dayCount; offset += 1) {
          const dayIndex = (todayIndex + offset) % dayCount;
          const day = days[dayIndex];
          if (!day?.lunch?.recipe?.trim()) {
            missingSlot = { date: addDays(weekStart, dayIndex), meal: "lunch" };
            break;
          }
          if (!day?.dinner?.recipe?.trim()) {
            missingSlot = { date: addDays(weekStart, dayIndex), meal: "dinner" };
            break;
          }
        }

        if (!cancelRef?.cancelled) {
          setPlanProgress({ percent, filled, total });
          setTodayMenu({
            lunch: today?.lunch?.recipe?.trim() ?? "",
            dinner: today?.dinner?.recipe?.trim() ?? "",
          });
          setNextMissingSlot(missingSlot);
        }
      } catch (error) {
        console.error("home fetch progress", error);
        if (!cancelRef?.cancelled) {
          setProgressError("Impossible de charger le planning.");
          setPlanProgress((prev) => ({ ...prev, percent: 0 }));
          setNextMissingSlot(null);
        }
      } finally {
        if (!cancelRef?.cancelled) {
          setProgressLoading(false);
        }
      }
    },
    [session, weekStart, todayIndex],
  );

  const loadRecentRecipes = useCallback(async () => {
    if (!session) {
      setRecentRecipes([]);
      return;
    }
    setRecentRecipesLoading(true);
    try {
      const scope = await fetchHouseholdScope(session.user.id);
      const { data, error } = await supabase
        .from("recipes")
        .select(RECIPE_SELECT)
        .eq(scope.filterColumn, scope.filterValue)
        .order("created_at", { ascending: false })
        .limit(RECENT_RECIPES_LIMIT);

      if (error) throw error;

      setRecentRecipes((data ?? []).map(mapRecipe));
    } catch (error) {
      console.error("home fetch recent recipes", error);
    } finally {
      setRecentRecipesLoading(false);
    }
  }, [session]);

  const loadShoppingRemaining = useCallback(async () => {
    if (!session) {
      setShoppingRemaining(0);
      return;
    }
    setShoppingLoading(true);
    try {
      const scope = await fetchHouseholdScope(session.user.id);
      const { count, error } = await supabase
        .from("shopping_list_items")
        .select("id", { count: "exact", head: true })
        .eq(scope.filterColumn, scope.filterValue)
        .eq("is_checked", false);

      if (error) throw error;
      setShoppingRemaining(count ?? 0);
    } catch (error) {
      console.error("home fetch shopping remaining", error);
    } finally {
      setShoppingLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadDisplayName();
  }, [loadDisplayName]);

  useEffect(() => {
    let cancelled = false;
    loadProgress({ cancelled });
    return () => {
      cancelled = true;
    };
  }, [loadProgress]);

  useFocusEffect(
    useCallback(() => {
      const cancelRef = { cancelled: false };
      loadProgress(cancelRef);
      loadRecentRecipes();
      loadShoppingRemaining();
      return () => {
        cancelRef.cancelled = true;
      };
    }, [loadProgress, loadRecentRecipes, loadShoppingRemaining]),
  );

  const missingMeals = Math.max(planProgress.total - planProgress.filled, 0);

  const selectedRecipe = useMemo(
    () => recentRecipes.find((recipe) => recipe.id === selectedRecipeId) ?? null,
    [recentRecipes, selectedRecipeId],
  );

  const handleOpenRecipe = useCallback((recipeId: string) => {
    setSelectedRecipeId(recipeId);
  }, []);

  const handleCloseRecipeModal = useCallback(() => {
    setSelectedRecipeId(null);
  }, []);

  return {
    weekNumber,
    weekLabel,
    todayLabel,
    todayMenu,
    displayName,
    planProgress,
    progressLoading,
    progressError,
    missingMeals,
    nextMissingSlot,
    recentRecipes,
    recentRecipesLoading,
    selectedRecipe,
    handleOpenRecipe,
    handleCloseRecipeModal,
    shoppingRemaining,
    shoppingLoading,
  };
};
