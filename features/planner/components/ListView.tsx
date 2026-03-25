import { Feather } from "@expo/vector-icons";
import { Session } from "@supabase/supabase-js";
import { addDays, format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { spacing } from "../../../theme/design";
import { MEAL_SLOTS } from "../utils/constants";
import { DayPlan, MealKey } from "../utils/types";
import { DayMealCard } from "./DayMealCard";

const shadowSoftCard = Platform.select({
  ios: {
    shadowColor: "#6B705C",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
  },
  android: {},
  default: {},
});

type Props = {
  days: DayPlan[];
  referenceDate: Date;
  selectedDate: Date;
  session: Session | null;
  recipesLength: number;
  recipesLoading: boolean;
  syncing: boolean;
  saving: boolean;
  onDayChange: (dayIndex: number, meal: MealKey, value: string) => void;
  onOpenRecipePicker: (dayIndex: number, meal: MealKey) => void;
  onSelectDate: (date: Date) => void;
  onBlur: () => void;
};

export const ListView = ({
  days,
  referenceDate,
  selectedDate,
  session,
  recipesLength,
  recipesLoading,
  syncing,
  saving,
  onDayChange,
  onOpenRecipePicker,
  onSelectDate,
  onBlur,
}: Props) => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isWideWeb = Platform.OS === "web" && width >= 1100;

  return (
    <View style={styles.weekList}>
      {days.map((day, dayIndex) => {
        const dayDate = addDays(referenceDate, dayIndex);
        const dayData = days[dayIndex] || {};
        const filledCount = MEAL_SLOTS.filter(
          (slot) =>
            !!(
              (dayData as Record<MealKey, { recipe?: string }>)[slot.key]
                ?.recipe ?? ""
            ).trim(),
        ).length;
        const isComplete = filledCount === MEAL_SLOTS.length;
        const abbrev = format(dayDate, "EEE", { locale: fr })
          .replace(".", "")
          .toUpperCase()
          .slice(0, 3);
        const dateNum = format(dayDate, "d", { locale: fr });
        const dateMonth = format(dayDate, "MMM", { locale: fr });
        const isActive = isSameDay(dayDate, selectedDate);

        return (
          <View key={day.day} style={styles.rowWrapper}>
            {/* Day badge — like the HTML's left column */}
            <Pressable
              style={styles.dayBadge}
              hitSlop={6}
              onPress={() => onSelectDate(dayDate)}
            >
              <Text
                style={[
                  styles.dayAbbrev,
                  (isActive || isComplete) && styles.dayAbbrevAccent,
                ]}
              >
                {abbrev}
              </Text>
              <Text style={styles.dayNum}>{dateNum}</Text>
              <Text style={styles.dayMonth}>{dateMonth}</Text>
            </Pressable>

            {/* Soft card */}
            <View
              style={[
                styles.softCardShadow,
                isActive && styles.softCardShadowActive,
              ]}
            >
              {Platform.OS === "android" && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.softCardAndroidShadow,
                    isActive && styles.softCardAndroidShadowActive,
                  ]}
                />
              )}
              <View
                style={[
                  styles.softCardSurface,
                  isWeb && styles.softCardSurfaceWeb,
                  isActive && styles.softCardSurfaceActive,
                ]}
              >
                {/* Status chip */}
                <View
                  style={[
                    styles.statusChip,
                    isComplete && styles.statusChipComplete,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isComplete && styles.statusTextComplete,
                    ]}
                  >
                    {isComplete
                      ? "Complet"
                      : `${filledCount}/${MEAL_SLOTS.length}`}
                  </Text>
                </View>

                {/* Meal rows */}
                <View style={[styles.meals, isWideWeb && styles.mealsWebWide]}>
                  {MEAL_SLOTS.map((slot) => {
                    const meal = (
                      dayData as Record<MealKey, { recipe?: string }>
                    )[slot.key] ?? { recipe: "" };

                    if (isWeb) {
                      return (
                        <View
                          key={slot.key}
                          style={isWideWeb ? styles.mealCardWebWide : undefined}
                        >
                          <DayMealCard
                            slot={slot}
                            meal={{ recipe: meal.recipe ?? "" }}
                            session={session}
                            recipesLength={recipesLength}
                            syncing={syncing}
                            saving={saving}
                            recipesLoading={recipesLoading}
                            onChangeText={(value) =>
                              onDayChange(dayIndex, slot.key, value)
                            }
                            onBlur={onBlur}
                            onOpenRecipePicker={() =>
                              onOpenRecipePicker(dayIndex, slot.key)
                            }
                          />
                        </View>
                      );
                    }

                    const filled = !!meal.recipe?.trim();
                    const isLunch = slot.key === "lunch";

                    return (
                      <View
                        key={slot.key}
                        style={[
                          styles.mealRow,
                          isWideWeb && styles.mealRowWebWide,
                          isWideWeb &&
                            filled &&
                            (isLunch
                              ? styles.mealRowWebWideFilledLunch
                              : styles.mealRowWebWideFilledDinner),
                        ]}
                      >
                        <Text
                          style={[
                            styles.mealLabel,
                            !isLunch && styles.mealLabelDinner,
                          ]}
                        >
                          {isLunch ? "Déjeuner" : "Dîner"}
                        </Text>
                        <View
                          style={[
                            styles.inputRow,
                            isWideWeb && styles.inputRowWebWide,
                            filled && styles.inputRowFilled,
                          ]}
                        >
                          <TextInput
                            value={meal.recipe}
                            onChangeText={(value) =>
                              onDayChange(dayIndex, slot.key, value)
                            }
                            onBlur={onBlur}
                            editable={!syncing}
                            placeholder={
                              isLunch
                                ? "Ajouter un déjeuner"
                                : "Ajouter un dîner"
                            }
                            placeholderTextColor="#A5A58D"
                            style={[
                              styles.input,
                              isWideWeb && styles.inputWebWide,
                              filled && styles.inputFilled,
                            ]}
                          />
                          <Pressable
                            hitSlop={8}
                            style={styles.recipeBtn}
                            onPress={() =>
                              onOpenRecipePicker(dayIndex, slot.key)
                            }
                          >
                            <Feather
                              name="book-open"
                              size={14}
                              color="#BC6C25"
                            />
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  weekList: {
    width: "100%",
    gap: spacing.base * 1.2,
  },
  rowWrapper: {
    flexDirection: "row",
    gap: spacing.base,
    alignItems: "flex-start",
  },
  dayBadge: {
    width: 52,
    alignItems: "center",
    gap: 1,
    paddingTop: 16,
    flexShrink: 0,
  },
  dayAbbrev: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2D2D2A",
    letterSpacing: -0.3,
  },
  dayAbbrevAccent: {
    color: "#BC6C25",
  },
  dayNum: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2D2D2A",
    letterSpacing: -1,
    lineHeight: 26,
  },
  dayMonth: {
    fontSize: 10,
    fontWeight: "700",
    color: "#A5A58D",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  softCardShadow: {
    flex: 1,
    borderRadius: 28,
    position: "relative",
    ...shadowSoftCard,
  },
  softCardShadowActive: {
    shadowColor: "rgba(188, 108, 37, 1)",
    shadowOpacity: 0.15,
  },
  softCardAndroidShadow: {
    ...StyleSheet.absoluteFillObject,
    top: 1,
    left: -1,
    right: -1,
    bottom: -2,
    borderRadius: 28,
    backgroundColor: "#000000",
    opacity: 0.12,
  },
  softCardAndroidShadowActive: {
    opacity: 0.16,
  },
  softCardSurface: {
    flex: 1,
    backgroundColor: "rgb(255, 255, 255)",
    borderRadius: 28,
    padding: 18,
    gap: spacing.base,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.95)",
  },
  softCardSurfaceWeb: {
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderRadius: 40,
    borderColor: "rgba(255,255,255,1)",
    padding: 20,
  },
  softCardSurfaceActive: {
    borderColor: "rgba(188, 108, 37, 0.25)",
  },
  statusChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F5EFE4",
    borderWidth: 1,
    borderColor: "#E4D9C8",
  },
  statusChipComplete: {
    backgroundColor: "rgba(188, 108, 37, 0.1)",
    borderColor: "rgba(188, 108, 37, 0.22)",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B705C",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusTextComplete: {
    color: "#BC6C25",
  },
  meals: {
    gap: spacing.base * 0.9,
  },
  mealsWebWide: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.base,
  },
  mealCardWebWide: {
    flex: 1,
  },
  mealRow: {
    gap: 5,
  },
  mealRowWebWide: {
    flex: 1,
    minHeight: 150,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(165, 165, 141, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  mealRowWebWideFilledLunch: {
    borderWidth: 0,
    borderStyle: "solid",
    backgroundColor: "#FFFFFF",
  },
  mealRowWebWideFilledDinner: {
    borderWidth: 0,
    borderStyle: "solid",
    backgroundColor: "#FDF8F1",
  },
  mealLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#A5A58D",
  },
  mealLabelDinner: {
    color: "#BC6C25",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base * 0.5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(165, 165, 141, 0.35)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputRowWebWide: {
    flex: 1,
    borderWidth: 0,
    borderStyle: "solid",
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: "flex-start",
  },
  inputRowFilled: {
    borderStyle: "solid",
    borderColor: "transparent",
    backgroundColor: "#F5EFE4",
  },
  input: {
    flex: 1,
    color: "#6B705C",
    fontSize: 13,
    paddingVertical: 0,
  },
  inputWebWide: {
    borderTopWidth: 1,
    borderTopColor: "rgba(165, 165, 141, 0.2)",
    width: "100%",
    paddingTop: 8,
    minHeight: 48,
  },
  inputFilled: {
    color: "#2D2D2A",
    fontWeight: "600",
  },
  recipeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E4D9C8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
});
