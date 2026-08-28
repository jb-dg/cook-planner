import { Feather } from "@expo/vector-icons";
import type { RecipeBook } from "@/features/recipes/books";
import { colors } from "@/theme/design";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import PhysicalButtonAnimated from "@/components/PhysicalButtonAnimated";
import PhysicalIconButton from "@/components/PhysicalIconButton";
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
            <Text style={styles.bookEyebrow}>
              {item.isSystem ? "Système" : "Livre"}
            </Text>
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
              <Text style={styles.headingKicker}>Carnet</Text>
              <Text style={styles.heading}>Livres de recettes</Text>
            </View>
            <PhysicalIconButton
              variant="secondary"
              onPress={onCreateRecipe}
              accessibilityLabel="Nouvelle recette"
            >
              <Feather name="plus" size={20} color={colors.muted} />
            </PhysicalIconButton>
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
          <View style={styles.bookCreatorRow}>
            <TextInput
              value={bookName}
              onChangeText={onBookNameChange}
              placeholder="Nom du nouveau livre"
              placeholderTextColor="#A5A58D"
              style={styles.bookInput}
            />
            <PhysicalButtonAnimated
              variant="primary"
              onPress={onCreateBook}
              innerStyle={styles.createBookButtonInner}
            >
              <Feather name="book-open" size={14} color="#FFFFFF" />
              <Text style={styles.createBookButtonText}>Créer</Text>
            </PhysicalButtonAnimated>
          </View>
          {bookError ? <Text style={styles.bookErrorText}>{bookError}</Text> : null}
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
  );
}
