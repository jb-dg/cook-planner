import { Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import RecipeViewModal from "@/features/recipes/components/RecipeViewModal";

import HomeHeader from "../components/HomeHeader";
import HomeMobileContent from "../components/HomeMobileContent";
import HomeSplitView from "../components/HomeSplitView";
import { useHomeScreenState } from "../hooks/useHomeScreenState";
import { styles } from "./homeScreenStyles";

const isIpad = Platform.OS === "ios" && Platform.isPad;

export default function HomeScreenView() {
  const state = useHomeScreenState();

  const recipeModal = (
    <RecipeViewModal
      visible={!!state.selectedRecipe}
      recipe={state.selectedRecipe}
      onClose={state.handleCloseRecipeModal}
    />
  );

  if (isIpad) {
    // Two independently scrollable panes, not one shared vertical scroll —
    // same shell as the other tabs' iPad split views.
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <HomeSplitView state={state} />
        {recipeModal}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          weekNumber={state.weekNumber}
          weekLabel={state.weekLabel}
          displayName={state.displayName}
        />

        <HomeMobileContent state={state} />
      </ScrollView>
      {recipeModal}
    </SafeAreaView>
  );
}
