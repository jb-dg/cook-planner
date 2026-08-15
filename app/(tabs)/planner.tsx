import { Feather } from "@expo/vector-icons";
import { addMonths, format, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useAuth } from "../../contexts/AuthContext";
import { DayGridSelector } from "../../features/planner/components/DayGridSelector";
import { FocusView } from "../../features/planner/components/FocusView";
import { ListView } from "../../features/planner/components/ListView";
import { PlannerHeader } from "../../features/planner/components/PlannerHeader";
import { RecipePickerModal } from "../../features/planner/components/RecipePickerModal";
import { Toast } from "../../features/planner/components/Toast";
import { WeekFocusList } from "../../features/planner/components/WeekFocusList";
import { WeekPickerModal } from "../../features/planner/components/WeekPickerModal";
import { useAutoSave } from "../../features/planner/hooks/useAutoSave";
import { usePlannerData } from "../../features/planner/hooks/usePlannerData";
import { usePlannerRealtime } from "../../features/planner/hooks/usePlannerRealtime";
import { useRecipes } from "../../features/planner/hooks/useRecipes";
import { useToast } from "../../features/planner/hooks/useToast";
import { useWeekNavigation } from "../../features/planner/hooks/useWeekNavigation";
import { styles as sharedStyles } from "../../features/planner/styles";
import {
  MealKey,
  RecipePickerTarget,
  ViewMode,
} from "../../features/planner/utils/types";
import { Recipe } from "../../features/recipes/types";
import { colors, spacing } from "../../theme/design";
import PhysicalButtonAnimated from "../../components/PhysicalButtonAnimated";

export default function PlannerScreen() {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width, height } = useWindowDimensions();
  // iPad landscape only: wide enough to lay the day's meals side by side
  // and center the content in a comfortable reading width.
  const isIpadLandscape =
    Platform.OS === "ios" && Platform.isPad && width > height;

  // Navigation
  const {
    selectedDate,
    setSelectedDate,
    referenceDate,
    calendarMonth,
    setCalendarMonth,
    timeframe,
    weekRangeLabel,
    selectedDayLabel,
    handleNavigate,
    handleSelectTimeframe,
    handleGoToToday,
  } = useWeekNavigation();

  // Data
  const { days, setDays, syncing, weekNumber } = usePlannerData(
    session,
    referenceDate,
  );
  const { recipes, recipesLoading, recipesError } = useRecipes(session);

  // Save — triggered on blur or recipe selection
  const {
    save,
    saveStatus,
    lastSaved,
    error: saveError,
    isSaving,
    hasLocalChangesRef,
  } = useAutoSave(days, session, referenceDate);

  // Real-time sync: apply updates from other household members when no local edits pending
  usePlannerRealtime(session, referenceDate, setDays, hasLocalChangesRef);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>("focus");
  const [weekPickerVisible, setWeekPickerVisible] = useState(false);
  const [recipePickerTarget, setRecipePickerTarget] =
    useState<RecipePickerTarget | null>(null);
  const { toast, showToast } = useToast();

  const weekDays = useMemo(
    () =>
      days.map((item, index) => ({
        ...item,
        date: format(
          new Date(
            referenceDate.getFullYear(),
            referenceDate.getMonth(),
            referenceDate.getDate() + index,
          ),
          "EEEE d MMM",
          { locale: fr },
        ),
      })),
    [days, referenceDate],
  );

  const progress = useMemo(() => {
    const trackedMeals: MealKey[] = ["lunch", "dinner"];
    const filled = days.reduce((acc, day) => {
      return (
        acc +
        trackedMeals.filter(
          (slot) =>
            !!(day as Record<MealKey, { recipe?: string } | undefined>)[
              slot
            ]?.recipe?.trim(),
        ).length
      );
    }, 0);
    const total = days.length * trackedMeals.length || 1;
    return {
      filled,
      total,
      percent: Math.min(100, Math.round((filled / total) * 100)),
    };
  }, [days]);

  const sheetPaddingBottom = useMemo(
    () => spacing.card + Math.max(insets.bottom, 12),
    [insets.bottom],
  );

  const handleDayChange = (index: number, meal: MealKey, value: string) => {
    setDays((prev) => {
      const next = [...prev];
      const mealState = next[index]?.[meal] ?? { recipe: "" };
      next[index] = {
        ...next[index],
        [meal]: { ...mealState, recipe: value },
      };
      return next;
    });
  };

  const openRecipePicker = (dayIndex: number, meal: MealKey) => {
    setRecipePickerTarget({ dayIndex, meal });
  };

  const closeRecipePicker = () => {
    setRecipePickerTarget(null);
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    if (!recipePickerTarget) return;
    const { dayIndex, meal } = recipePickerTarget;

    // Compute new days synchronously so we can pass them directly to save
    const newDays = days.map((d, i) => {
      if (i !== dayIndex) return d;
      const mealState = d[meal] ?? { recipe: "" };
      return { ...d, [meal]: { ...mealState, recipe: recipe.title } };
    });

    setDays(newDays);
    closeRecipePicker();
    showToast("Recette ajoutée au planning.", "success");
    save(newDays);
  };

  const openWeekPicker = () => {
    setWeekPickerVisible(true);
    setCalendarMonth(startOfMonth(selectedDate));
  };

  const closeWeekPicker = () => {
    setWeekPickerVisible(false);
  };

  const handleMonthNavigate = (direction: "prev" | "next") => {
    setCalendarMonth((current) =>
      addMonths(current, direction === "next" ? 1 : -1),
    );
  };

  const handleSelectDay = (date: Date) => {
    setSelectedDate(date);
    setViewMode("focus");
  };

  const dayNavProps =
    viewMode === "focus"
      ? { selectedDayLabel, progress, onGoToToday: handleGoToToday }
      : undefined;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            sharedStyles.container,
            isIpadLandscape && styles.ipadContainer,
            {
              // The tab bar floats (position: absolute) above the screen edge by an
              // extra safe-area-driven offset that useBottomTabBarHeight() doesn't
              // report — Math.max guards against that value coming back smaller
              // than the tab bar's own height on some devices.
              paddingBottom: Math.max(tabBarHeight, 68) + insets.bottom + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <PlannerHeader
            weekNumber={weekNumber}
            weekRangeLabel={weekRangeLabel}
            viewMode={viewMode}
            saveStatus={saveStatus}
            lastSaved={lastSaved}
            saveError={saveError}
            onWeekPickerOpen={openWeekPicker}
            onNavigateWeek={handleNavigate}
            onSetViewMode={setViewMode}
            // No single "selected day" on iPad — the whole week is on
            // screen at once, so there's nothing for the day card to show,
            // and nothing to toggle between.
            dayNav={isIpadLandscape ? undefined : dayNavProps}
            showViewToggle={!isIpadLandscape}
          />

          {isIpadLandscape ? (
            <WeekFocusList
              days={days}
              referenceDate={referenceDate}
              session={session}
              recipesLength={recipes.length}
              syncing={syncing}
              saving={isSaving}
              recipesLoading={recipesLoading}
              onDayChange={handleDayChange}
              onOpenRecipePicker={openRecipePicker}
              onBlur={save}
            />
          ) : viewMode === "focus" ? (
            <>
              <DayGridSelector
                referenceDate={referenceDate}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                days={days}
              />
              <FocusView
                days={days}
                referenceDate={referenceDate}
                selectedDate={selectedDate}
                session={session}
                recipesLength={recipes.length}
                syncing={syncing}
                saving={isSaving}
                recipesLoading={recipesLoading}
                onDayChange={handleDayChange}
                onOpenRecipePicker={openRecipePicker}
                onBlur={save}
              />
            </>
          ) : (
            <ListView
              days={days}
              referenceDate={referenceDate}
              selectedDate={selectedDate}
              onSelectDay={handleSelectDay}
            />
          )}

          {!isIpadLandscape && (
            <PhysicalButtonAnimated
              variant="primary"
              borderRadius={20}
              onPress={() =>
                setViewMode((prev) => (prev === "focus" ? "list" : "focus"))
              }
              innerStyle={styles.listButtonInner}
              accessibilityRole="button"
              accessibilityLabel={
                viewMode === "focus"
                  ? "Voir la semaine en liste"
                  : "Revenir à la vue du jour"
              }
            >
              <Feather name="list" size={18} color="#FFFFFF" />
              <Text style={styles.listButtonText}>
                {viewMode === "focus"
                  ? "Voir la semaine en liste"
                  : "Revenir à la vue du jour"}
              </Text>
            </PhysicalButtonAnimated>
          )}
        </ScrollView>

        <WeekPickerModal
          visible={weekPickerVisible}
          selectedDate={selectedDate}
          referenceDate={referenceDate}
          calendarMonth={calendarMonth}
          timeframe={timeframe}
          days={days}
          onClose={closeWeekPicker}
          onSelectTimeframe={handleSelectTimeframe}
          onMonthNavigate={handleMonthNavigate}
          onSelectDate={handleSelectDay}
          setCalendarMonth={setCalendarMonth}
        />

        <RecipePickerModal
          visible={!!recipePickerTarget}
          session={session}
          target={recipePickerTarget}
          days={days}
          weekDays={weekDays}
          recipes={recipes}
          recipesLoading={recipesLoading}
          recipesError={recipesError}
          sheetPaddingBottom={sheetPaddingBottom}
          onClose={closeRecipePicker}
          onSelectRecipe={handleSelectRecipe}
          onDayChange={handleDayChange}
        />

        {toast && <Toast toast={toast} />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listButtonInner: {
    flexDirection: "row",
    gap: spacing.base * 0.6,
  },
  listButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 17,
  },
  // Mirrors weatly-web's wide `container` (maxWidth, centered) — keeps the
  // single content column from stretching edge-to-edge on large iPads.
  ipadContainer: {
    maxWidth: 880,
    width: "100%",
    alignSelf: "center",
  },
});
