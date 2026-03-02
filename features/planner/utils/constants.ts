import { DayPlan, MealKey } from "./types";

export const DEFAULT_MENU: DayPlan[] = [
  {
    day: "Lundi",
    lunch: { recipe: "" },
    dinner: { recipe: "" },
  },
  {
    day: "Mardi",
    lunch: { recipe: "" },
    dinner: { recipe: "" },
  },
  {
    day: "Mercredi",
    lunch: { recipe: "" },
    dinner: { recipe: "" },
  },
  {
    day: "Jeudi",
    lunch: { recipe: "" },
    dinner: { recipe: "" },
  },
  {
    day: "Vendredi",
    lunch: { recipe: "" },
    dinner: { recipe: "" },
  },
  {
    day: "Samedi",
    lunch: { recipe: "" },
    dinner: { recipe: "" },
  },
  {
    day: "Dimanche",
    lunch: { recipe: "" },
    dinner: { recipe: "" },
  },
];

export const MEAL_SLOTS: { key: MealKey; label: string }[] = [
  { key: "lunch", label: "Déj" },
  { key: "dinner", label: "Dîner" },
];
