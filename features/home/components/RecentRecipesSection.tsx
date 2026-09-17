import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/Text";

import type { Recipe } from "@/features/recipes/types";
import { colors } from "@/theme/design";

import { styles } from "../screens/homeScreenStyles";

type Props = {
  recipes: Recipe[];
  loading: boolean;
  onSelectRecipe: (recipeId: string) => void;
  // "row": a short horizontally-scrollable strip (phone — narrow width,
  // thumb-scrollable). "grid": a wrapping multi-column grid that fills
  // the available width and grows downward (iPad split view's detail
  // pane, which has a whole column to itself and otherwise ends up
  // mostly empty after a handful of fixed-width cards).
  layout?: "row" | "grid";
};

export default function RecentRecipesSection({
  recipes,
  loading,
  onSelectRecipe,
  layout = "row",
}: Props) {
  const router = useRouter();
  const isGrid = layout === "grid";

  const cards = recipes.map((recipe) => (
    <Pressable
      key={recipe.id}
      style={[
        styles.card,
        isGrid ? styles.recentRecipeCardGrid : styles.recentRecipeCard,
      ]}
      onPress={() => onSelectRecipe(recipe.id)}
    >
      {recipe.coverImageUrl ? (
        <Image
          source={{ uri: recipe.coverImageUrl }}
          style={styles.recentRecipeThumb}
        />
      ) : (
        <View
          style={[styles.recentRecipeThumb, styles.recentRecipeThumbPlaceholder]}
        >
          <Feather name="image" size={20} color={colors.accentTertiary} />
        </View>
      )}
      <Text style={styles.recentRecipeTitle} numberOfLines={2}>
        {recipe.title}
      </Text>
    </Pressable>
  ));

  return (
    <View>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Recettes récentes</Text>
        <Pressable onPress={() => router.push("/recipes")}>
          <Text style={styles.sectionLink}>Voir tout →</Text>
        </Pressable>
      </View>

      {!loading && !recipes.length ? (
        <View style={[styles.card, styles.recentRecipesEmpty]}>
          <Text style={styles.recentRecipesEmptyText}>
            Ajoute ta première recette pour la retrouver ici.
          </Text>
        </View>
      ) : isGrid ? (
        <View style={styles.recentRecipesGrid}>{cards}</View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentRecipesRow}
        >
          {cards}
        </ScrollView>
      )}
    </View>
  );
}
