import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import { fetchHouseholdScope } from "../../../lib/households";
import { Recipe, mapRecipe } from "../../recipes/types";

export const useRecipes = (session: Session | null) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipesError, setRecipesError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setRecipes([]);
      setRecipesError(null);
      setRecipesLoading(false);
      return;
    }

    let cancelled = false;
    const loadRecipes = async () => {
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

        if (!cancelled) {
          setRecipes((data ?? []).map(mapRecipe));
        }
      } catch (error) {
        if (cancelled) return;
        console.error("fetch recipes planner", error);
        setRecipesError("Impossible de charger tes recettes.");
      } finally {
        if (!cancelled) {
          setRecipesLoading(false);
        }
      }
    };

    loadRecipes();

    return () => {
      cancelled = true;
    };
  }, [session]);

  return {
    recipes,
    recipesLoading,
    recipesError,
  };
};
