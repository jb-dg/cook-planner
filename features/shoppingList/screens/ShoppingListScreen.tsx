import { Feather } from "@expo/vector-icons";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Toast } from "@/features/planner/components/Toast";
import PhysicalButtonAnimated from "@/components/PhysicalButtonAnimated";
import { colors } from "@/theme/design";

import { AddItemBar } from "../components/AddItemBar";
import { GenerateFromWeekButton } from "../components/GenerateFromWeekButton";
import { RecipeSelectModal } from "../components/RecipeSelectModal";
import ShoppingListSplitView from "../components/ShoppingListSplitView";
import { ShoppingListItemRow } from "../components/ShoppingListItemRow";
import { useShoppingListScreenState } from "../hooks/useShoppingListScreenState";
import { styles } from "./shoppingListStyles";

const isIpad = Platform.OS === "ios" && Platform.isPad;

export default function ShoppingListScreen() {
  const state = useShoppingListScreenState();

  if (isIpad) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ShoppingListSplitView
            loading={state.loading}
            refreshing={state.refreshing}
            generating={state.generating}
            error={state.error}
            items={state.items}
            checkedCount={state.checkedCount}
            onRefresh={state.handleRefresh}
            onAddManualItem={state.handleAddManualItem}
            onToggleChecked={state.handleToggleChecked}
            onDeleteItem={state.handleDeleteItem}
            onClearChecked={state.handleClearChecked}
            onOpenAddFromRecipe={state.handleOpenAddFromRecipe}
            onGenerateFromWeek={state.handleGenerateFromWeek}
          />

          <RecipeSelectModal
            visible={state.recipePickerVisible}
            recipes={state.recipes}
            loading={state.recipesLoading}
            onClose={state.handleCloseAddFromRecipe}
            onSelectRecipe={state.handleAddIngredientsFromRecipe}
          />

          {state.toast && <Toast toast={state.toast} />}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={state.refreshing}
              onRefresh={state.handleRefresh}
              tintColor={colors.accent}
            />
          }
        >
          <View style={styles.headerCard}>
            <Text style={styles.title}>Courses</Text>
            <Text style={styles.subtitle}>
              {state.items.length
                ? `${state.items.length} article${state.items.length > 1 ? "s" : ""} · ${state.checkedCount} coché${state.checkedCount > 1 ? "s" : ""}`
                : "Ta liste est vide pour le moment."}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <View style={styles.actionButton}>
              <GenerateFromWeekButton
                loading={state.generating}
                onPress={state.handleGenerateFromWeek}
              />
            </View>
            <View style={styles.actionButton}>
              <PhysicalButtonAnimated
                variant="secondary"
                onPress={state.handleOpenAddFromRecipe}
                innerStyle={styles.recipeButtonInner}
                accessibilityRole="button"
                accessibilityLabel="Ajouter les ingrédients d'une recette"
              >
                <Feather name="book-open" size={16} color={colors.accent} />
                <Text style={styles.recipeButtonText} numberOfLines={2}>
                  Depuis une recette
                </Text>
              </PhysicalButtonAnimated>
            </View>
          </View>

          <AddItemBar onSubmit={state.handleAddManualItem} />

          {state.error ? <Text style={styles.errorText}>{state.error}</Text> : null}

          {state.loading ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : state.items.length ? (
            <View style={styles.list}>
              {state.items.map((item) => (
                <ShoppingListItemRow
                  key={item.id}
                  item={item}
                  onToggle={state.handleToggleChecked}
                  onDelete={state.handleDeleteItem}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                Aucun article pour l&apos;instant
              </Text>
              <Text style={styles.emptySubtitle}>
                Ajoute un article, importe les ingrédients d&apos;une recette,
                ou génère la liste depuis le planning de cette semaine.
              </Text>
            </View>
          )}

          {state.checkedCount > 0 ? (
            <View style={styles.clearButtonWrapper}>
              <PhysicalButtonAnimated
                variant="secondary"
                onPress={state.handleClearChecked}
                accessibilityRole="button"
                accessibilityLabel="Vider les articles cochés"
              >
                <Text style={styles.clearButtonText}>
                  Vider les articles cochés
                </Text>
              </PhysicalButtonAnimated>
            </View>
          ) : null}
        </ScrollView>

        <RecipeSelectModal
          visible={state.recipePickerVisible}
          recipes={state.recipes}
          loading={state.recipesLoading}
          onClose={state.handleCloseAddFromRecipe}
          onSelectRecipe={state.handleAddIngredientsFromRecipe}
        />

        {state.toast && <Toast toast={state.toast} />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
