import { DayPlan } from "./types";
import { DEFAULT_MENU } from "./constants";

export const normalizeDays = (value?: DayPlan[] | null): DayPlan[] => {
  if (!value || value.length === 0) {
    return DEFAULT_MENU;
  }

  const ensureMeal = (
    source: { recipe?: string } | null | undefined,
    fallback: string
  ) => ({
    recipe: source?.recipe ?? fallback,
  });

  return DEFAULT_MENU.map((template) => {
    const match = value.find((item) => item.day === template.day) as
      | DayPlan
      | { day: string; recipe?: string; prep?: string }
      | undefined;

    if (!match) {
      return template;
    }

    // Support ancien format (recipe/prep) en le basculant sur le dîner pour ne rien perdre.
    if (!("lunch" in match) || !("dinner" in match)) {
      return {
        ...template,
        lunch: template.lunch,
        dinner: {
          recipe: match.recipe ?? template.dinner.recipe,
        },
      };
    }

    return {
      ...template,
      lunch: ensureMeal(
        (match.lunch as { recipe?: string } | null | undefined) ?? null,
        template.lunch.recipe
      ),
      dinner: ensureMeal(
        (match.dinner as { recipe?: string } | null | undefined) ?? null,
        template.dinner.recipe
      ),
    };
  });
};
