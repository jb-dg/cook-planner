import { format, getISOWeek, getYear } from "date-fns";
import { fr } from "date-fns/locale";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/features/planner/hooks/useToast";
import { normalizeDays } from "@/features/planner/utils/helpers";
import type { DayPlan, MealKey } from "@/features/planner/utils/types";
import { mapRecipe, type Recipe } from "@/features/recipes/types";
import { fetchHouseholdScope, type HouseholdScope } from "@/lib/households";
import { supabase } from "@/lib/supabase";

import { planIngredientMerge, type MergeResult } from "../mergeIngredients";
import {
  ingredientsFromRecipe,
  mapShoppingListItem,
  type ShoppingListItem,
  type ShoppingListItemRow,
} from "../types";
import { useShoppingListRealtime } from "./useShoppingListRealtime";

const ITEMS_SELECT =
  "id,name,quantity,unit,is_checked,source,recipe_id,created_at";
const RECIPE_SELECT_FOR_PICKER =
  "id,title,duration,difficulty,servings,description,ingredients";

export const useShoppingListScreenState = () => {
  const { session } = useAuth();
  const { toast, showToast } = useToast();

  const [scope, setScope] = useState<HouseholdScope | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipePickerVisible, setRecipePickerVisible] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!session) {
      setScope(null);
      setItems([]);
      return;
    }

    setError(null);
    try {
      const nextScope = await fetchHouseholdScope(session.user.id);
      setScope(nextScope);
      const { data, error: fetchError } = await supabase
        .from("shopping_list_items")
        .select(ITEMS_SELECT)
        .eq(nextScope.filterColumn, nextScope.filterValue)
        .order("is_checked", { ascending: true })
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;
      setItems(
        ((data ?? []) as ShoppingListItemRow[]).map(mapShoppingListItem),
      );
    } catch (err) {
      console.error("fetch shopping list items", err);
      setError("Impossible de charger la liste de courses.");
    }
  }, [session]);

  const fetchRecipesForPicker = useCallback(async () => {
    if (!session) {
      setRecipes([]);
      return;
    }

    try {
      const nextScope = await fetchHouseholdScope(session.user.id);
      const { data, error: fetchError } = await supabase
        .from("recipes")
        .select(RECIPE_SELECT_FOR_PICKER)
        .eq(nextScope.filterColumn, nextScope.filterValue)
        .order("title", { ascending: true });

      if (fetchError) throw fetchError;
      setRecipes((data ?? []).map(mapRecipe));
    } catch (err) {
      console.error("fetch recipes for shopping list", err);
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      setRecipesLoading(false);
      setItems([]);
      setRecipes([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setRecipesLoading(true);

    Promise.all([fetchItems(), fetchRecipesForPicker()]).finally(() => {
      if (!cancelled) {
        setLoading(false);
        setRecipesLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [session, fetchItems, fetchRecipesForPicker]);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      fetchItems();
    }, [session, fetchItems]),
  );

  useShoppingListRealtime(session, scope, setItems);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.isChecked !== b.isChecked) return a.isChecked ? 1 : -1;
        return a.createdAt.localeCompare(b.createdAt);
      }),
    [items],
  );

  const checkedCount = useMemo(
    () => items.filter((item) => item.isChecked).length,
    [items],
  );

  const handleRefresh = useCallback(async () => {
    if (!session) return;
    setRefreshing(true);
    try {
      await fetchItems();
    } finally {
      setRefreshing(false);
    }
  }, [session, fetchItems]);

  const handleAddManualItem = useCallback(
    async (name: string, quantity: string, unit: string) => {
      const trimmedName = name.trim();
      if (!trimmedName || !scope || !session) return;

      try {
        const { data, error: insertError } = await supabase
          .from("shopping_list_items")
          .insert({
            household_id: scope.householdId,
            user_id: session.user.id,
            name: trimmedName,
            quantity: quantity.trim() || null,
            unit: unit.trim() || null,
            source: "manual",
          })
          .select(ITEMS_SELECT)
          .single();

        if (insertError) throw insertError;
        setItems((prev) => [
          ...prev,
          mapShoppingListItem(data as ShoppingListItemRow),
        ]);
      } catch (err) {
        console.error("add manual shopping list item", err);
        showToast("Impossible d'ajouter cet article.", "error");
      }
    },
    [scope, session, showToast],
  );

  const handleToggleChecked = useCallback(
    async (id: string) => {
      const target = items.find((item) => item.id === id);
      if (!target) return;
      const nextChecked = !target.isChecked;

      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isChecked: nextChecked } : item,
        ),
      );

      const { error: updateError } = await supabase
        .from("shopping_list_items")
        .update({ is_checked: nextChecked })
        .eq("id", id);

      if (updateError) {
        console.error("toggle shopping list item", updateError);
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isChecked: target.isChecked } : item,
          ),
        );
        showToast("Impossible de mettre à jour cet article.", "error");
      }
    },
    [items, showToast],
  );

  const handleDeleteItem = useCallback(
    async (id: string) => {
      const previous = items;
      setItems((prev) => prev.filter((item) => item.id !== id));

      const { error: deleteError } = await supabase
        .from("shopping_list_items")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("delete shopping list item", deleteError);
        setItems(previous);
        showToast("Impossible de supprimer cet article.", "error");
      }
    },
    [items, showToast],
  );

  const clearCheckedItems = useCallback(async () => {
    if (!scope) return;
    const previous = items;
    setItems((prev) => prev.filter((item) => !item.isChecked));

    const { error: deleteError } = await supabase
      .from("shopping_list_items")
      .delete()
      .eq(scope.filterColumn, scope.filterValue)
      .eq("is_checked", true);

    if (deleteError) {
      console.error("clear checked shopping list items", deleteError);
      setItems(previous);
      showToast("Impossible de vider les articles cochés.", "error");
    }
  }, [scope, items, showToast]);

  const handleClearChecked = useCallback(() => {
    if (!checkedCount) return;
    Alert.alert(
      "Vider les articles cochés",
      "Cette action est définitive. Continuer ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Vider", style: "destructive", onPress: clearCheckedItems },
      ],
    );
  }, [checkedCount, clearCheckedItems]);

  const applyMergePlan = useCallback(
    async (
      plan: MergeResult<ShoppingListItem>,
      source: "recipe" | "planner",
      recipeId: string | null,
    ) => {
      if (!scope || !session) return 0;

      for (const update of plan.updates) {
        const { error: updateError } = await supabase
          .from("shopping_list_items")
          .update({ quantity: update.nextQuantity })
          .eq("id", update.existing.id);
        if (updateError) throw updateError;
      }

      if (plan.inserts.length) {
        const { error: insertError } = await supabase
          .from("shopping_list_items")
          .insert(
            plan.inserts.map((ingredient) => ({
              household_id: scope.householdId,
              user_id: session.user.id,
              name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              source,
              recipe_id: recipeId,
            })),
          );
        if (insertError) throw insertError;
      }

      await fetchItems();
      return plan.updates.length + plan.inserts.length;
    },
    [scope, session, fetchItems],
  );

  const handleOpenAddFromRecipe = useCallback(() => {
    setRecipePickerVisible(true);
  }, []);

  const handleCloseAddFromRecipe = useCallback(() => {
    setRecipePickerVisible(false);
  }, []);

  const handleAddIngredientsFromRecipe = useCallback(
    async (recipe: Recipe) => {
      const incoming = ingredientsFromRecipe(recipe);
      if (!incoming.length) {
        showToast("Cette recette n'a pas d'ingrédients à ajouter.", "info");
        setRecipePickerVisible(false);
        return;
      }

      const plan = planIngredientMerge(items, incoming);
      try {
        await applyMergePlan(plan, "recipe", recipe.id);
        setRecipePickerVisible(false);
        showToast(`Ingrédients de « ${recipe.title} » ajoutés.`, "success");
      } catch (err) {
        console.error("add ingredients from recipe", err);
        showToast("Impossible d'ajouter les ingrédients.", "error");
      }
    },
    [items, applyMergePlan, showToast],
  );

  const handleGenerateFromWeek = useCallback(async () => {
    if (!session || !scope || generating) return;
    setGenerating(true);
    try {
      const referenceDate = new Date();
      const weekNumber = getISOWeek(referenceDate);
      const month = format(referenceDate, "MMMM", { locale: fr });
      const year = getYear(referenceDate);

      const { data, error: weekError } = await supabase
        .from("weekly_menus")
        .select("days")
        .eq(scope.filterColumn, scope.filterValue)
        .eq("year", year)
        .eq("week_number", weekNumber)
        .eq("month", month)
        .limit(1)
        .maybeSingle();

      if (weekError) throw weekError;

      const days = normalizeDays(data?.days as DayPlan[] | undefined);
      const recipesByTitle = new Map<string, Recipe>();
      for (const recipe of recipes) {
        const key = recipe.title.trim().toLowerCase();
        if (key && !recipesByTitle.has(key)) {
          recipesByTitle.set(key, recipe);
        }
      }

      const meals: MealKey[] = ["lunch", "dinner"];
      const matchedRecipes: Recipe[] = [];
      for (const day of days) {
        for (const meal of meals) {
          const title = day[meal]?.recipe?.trim();
          if (!title) continue;
          const match = recipesByTitle.get(title.toLowerCase());
          if (match) matchedRecipes.push(match);
        }
      }

      if (!matchedRecipes.length) {
        showToast(
          "Aucune recette du planning ne correspond à ton livre de recettes.",
          "info",
        );
        return;
      }

      const incoming = matchedRecipes.flatMap((recipe) =>
        ingredientsFromRecipe(recipe),
      );
      const plan = planIngredientMerge(items, incoming);
      const count = await applyMergePlan(plan, "planner", null);

      if (!count) {
        showToast("La liste contient déjà tous ces ingrédients.", "info");
      } else {
        showToast(
          `${count} ingrédient${count > 1 ? "s" : ""} ajoutés depuis cette semaine.`,
          "success",
        );
      }
    } catch (err) {
      console.error("generate shopping list from week", err);
      showToast("Impossible de générer la liste depuis le planning.", "error");
    } finally {
      setGenerating(false);
    }
  }, [session, scope, generating, recipes, items, applyMergePlan, showToast]);

  return {
    loading,
    recipesLoading,
    refreshing,
    generating,
    error,
    items: sortedItems,
    checkedCount,
    recipes,
    recipePickerVisible,
    toast,
    handleRefresh,
    handleAddManualItem,
    handleToggleChecked,
    handleDeleteItem,
    handleClearChecked,
    handleOpenAddFromRecipe,
    handleCloseAddFromRecipe,
    handleAddIngredientsFromRecipe,
    handleGenerateFromWeek,
  };
};
