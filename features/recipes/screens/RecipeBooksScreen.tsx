import { SafeAreaView } from "react-native-safe-area-context";

import RecipeBooksList from "@/features/recipes/components/RecipeBooksList";

import { useRecipeBooksScreenState } from "../hooks/useRecipeBooksScreenState";
import { styles } from "./recipeBooksStyles";

export default function RecipeBooksScreen() {
  const state = useRecipeBooksScreenState();

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
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
    </SafeAreaView>
  );
}
