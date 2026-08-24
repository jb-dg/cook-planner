import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import { fetchHouseholdScope } from "../../../lib/households";
import { Recipe, mapRecipe } from "../../recipes/types";

export const useRecipes = (session: Session | null) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipesError, setRecipesError] = useState<string | null>(null);

  const loadRecipes = useCallback(async () => {
    if (!session) {
      setRecipes([]);
      setRecipesError(null);
      setRecipesLoading(false);
      return;
    }

    setRecipesLoading(true);
    setRecipesError(null);
    try {
      const scope = await fetchHouseholdScope(session.user.id);
      const { data, error } = await supabase
        .from("recipes")
        .select("id,title,duration,difficulty,servings,description")
        .eq(scope.filterColumn, scope.filterValue)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setRecipes((data ?? []).map(mapRecipe));
    } catch (error) {
      console.error("fetch recipes planner", error);
      setRecipesError("Impossible de charger tes recettes.");
    } finally {
      setRecipesLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Recipes created/edited from the "Mes recettes" tab live in that
  // screen's own state — without refetching on focus, coming back to the
  // planner after adding a recipe still showed the stale list until the
  // app reloaded.
  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      loadRecipes();
    }, [session, loadRecipes]),
  );

  return {
    recipes,
    recipesLoading,
    recipesError,
  };
};
