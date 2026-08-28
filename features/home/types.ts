export type PlanProgress = {
  percent: number;
  filled: number;
  total: number;
};

export type TodayMenu = {
  lunch: string;
  dinner: string;
};

// The first empty lunch/dinner slot from today onward (wrapping to earlier
// in the week only if every slot from today on is already filled) — lets
// the home screen link "X repas manquants" straight to the gap instead of
// just to the planner's default (today) view.
export type MissingSlot = {
  date: Date;
  meal: "lunch" | "dinner";
} | null;
