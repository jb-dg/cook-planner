import { useRouter } from "expo-router";

import QuickLinksRow from "./QuickLinksRow";
import RecentRecipesSection from "./RecentRecipesSection";
import ShoppingSummaryCard from "./ShoppingSummaryCard";
import TodayMenuCard from "./TodayMenuCard";
import WeekProgressCard from "./WeekProgressCard";
import type { useHomeScreenState } from "../hooks/useHomeScreenState";

type HomeState = ReturnType<typeof useHomeScreenState>;

type Props = {
  state: HomeState;
};

// Phone: single stacked column, led by "what am I eating today" rather
// than a week-percent stat — that's the answer this screen exists to give.
// Recent recipes close the page rather than sitting mid-flow, since it's
// browsing material rather than something actionable "right now" like the
// cards above it.
export default function HomeMobileContent({ state }: Props) {
  const router = useRouter();

  return (
    <>
      <TodayMenuCard
        label={state.todayLabel}
        menu={state.todayMenu}
        loading={state.progressLoading}
        onPress={() => router.push("/planner")}
      />

      <WeekProgressCard
        progress={state.planProgress}
        loading={state.progressLoading}
        error={state.progressError}
        missingMeals={state.missingMeals}
        onPress={() => router.push("/planner")}
      />

      <QuickLinksRow />

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
