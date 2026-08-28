import { useRouter } from "expo-router";

import RecentRecipesSection from "./RecentRecipesSection";
import ShoppingSummaryCard from "./ShoppingSummaryCard";
import WeekPlanCard from "./WeekPlanCard";
import type { useHomeScreenState } from "../hooks/useHomeScreenState";
import { buildPlannerRoute } from "../utils/buildPlannerRoute";

type HomeState = ReturnType<typeof useHomeScreenState>;

type Props = {
  state: HomeState;
};

// Phone: single stacked column, led by the week's planning status (the
// thing most likely to need action) with today's menu right underneath.
// Recent recipes close the page rather than sitting mid-flow, since it's
// browsing material rather than something actionable "right now" like the
// card above it.
export default function HomeMobileContent({ state }: Props) {
  const router = useRouter();

  return (
    <>
      <WeekPlanCard
        todayLabel={state.todayLabel}
        todayMenu={state.todayMenu}
        progress={state.planProgress}
        loading={state.progressLoading}
        error={state.progressError}
        missingMeals={state.missingMeals}
        onPressToday={() => router.push("/planner")}
        onPressMissing={() => router.push(buildPlannerRoute(state.nextMissingSlot))}
      />

      <ShoppingSummaryCard
        remaining={state.shoppingRemaining}
        loading={state.shoppingLoading}
      />

      <RecentRecipesSection
        recipes={state.recentRecipes}
        loading={state.recentRecipesLoading}
        onSelectRecipe={state.handleOpenRecipe}
      />
    </>
  );
}
