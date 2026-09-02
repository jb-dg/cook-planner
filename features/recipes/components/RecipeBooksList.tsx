import { Feather } from "@expo/vector-icons";
import type { RecipeBook } from "@/features/recipes/books";
import { colors } from "@/theme/design";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

import PhysicalButtonAnimated from "@/components/PhysicalButtonAnimated";
import PhysicalIconButton from "@/components/PhysicalIconButton";
import CreateBookModal from "./CreateBookModal";
import { styles } from "../screens/recipeBooksStyles";

type Props = {
  books: RecipeBook[];
  loading: boolean;
  booksLoading: boolean;
  refreshing: boolean;
  recipesCount: number;
  booksCountLabel: string;
  bookName: string;
  bookError: string | null;
  error: string | null;
  onOpenBook: (book: RecipeBook) => void;
  onRefresh: () => Promise<void>;
  onBookNameChange: (value: string) => void;
  onCreateBook: () => void;
  onCreateRecipe: () => void;
  onOpenExplore: () => void;
};

export default function RecipeBooksList({
  books,
  loading,
  booksLoading,
  refreshing,
  recipesCount,
  booksCountLabel,
  bookName,
  bookError,
  error,
  onOpenBook,
  onRefresh,
  onBookNameChange,
  onCreateBook,
  onCreateRecipe,
  onOpenExplore,
}: Props) {
  // "+" next to the heading opens this instead of the old always-visible
  // input row — matches the iPad split view's pattern, and gets rare-use
  // UI off a screen whose main job is picking a book.
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const renderBook = ({ item }: { item: RecipeBook }) => (
    <Pressable
      onPress={() => onOpenBook(item)}
      style={({ pressed }) => [styles.bookCardShadow, pressed && styles.cardPressed]}
    >
      {Platform.OS === "android" && (
        <View pointerEvents="none" style={styles.bookAndroidShadow} />
      )}
      <View style={styles.bookCardSurface}>
        <View style={styles.bookCardHeader}>
          <View style={styles.bookTitleBlock}>
            <Text style={styles.bookTitle}>{item.name}</Text>
          </View>
          <View style={styles.bookArrow}>
            <Feather name="chevron-right" size={18} color="#BC6C25" />
          </View>
        </View>
        <View style={styles.bookFooterRow}>
          <View style={styles.countChip}>
            <Text style={styles.countChipText}>
              {item.recipeIds.length} recette{item.recipeIds.length > 1 ? "s" : ""}
            </Text>
          </View>
          <Text style={styles.bookFooterText}>
            Appuie pour voir les recettes de ce livre
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const listHeader = (
    <View style={styles.header}>
      <View style={styles.heroShadow}>
        {Platform.OS === "android" && (
          <View pointerEvents="none" style={styles.heroAndroidShadow} />
        )}
        <View style={styles.heroSurface}>
          <View style={styles.headerRow}>
            <View style={styles.headingBlock}>
              <Text style={styles.heading}>Livres de recettes</Text>
            </View>
            <View style={styles.headerActionsGroup}>
              <PhysicalIconButton
                variant="secondary"
                onPress={() => setCreateModalVisible(true)}
                accessibilityLabel="Créer un livre"
              >
                <Feather name="book-open" size={18} color={colors.muted} />
              </PhysicalIconButton>
              <PhysicalIconButton
                variant="secondary"
                onPress={onCreateRecipe}
                accessibilityLabel="Nouvelle recette"
              >
                <Feather name="plus" size={20} color={colors.muted} />
              </PhysicalIconButton>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Choisis un livre pour ouvrir sa liste de recettes. Le livre
            “Recettes du foyer” regroupe toutes les recettes du foyer.
          </Text>
          <View style={styles.headerMetaRow}>
            <View style={styles.headerChip}>
              <Text style={styles.headerChipText}>{booksCountLabel}</Text>
            </View>
            <Text style={styles.subheading}>
              {recipesCount} recette{recipesCount > 1 ? "s" : ""} au total
            </Text>
          </View>
          <PhysicalButtonAnimated
            variant="secondary"
            onPress={onOpenExplore}
            innerStyle={styles.exploreButtonInner}
          >
            <Feather name="search" size={14} color={colors.muted} />
            <Text style={styles.exploreButtonText}>Explorer des recettes</Text>
          </PhysicalButtonAnimated>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>
    </View>
  );

  const listEmpty =
    loading || booksLoading ? (
      <ActivityIndicator
        style={styles.loader}
        color={colors.accentSecondary}
        size="large"
      />
    ) : null;

  return (
    <>
      <FlatList
        data={loading || booksLoading ? [] : books}
        keyExtractor={(item) => item.id}
        renderItem={renderBook}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <CreateBookModal
        visible={createModalVisible}
        bookName={bookName}
        bookError={bookError}
        onBookNameChange={onBookNameChange}
        onCreateBook={onCreateBook}
        onClose={() => setCreateModalVisible(false)}
      />
    </>
  );
}
