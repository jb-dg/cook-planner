import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type Household = {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
};

export type HouseholdMember = {
  user_id: string;
  pseudo: string | null;
  isCurrentUser: boolean;
};

export type SentInvite = {
  id: string;
  email: string;
  created_at: string;
};

export type PendingInvite = {
  id: string;
  household_id: string;
  household_name: string;
  invited_by_pseudo: string | null;
  created_at: string;
};

export type HouseholdModalMode = "create" | "join" | "manage";

export type FeatherIconName = ComponentProps<typeof Feather>["name"];

export type QuickActionItem = {
  id: string;
  icon: FeatherIconName;
  label: string;
  helper: string;
  onPress: () => void;
};
