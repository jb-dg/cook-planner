import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import HomeHeader from "./HomeHeader";
import QuickLinksRow from "./QuickLinksRow";
import RecentRecipesSection from "./RecentRecipesSection";
import ShoppingSummaryCard from "./ShoppingSummaryCard";
import TodayMenuCard from "./TodayMenuCard";
import WeekProgressCard from "./WeekProgressCard";
import type { useHomeScreenState } from "../hooks/useHomeScreenState";
import { styles } from "../screens/homeScreenStyles";

type HomeState = ReturnType<typeof useHomeScreenState>;

type Props = {
  state: HomeState;
};

// iPad (portrait and landscape): a fixed left panel + scrollable right
// content — the same shell as Planning/Recipes/Courses/Profil's split
// views, rather than the stacked-grid arrangement tried before. The panel
// groups identity + status (greeting, week progress, shortcuts, shopping);
// the content pane is "what to cook" (today's menu, then recent recipes).
export default function HomeSplitView({ state }: Props) {
  const router = useRouter();

  return (
    <View style={styles.splitRoot}>
      <View style={styles.splitPanel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.splitPanelContent}
        >
          <HomeHeader
            weekNumber={state.weekNumber}
            weekLabel={state.weekLabel}
            displayName={state.displayName}
          />

          <WeekProgressCard
            progress={state.planProgress}
            loading={state.progressLoading}
            error={state.progressError}
            missingMeals={state.missingMeals}
            onPress={() => router.push("/planner")}
          />

          <QuickLinksRow direction="column" />

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
          <TodayMenuCard
            label={state.todayLabel}
            menu={state.todayMenu}
            loading={state.progressLoading}
            onPress={() => router.push("/planner")}
          />

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
