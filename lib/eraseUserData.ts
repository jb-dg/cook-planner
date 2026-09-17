import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "./supabase";

// Local-only state that isn't stored in the database: custom recipe books
// and in-progress "add a recipe" drafts, both keyed per user/household.
const LOCAL_KEY_PREFIXES = ["recipe-books:", "recipe-add-flow:"];

export type EraseResult = { success: boolean; message?: string };

// Deletes every piece of content the user created — recipes, weekly plans,
// shopping list, households they own, household membership, uploaded media —
// while leaving the auth account and the profiles row intact. Runs entirely
// with the caller's own RLS delete permissions, so no privileged backend is
// needed. Used by the "Effacer toutes mes données" action in the profile.
export async function eraseUserData(userId: string): Promise<EraseResult> {
  try {
    // Households the user owns: deleting the row cascades membership,
    // invites and any household-scoped rows for every member.
    const { data: ownedHouseholds, error: ownedError } = await supabase
      .from("households")
      .select("id")
      .eq("owner_id", userId);
    if (ownedError) throw ownedError;

    if (ownedHouseholds?.length) {
      const { error } = await supabase
        .from("households")
        .delete()
        .in(
          "id",
          ownedHouseholds.map((row) => row.id),
        );
      if (error) throw error;
    }

    // Leave a household owned by someone else.
    {
      const { error } = await supabase
        .from("household_members")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    }

    // Personal content.
    for (const table of [
      "shopping_list_items",
      "weekly_menus",
      "recipes",
    ] as const) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    }

    // Drop the avatar reference and its stored files (storage has no
    // FK cascade). The profiles row itself is kept so the account stays
    // usable.
    const { error: avatarError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("user_id", userId);
    if (avatarError) throw avatarError;

    try {
      const prefix = `profiles/${userId}`;
      const { data: files } = await supabase.storage.from("media").list(prefix);
      if (files?.length) {
        await supabase.storage
          .from("media")
          .remove(files.map((file) => `${prefix}/${file.name}`));
      }
    } catch (storageError) {
      console.warn("erase user data: storage cleanup failed", storageError);
    }

    try {
      const keys = await AsyncStorage.getAllKeys();
      const stale = keys.filter((key) =>
        LOCAL_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)),
      );
      if (stale.length) {
        await AsyncStorage.multiRemove(stale);
      }
    } catch (localError) {
      console.warn("erase user data: local cleanup failed", localError);
    }

    return { success: true };
  } catch (error) {
    console.error("erase user data", error);
    return {
      success: false,
      message:
        "Impossible d'effacer toutes les données pour le moment. Réessaie plus tard.",
    };
  }
}
