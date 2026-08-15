import { Feather } from "@expo/vector-icons";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import PhysicalButtonAnimated from "@/components/PhysicalButtonAnimated";
import { colors, spacing } from "@/theme/design";

import { AddItemBar } from "./AddItemBar";
import { GenerateFromWeekButton } from "./GenerateFromWeekButton";
import { ShoppingListItemRow } from "./ShoppingListItemRow";
import type { ShoppingListItem } from "../types";
import { styles as sharedStyles } from "../screens/shoppingListStyles";

type Props = {
  loading: boolean;
  refreshing: boolean;
  generating: boolean;
  error: string | null;
  items: ShoppingListItem[];
  checkedCount: number;
  onRefresh: () => void;
  onAddManualItem: (name: string, quantity: string, unit: string) => void;
  onToggleChecked: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onClearChecked: () => void;
  onOpenAddFromRecipe: () => void;
  onGenerateFromWeek: () => void;
};

// iPad only (portrait and landscape): the actions panel (title, stats, add
// form, import buttons) stays permanently visible on the left instead of
// scrolling past above the list — there's no "books"-style sub-list to pick
// between here, just one flat list, so the split is add/act (left) vs.
// review/check off (right) rather than a navigation menu.
export default function ShoppingListSplitView({
  loading,
  refreshing,
  generating,
  error,
  items,
  checkedCount,
  onRefresh,
  onAddManualItem,
  onToggleChecked,
  onDeleteItem,
  onClearChecked,
  onOpenAddFromRecipe,
  onGenerateFromWeek,
}: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.panel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.panelContent}
        >
          <View style={sharedStyles.headerCard}>
            <Text style={sharedStyles.title}>Courses</Text>
            <Text style={sharedStyles.subtitle}>
              {items.length
                ? `${items.length} article${items.length > 1 ? "s" : ""} · ${checkedCount} coché${checkedCount > 1 ? "s" : ""}`
                : "Ta liste est vide pour le moment."}
            </Text>
          </View>

          <View style={sharedStyles.actionsRow}>
            <View style={sharedStyles.actionButton}>
              <GenerateFromWeekButton
                loading={generating}
                onPress={onGenerateFromWeek}
              />
            </View>
            <View style={sharedStyles.actionButton}>
              <PhysicalButtonAnimated
                variant="secondary"
                onPress={onOpenAddFromRecipe}
                innerStyle={sharedStyles.recipeButtonInner}
                accessibilityRole="button"
                accessibilityLabel="Ajouter les ingrédients d'une recette"
              >
                <Feather name="book-open" size={16} color={colors.accent} />
                <Text style={sharedStyles.recipeButtonText} numberOfLines={2}>
                  Depuis une recette
                </Text>
              </PhysicalButtonAnimated>
            </View>
          </View>

          <AddItemBar onSubmit={onAddManualItem} />

          {error ? <Text style={sharedStyles.errorText}>{error}</Text> : null}

          {checkedCount > 0 ? (
            <PhysicalButtonAnimated
              variant="secondary"
              onPress={onClearChecked}
              accessibilityRole="button"
              accessibilityLabel="Vider les articles cochés"
            >
              <Text style={sharedStyles.clearButtonText}>
                Vider les articles cochés
              </Text>
            </PhysicalButtonAnimated>
          ) : null}
        </ScrollView>
      </View>

      <View style={styles.detail}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
        >
          {loading ? (
            <ActivityIndicator color={colors.accent} style={sharedStyles.loader} />
          ) : items.length ? (
            <View style={sharedStyles.list}>
              {items.map((item) => (
                <ShoppingListItemRow
                  key={item.id}
                  item={item}
                  onToggle={onToggleChecked}
                  onDelete={onDeleteItem}
                />
              ))}
            </View>
          ) : (
            <View style={sharedStyles.emptyState}>
              <Text style={sharedStyles.emptyTitle}>
                Aucun article pour l&apos;instant
              </Text>
              <Text style={sharedStyles.emptySubtitle}>
                Ajoute un article, importe les ingrédients d&apos;une recette,
                ou génère la liste depuis le planning de cette semaine.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
  },
  panel: {
    width: 340,
    borderRightWidth: 1,
    borderRightColor: colors.cardBorder,
  },
  panelContent: {
    padding: spacing.screen * 0.8,
    paddingBottom: spacing.screen * 2,
    gap: spacing.base * 1.5,
  },
  detail: {
    flex: 1,
  },
  detailContent: {
    padding: spacing.screen,
    paddingBottom: spacing.screen * 2,
  },
});
