import { Dispatch, SetStateAction, useEffect } from "react";
import { Session } from "@supabase/supabase-js";

import type { HouseholdScope } from "@/lib/households";
import { supabase } from "@/lib/supabase";

import {
  mapShoppingListItem,
  type ShoppingListItem,
  type ShoppingListItemRow,
} from "../types";

/**
 * Row-level realtime sync for the shared shopping list. Unlike the planner's
 * whole-document sync, inserts/updates/deletes are merged by id, so there's
 * no risk of overwriting a concurrent local edit — no need to track or skip
 * self-originated events.
 */
export const useShoppingListRealtime = (
  session: Session | null,
  scope: HouseholdScope | null,
  setItems: Dispatch<SetStateAction<ShoppingListItem[]>>,
) => {
  useEffect(() => {
    if (!session || !scope) return;

    const channelName = `shopping_list_${scope.filterColumn}_${scope.filterValue}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_list_items" },
        (payload) => {
          const record = (payload.new ?? payload.old) as Record<
            string,
            unknown
          > | null;
          if (!record) return;

          if (scope.householdId) {
            if (record.household_id !== scope.householdId) return;
          } else if (record.user_id !== scope.filterValue) {
            return;
          }

          if (payload.eventType === "DELETE") {
            setItems((prev) => prev.filter((item) => item.id !== record.id));
            return;
          }

          const mapped = mapShoppingListItem(record as ShoppingListItemRow);
          setItems((prev) => {
            const exists = prev.some((item) => item.id === mapped.id);
            if (exists) {
              return prev.map((item) =>
                item.id === mapped.id ? mapped : item,
              );
            }
            return [...prev, mapped];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, scope, setItems]);
};
