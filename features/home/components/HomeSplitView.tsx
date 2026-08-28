import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import HomeHeader from "./HomeHeader";
import RecentRecipesSection from "./RecentRecipesSection";
import ShoppingSummaryCard from "./ShoppingSummaryCard";
import WeekPlanCard from "./WeekPlanCard";
import type { useHomeScreenState } from "../hooks/useHomeScreenState";
import { styles } from "../screens/homeScreenStyles";
import { buildPlannerRoute } from "../utils/buildPlannerRoute";

type HomeState = ReturnType<typeof useHomeScreenState>;

type Props = {
  state: HomeState;
};

// iPad (portrait and landscape): a fixed left panel + scrollable right
// content — the same shell as Planning/Recipes/Courses/Profil's split
// views, rather than the stacked-grid arrangement tried before. The panel
// groups identity + status (greeting, week plan card, shopping); the
// content pane is browsing material (recent recipes) rather than
// something actionable "right now" like the panel's own cards.
export default function HomeSplitView({ state }: Props) {
  const router = useRouter();

  return (
    <View style={styles.splitRoot}>
      <View style={styles.splitPanel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.splitPanelContent}
        >
          <HomeHeader weekNumber={state.weekNumber} weekLabel={state.weekLabel} />

          <WeekPlanCard
            todayLabel={state.todayLabel}
            todayMenu={state.todayMenu}
            progress={state.planProgress}
            loading={state.progressLoading}
            error={state.progressError}
            missingMeals={state.missingMeals}
            onPressToday={() => router.push("/planner")}
            onPressMissing={() =>
              router.push(buildPlannerRoute(state.nextMissingSlot))
            }
          />

          <ShoppingSummaryCard
            remaining={state.shoppingRemaining}
            loading={state.shoppingLoading}
          />
        </ScrollView>
      </View>

      <View style={styles.splitDetail}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.splitDetailContent}
        >
          <RecentRecipesSection
            recipes={state.recentRecipes}
            loading={state.recentRecipesLoading}
            onSelectRecipe={state.handleOpenRecipe}
          />
        </ScrollView>
      </View>
    </View>
  );
}
