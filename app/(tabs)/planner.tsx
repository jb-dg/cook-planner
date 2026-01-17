import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { addMonths, format, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "../../contexts/AuthContext";
import { Recipe } from "../../features/recipes/types";
import { colors, radii, shadows, spacing } from "../../theme/design";
import { MealKey, RecipePickerTarget, ViewMode } from "../../features/planner/utils/types";
import { usePlannerData } from "../../features/planner/hooks/usePlannerData";
import { useRecipes } from "../../features/planner/hooks/useRecipes";
import { useWeekNavigation } from "../../features/planner/hooks/useWeekNavigation";
import { useToast } from "../../features/planner/hooks/useToast";
import { useAutoSave } from "../../features/planner/hooks/useAutoSave";
import { PlannerHeader } from "../../features/planner/components/PlannerHeader";
import { WeekProgressCard } from "../../features/planner/components/WeekProgressCard";
import { DayGridSelector } from "../../features/planner/components/DayGridSelector";
import { FocusView } from "../../features/planner/components/FocusView";
import { ListView } from "../../features/planner/components/ListView";
import { WeekPickerModal } from "../../features/planner/components/WeekPickerModal";
import { RecipePickerModal } from "../../features/planner/components/RecipePickerModal";
import { Toast } from "../../features/planner/components/Toast";
import { styles as sharedStyles } from "../../features/planner/styles";

export default function PlannerScreen() {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();

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
  const { days, setDays, syncing, weekNumber } =
    usePlannerData(session, referenceDate);
  const { recipes, recipesLoading, recipesError } = useRecipes(session);

  // Auto-save
  const { saveStatus, lastSaved, error: saveError, isSaving } = useAutoSave(
    days,
    session,
    referenceDate,
    true, // enabled
    2000  // debounce 2s
  );

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
            referenceDate.getDate() + index
          ),
          "EEEE d MMM",
          { locale: fr }
        ),
      })),
    [days, referenceDate]
  );

  const progress = useMemo(() => {
    const trackedMeals: MealKey[] = ["lunch", "dinner"];
    const filled = days.reduce((acc, day) => {
      return (
        acc +
        trackedMeals.filter(
          (slot) =>
            !!(day as Record<MealKey, { recipe?: string } | undefined>)[slot]
              ?.recipe?.trim()
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
    [insets.bottom]
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
    handleDayChange(
      recipePickerTarget.dayIndex,
      recipePickerTarget.meal,
      recipe.title
    );
    closeRecipePicker();
    showToast("Recette ajoutée au planning.", "success");
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
      addMonths(current, direction === "next" ? 1 : -1)
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[
          sharedStyles.container,
          { paddingBottom: spacing.screen + insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PlannerHeader
          weekRangeLabel={weekRangeLabel}
          viewMode={viewMode}
          saveStatus={saveStatus}
          lastSaved={lastSaved}
          saveError={saveError}
          onWeekPickerOpen={openWeekPicker}
          onViewModeToggle={() =>
            setViewMode((prev) => (prev === "list" ? "focus" : "list"))
          }
        />

        {viewMode === "focus" && (
          <>
            <WeekProgressCard
              weekNumber={weekNumber}
              selectedDayLabel={selectedDayLabel}
              progress={progress}
              onNavigate={handleNavigate}
              onGoToToday={handleGoToToday}
            />
            <DayGridSelector
              referenceDate={referenceDate}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
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
            />
            <Pressable
              style={styles.listButton}
              onPress={() => setViewMode("list")}
              accessibilityRole="button"
              accessibilityLabel="Voir la semaine en liste"
            >
              <Feather name="list" size={16} color={colors.accent} />
              <Text style={styles.listButtonText}>
                Voir la semaine en liste
              </Text>
            </Pressable>
          </>
        )}

        {viewMode === "list" && (
          <ListView
            days={days}
            referenceDate={referenceDate}
            selectedDate={selectedDate}
            syncing={syncing}
            saving={isSaving}
            onDayChange={handleDayChange}
            onOpenRecipePicker={openRecipePicker}
            onSelectDate={setSelectedDate}
          />
        )}
      </ScrollView>

      <WeekPickerModal
        visible={weekPickerVisible}
        selectedDate={selectedDate}
        referenceDate={referenceDate}
        calendarMonth={calendarMonth}
        timeframe={timeframe}
        days={days}
        sheetPaddingBottom={sheetPaddingBottom}
        onClose={closeWeekPicker}
        onSelectTimeframe={handleSelectTimeframe}
        onMonthNavigate={handleMonthNavigate}
        onSelectDate={setSelectedDate}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.base * 0.6,
    paddingVertical: spacing.base * 1.1,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  listButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
});
