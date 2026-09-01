import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import PhysicalButtonAnimated from "@/components/PhysicalButtonAnimated";
import PhysicalIconButton from "@/components/PhysicalIconButton";
import type { RecipeBook } from "@/features/recipes/books";
import type { Recipe } from "@/features/recipes/types";
import { colors, spacing } from "@/theme/design";

import AddRecipesToBookModal from "./AddRecipesToBookModal";
import CreateBookModal from "./CreateBookModal";
import RecipeCard from "./RecipeCard";

const GRID_GAP = 16;
// Portrait iPad has noticeably less room for the grid than landscape (the
// menu column eats a bigger share of it) — clamp column count by width
// instead of hardcoding 4, so cards don't get squeezed too narrow.
const GRID_MIN_CARD_WIDTH = 150;
const GRID_MAX_COLUMNS = 4;
const GRID_MIN_COLUMNS = 2;
// Portrait always gets 3 — at that width the dynamic width-based formula
// below lands on either 2 (too few, wastes the row) or 4 (too cramped), so
// portrait is pinned rather than left to the same clamp as landscape.
const GRID_PORTRAIT_COLUMNS = 3;

type Props = {
  books: RecipeBook[];
  loading: boolean;
  booksLoading: boolean;
  recipesCount: number;
  bookName: string;
  bookError: string | null;
  renameError: string | null;
  error: string | null;
  selectedBook: RecipeBook | null;
  displayedRecipes: Recipe[];
  availableRecipes: Recipe[];
  onSelectBook: (book: RecipeBook) => void;
  onBookNameChange: (value: string) => void;
  onCreateBook: () => void;
  onRenameBook: (book: RecipeBook, name: string) => void;
  onDeleteBook: (book: RecipeBook) => void;
  onAddRecipeToBook: (recipeId: string) => void;
  onCreateRecipeInBook: () => void;
  onOpenExplore: () => void;
  onOpenRecipe: (recipeId: string, mode: "view" | "edit") => void;
};

// iPad only (portrait and landscape): books stay in a permanent left menu
// instead of their own screen — picking one just swaps the recipe grid on
// the right, no navigation involved.
export default function RecipeBooksSplitView({
  books,
  loading,
  booksLoading,
  recipesCount,
  bookName,
  bookError,
  renameError,
  error,
  selectedBook,
  displayedRecipes,
  availableRecipes,
  onSelectBook,
  onBookNameChange,
  onCreateBook,
  onRenameBook,
  onDeleteBook,
  onAddRecipeToBook,
  onCreateRecipeInBook,
  onOpenExplore,
  onOpenRecipe,
}: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isPortrait = windowHeight >= windowWidth;

  const [gridWidth, setGridWidth] = useState(0);
  const gridColumns = isPortrait
    ? GRID_PORTRAIT_COLUMNS
    : gridWidth
      ? Math.max(
          GRID_MIN_COLUMNS,
          Math.min(
            GRID_MAX_COLUMNS,
            Math.floor((gridWidth + GRID_GAP) / (GRID_MIN_CARD_WIDTH + GRID_GAP)),
          ),
        )
      : GRID_MAX_COLUMNS;
  const cardWidth = gridWidth
    ? (gridWidth - GRID_GAP * (gridColumns - 1)) / gridColumns
    : undefined;

  const onGridLayout = (event: LayoutChangeEvent) => {
    setGridWidth(event.nativeEvent.layout.width);
  };

  // null = not editing. Tied to the selected book, so switching books while
  // mid-rename discards the in-progress edit instead of leaving stale UI.
  const [editingName, setEditingName] = useState<string | null>(null);
  useEffect(() => {
    setEditingName(null);
  }, [selectedBook?.id]);

  const [addRecipesModalVisible, setAddRecipesModalVisible] = useState(false);

  const startRename = () => {
    if (!selectedBook) return;
    setEditingName(selectedBook.name);
  };
  const confirmRename = () => {
    if (!selectedBook || editingName === null) return;
    onRenameBook(selectedBook, editingName);
    setEditingName(null);
  };
  const cancelRename = () => setEditingName(null);

  // "+" next to the menu title opens this.
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const confirmDeleteBook = () => {
    if (!selectedBook) return;
    Alert.alert(
      "Supprimer le livre",
      `Supprimer "${selectedBook.name}" ? Les recettes elles-mêmes ne seront pas supprimées.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => onDeleteBook(selectedBook),
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.menu}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.menuContent}
        >
          <Text style={styles.menuKicker}>Recettes</Text>
          <View style={styles.menuHeadingRow}>
            <Text style={styles.menuHeading}>Livres de recettes</Text>
            <PhysicalIconButton
              variant="secondary"
              onPress={() => setCreateModalVisible(true)}
              accessibilityLabel="Créer un livre"
            >
              <Feather name="plus" size={16} color={colors.accent} />
            </PhysicalIconButton>
          </View>
          <Text style={styles.menuSubtitle}>
            {recipesCount} recette{recipesCount > 1 ? "s" : ""} au total
          </Text>

          {loading || booksLoading ? (
            <ActivityIndicator
              style={styles.loader}
              color={colors.accentSecondary}
              size="large"
            />
          ) : (
            <View style={styles.menuList}>
              {books.map((book) => {
                const isActive = book.id === selectedBook?.id;
                return (
                  <Pressable
                    key={book.id}
                    onPress={() => onSelectBook(book)}
                    style={({ pressed }) => [
                      styles.menuItem,
                      isActive && styles.menuItemActive,
                      pressed && styles.menuItemPressed,
                    ]}
                  >
                    <View
                      style={[styles.menuIcon, isActive && styles.menuIconActive]}
                    >
                      <Feather
                        name="book-open"
                        size={14}
                        color={isActive ? "#FFFFFF" : colors.accent}
                      />
                    </View>
                    <Text
                      style={[
                        styles.menuItemText,
                        isActive && styles.menuItemTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {book.name}
                    </Text>
                    <Text
                      style={[
                        styles.menuItemCount,
                        isActive && styles.menuItemCountActive,
                      ]}
                    >
                      {book.recipeIds.length}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      <View style={styles.detail}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailContent}
        >
          <View style={styles.detailHeader}>
            <View style={styles.detailHeadingBlock}>
              {editingName !== null ? (
                <TextInput
                  value={editingName}
                  onChangeText={setEditingName}
                  autoFocus
                  style={styles.renameInput}
                  onSubmitEditing={confirmRename}
                  returnKeyType="done"
                />
              ) : (
                <Text style={styles.detailHeading} numberOfLines={1}>
                  {selectedBook?.name ?? "Livre"}
                </Text>
              )}
              {renameError && editingName !== null ? (
                <Text style={styles.bookErrorText}>{renameError}</Text>
              ) : (
                <Text style={styles.detailSubtitle}>
                  {displayedRecipes.length} recette
                  {displayedRecipes.length > 1 ? "s" : ""}
                </Text>
              )}
            </View>

            <View style={styles.detailHeaderActions}>
              {editingName !== null ? (
                <>
                  <PhysicalIconButton
                    variant="secondary"
                    onPress={confirmRename}
                    accessibilityLabel="Enregistrer le nom du livre"
                  >
                    <Feather name="check" size={16} color={colors.accent} />
                  </PhysicalIconButton>
                  <PhysicalIconButton
                    variant="secondary"
                    onPress={cancelRename}
                    accessibilityLabel="Annuler"
                  >
                    <Feather name="x" size={16} color={colors.muted} />
                  </PhysicalIconButton>
                </>
              ) : (
                <>
                  <PhysicalButtonAnimated
                    variant="secondary"
                    onPress={onOpenExplore}
                    innerStyle={styles.createRecipeButtonInner}
                  >
                    <Feather name="search" size={14} color={colors.muted} />
                    <Text style={styles.exploreButtonText}>Explorer</Text>
                  </PhysicalButtonAnimated>
                  <PhysicalButtonAnimated
                    variant="primary"
                    onPress={onCreateRecipeInBook}
                    innerStyle={styles.createRecipeButtonInner}
                  >
                    <Feather name="plus" size={14} color="#FFFFFF" />
                    <Text style={styles.createRecipeButtonText}>Nouvelle recette</Text>
                  </PhysicalButtonAnimated>
                  {selectedBook && !selectedBook.isSystem ? (
                    <PhysicalIconButton
                      variant="secondary"
                      onPress={() => setAddRecipesModalVisible(true)}
                      accessibilityLabel="Ajouter des recettes au livre"
                    >
                      <Feather name="bookmark" size={14} color={colors.muted} />
                    </PhysicalIconButton>
                  ) : null}
                  {selectedBook && !selectedBook.isSystem ? (
                    <>
                      <PhysicalIconButton
                        variant="secondary"
                        onPress={startRename}
                        accessibilityLabel="Modifier le nom du livre"
                      >
                        <Feather name="edit-2" size={14} color={colors.muted} />
                      </PhysicalIconButton>
                      <PhysicalIconButton
                        variant="secondary"
                        onPress={confirmDeleteBook}
                        accessibilityLabel="Supprimer le livre"
                      >
                        <Feather name="trash-2" size={14} color={colors.danger} />
                      </PhysicalIconButton>
                    </>
                  ) : null}
                </>
              )}
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {!loading && !booksLoading && !displayedRecipes.length ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {selectedBook ? "Ce livre est vide" : "Aucun livre sélectionné"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {selectedBook
                  ? "Ajoute des recettes à ce livre depuis l’écran des recettes."
                  : "Choisis un livre dans le menu à gauche."}
              </Text>
            </View>
          ) : (
            <View style={styles.grid} onLayout={onGridLayout}>
              {displayedRecipes.map((recipe) => (
                <View key={recipe.id} style={cardWidth ? { width: cardWidth } : styles.gridItemHidden}>
                  <RecipeCard
                    recipe={recipe}
                    onView={() => onOpenRecipe(recipe.id, "view")}
                    compact
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      <CreateBookModal
        visible={createModalVisible}
        bookName={bookName}
        bookError={bookError}
        onBookNameChange={onBookNameChange}
        onCreateBook={onCreateBook}
        onClose={() => setCreateModalVisible(false)}
      />
      <AddRecipesToBookModal
        visible={addRecipesModalVisible}
        bookName={selectedBook?.name ?? "Livre"}
        availableRecipes={availableRecipes}
        onAdd={onAddRecipeToBook}
        onClose={() => setAddRecipesModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
  },
  menu: {
    width: 300,
    borderRightWidth: 1,
    borderRightColor: colors.cardBorder,
  },
  menuContent: {
    padding: spacing.screen * 0.8,
    paddingBottom: spacing.screen * 2,
    gap: spacing.base * 0.8,
  },
  menuKicker: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: "#A5A58D",
  },
  menuHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  menuHeading: {
    flex: 1,
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.6,
  },
  menuSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    marginBottom: spacing.base * 0.4,
  },
  loader: {
    marginTop: 24,
  },
  menuList: {
    gap: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  menuItemPressed: {
    opacity: 0.85,
  },
  menuItemActive: {
    backgroundColor: colors.accent,
  },
  menuIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(188, 108, 37, 0.1)",
  },
  menuIconActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  menuItemTextActive: {
    color: "#FFFFFF",
  },
  menuItemCount: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
  menuItemCountActive: {
    color: "rgba(255, 255, 255, 0.85)",
  },
  bookErrorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  detail: {
    flex: 1,
  },
  detailContent: {
    padding: spacing.screen,
    paddingBottom: spacing.screen * 2,
    gap: spacing.base * 1.4,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.base,
  },
  detailHeadingBlock: {
    flex: 1,
    gap: 2,
  },
  detailHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailHeading: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.8,
  },
  renameInput: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4D9C8",
    backgroundColor: "#FCFAF7",
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  detailSubtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
  },
  createRecipeButtonInner: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 16,
  },
  createRecipeButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  exploreButtonText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  // While the grid hasn't measured its width yet, keep cards out of the
  // layout flow rather than flashing a single full-width column.
  gridItemHidden: {
    width: 0,
    height: 0,
    overflow: "hidden",
  },
  emptyState: {
    marginTop: 24,
    paddingVertical: 26,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1.4,
    borderStyle: "dashed",
    borderColor: "rgba(165, 165, 141, 0.36)",
    backgroundColor: "rgba(255, 255, 255, 0.58)",
    gap: 9,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 19,
  },
});
