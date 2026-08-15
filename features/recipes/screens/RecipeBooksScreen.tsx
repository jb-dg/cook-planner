import { Platform, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import RecipeBooksList from "@/features/recipes/components/RecipeBooksList";
import RecipeBooksSplitView from "@/features/recipes/components/RecipeBooksSplitView";
import RecipeViewModal from "@/features/recipes/components/RecipeViewModal";

import { useRecipeBooksScreenState } from "../hooks/useRecipeBooksScreenState";
import { styles } from "./recipeBooksStyles";

export default function RecipeBooksScreen() {
  const state = useRecipeBooksScreenState();
  const { width, height } = useWindowDimensions();
  const isIpadLandscape =
    Platform.OS === "ios" && Platform.isPad && width > height;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {isIpadLandscape ? (
        <RecipeBooksSplitView
          books={state.books}
          loading={state.loading}
          booksLoading={state.booksLoading}
          recipesCount={state.recipes.length}
          bookName={state.bookName}
          bookError={state.bookError}
          renameError={state.renameError}
          error={state.error}
          selectedBook={state.selectedBook}
          displayedRecipes={state.displayedRecipes}
          onSelectBook={state.handleSelectBook}
          onBookNameChange={state.onBookNameChange}
          onCreateBook={state.handleCreateBook}
          onRenameBook={state.handleRenameBook}
          onDeleteBook={state.handleDeleteBook}
          onCreateRecipeInBook={state.handleCreateRecipeInBook}
          onOpenRecipe={state.handleOpenRecipe}
        />
      ) : (
        <RecipeBooksList
          books={state.books}
          loading={state.loading}
          booksLoading={state.booksLoading}
          refreshing={state.refreshing}
          recipesCount={state.recipes.length}
          booksCountLabel={state.booksCountLabel}
          bookName={state.bookName}
          bookError={state.bookError}
          error={state.error}
          onOpenBook={state.handleOpenBook}
          onRefresh={state.handleRefresh}
          onBookNameChange={state.onBookNameChange}
          onCreateBook={state.handleCreateBook}
          onCreateRecipe={state.handleOpenCreateRecipe}
        />
      )}

      <RecipeViewModal
        visible={!!state.selectedRecipe}
        recipe={state.selectedRecipe}
        onClose={state.handleCloseRecipeModal}
        onEdit={(recipeId) => {
          state.handleCloseRecipeModal();
          state.handleOpenRecipe(recipeId, "edit");
        }}
      />
    </SafeAreaView>
  );
}
