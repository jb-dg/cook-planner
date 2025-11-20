import { supabase } from "./supabase";

export type HouseholdScope = {
  householdId: string | null;
  filterColumn: "household_id" | "user_id";
  filterValue: string;
};

export const fetchHouseholdScope = async (
  userId: string
): Promise<HouseholdScope> => {
  const { data, error } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const householdId = data?.household_id ?? null;

  return {
    householdId,
    filterColumn: householdId ? "household_id" : "user_id",
    filterValue: householdId ?? userId,
  };
};
