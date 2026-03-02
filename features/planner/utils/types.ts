export type MealKey = "lunch" | "dinner";

export type DayPlan = {
  day: string;
  lunch: { recipe: string };
  dinner: { recipe: string };
  notes?: string;
};

export type ViewMode = "focus" | "list";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  message: string;
  type: ToastType;
};

export type RecipePickerTarget = {
  dayIndex: number;
  meal: MealKey;
};
