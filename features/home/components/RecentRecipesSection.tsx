import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

import type { Recipe } from "@/features/recipes/types";
import { colors } from "@/theme/design";

import { styles } from "../screens/homeScreenStyles";

type Props = {
  recipes: Recipe[];
  loading: boolean;
  onSelectRecipe: (recipeId: string) => void;
};

export default function RecentRecipesSection({
  recipes,
  loading,
  onSelectRecipe,
}: Props) {
  const router = useRouter();

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
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentRecipesRow}
        >
          {recipes.map((recipe) => (
            <Pressable
              key={recipe.id}
              style={[styles.card, styles.recentRecipeCard]}
              onPress={() => onSelectRecipe(recipe.id)}
            >
              {recipe.coverImageUrl ? (
                <Image
                  source={{ uri: recipe.coverImageUrl }}
                  style={styles.recentRecipeThumb}
                />
              ) : (
                <View
                  style={[
                    styles.recentRecipeThumb,
                    styles.recentRecipeThumbPlaceholder,
                  ]}
                >
                  <Feather name="image" size={20} color={colors.accentTertiary} />
                </View>
              )}
              <Text style={styles.recentRecipeTitle} numberOfLines={2}>
                {recipe.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
