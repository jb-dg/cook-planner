import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import RecipeBooksList from "@/features/recipes/components/RecipeBooksList";
import WebFooter from "@/components/WebFooter";
import { colors } from "@/theme/design";

import { useRecipeBooksScreenState } from "../hooks/useRecipeBooksScreenState";
import { styles } from "./recipeBooksStyles";

export default function RecipeBooksScreenWeb() {
  const state = useRecipeBooksScreenState("web");

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.webLayout}>
        <View style={styles.webSidebar}>
          <RecipeBooksList
            variant="web"
            books={state.books}
            loading={state.loading}
            booksLoading={state.booksLoading}
            refreshing={state.refreshing}
            recipesCount={state.recipes.length}
            booksCountLabel={state.booksCountLabel}
            bookName={state.bookName}
            bookError={state.bookError}
            error={state.error}
            selectedBookId={state.selectedBookId}
            onOpenBook={state.handleOpenBook}
            onRefresh={state.handleRefresh}
            onBookNameChange={state.onBookNameChange}
            onCreateBook={state.handleCreateBook}
            onCreateRecipe={state.handleOpenCreateRecipe}
          />
        </View>
        <View style={styles.webContent}>
          <ScrollView
            contentContainerStyle={styles.webContentSurface}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.webContentHeader}>
              <View>
                <Text style={styles.webContentTitle}>
                  {state.selectedBook?.name ?? "Sélectionne un livre"}
                </Text>
                <Text style={styles.webContentSubtitle}>
                  {state.selectedBook
                    ? `${state.displayedRecipes.length} recette${
                        state.displayedRecipes.length > 1 ? "s" : ""
                      } dans ce livre`
                    : "Choisis un livre dans le menu à gauche."}
                </Text>
              </View>
              {state.selectedBook ? (
                <Pressable
                  style={styles.webContentAdd}
                  onPress={state.handleCreateRecipeInBook}
                >
                  <Feather name="plus" size={14} color="#FFFFFF" />
                  <Text style={styles.webContentAddText}>Nouvelle recette</Text>
                </Pressable>
              ) : null}
            </View>

            {state.loading || state.booksLoading ? (
              <ActivityIndicator
                style={styles.loader}
                color={colors.accentSecondary}
                size="large"
              />
            ) : state.selectedBook ? (
              state.displayedRecipes.length ? (
                state.displayedRecipes.map((recipe) => (
                  <View key={recipe.id} style={styles.recipeCardShadow}>
                    {Platform.OS === "android" && (
                      <View pointerEvents="none" style={styles.recipeAndroidShadow} />
                    )}
                    <View style={styles.recipeCardSurface}>
                      <View style={styles.recipeHeader}>
                        <View style={styles.recipeHeadingBlock}>
                          <Text style={styles.recipeEyebrow}>Recette</Text>
                          <Text style={styles.recipeTitle}>{recipe.title}</Text>
                        </View>
                      </View>

                      <View style={styles.recipeMeta}>
                        <View style={[styles.metaChip, styles.metaChipAccent]}>
                          <Text style={[styles.metaChipText, styles.metaChipTextAccent]}>
                            {recipe.difficulty}
                          </Text>
                        </View>
                        <View style={styles.metaChip}>
                          <Text style={styles.metaChipText}>{recipe.servings} pers.</Text>
                        </View>
                        {recipe.duration ? (
                          <View style={styles.metaChip}>
                            <Text style={styles.metaChipText}>{recipe.duration}</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.actionsRow}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.actionButton,
                            styles.actionButtonSoft,
                            pressed && styles.cardPressed,
                          ]}
                          onPress={() => state.handleOpenRecipe(recipe.id, "view")}
                        >
                          <Feather name="eye" size={14} color="#6B705C" />
                          <Text style={styles.actionButtonSoftText}>Afficher</Text>
                        </Pressable>
                        <Pressable
                          style={({ pressed }) => [
                            styles.actionButton,
                            styles.actionButtonAccent,
                            pressed && styles.cardPressed,
                          ]}
                          onPress={() => state.handleOpenRecipe(recipe.id, "edit")}
                        >
                          <Feather name="edit-2" size={14} color="#FFFFFF" />
                          <Text style={styles.actionButtonAccentText}>Modifier</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Ce livre est vide</Text>
                  <Text style={styles.emptySubtitle}>
                    Ajoute des recettes pour les voir apparaître ici.
                  </Text>
                </View>
              )
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Sélectionne un livre</Text>
                <Text style={styles.emptySubtitle}>
                  Choisis un livre dans le menu à gauche pour afficher ses recettes.
                </Text>
              </View>
            )}

            <WebFooter />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
