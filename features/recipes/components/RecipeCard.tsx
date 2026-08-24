import { Feather } from "@expo/vector-icons";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import PhysicalButtonAnimated from "@/components/PhysicalButtonAnimated";
import { colors } from "@/theme/design";

import type { Recipe } from "../types";
import { formatDurationLabel } from "../types";
import { styles as booksStyles } from "../screens/recipeBooksStyles";

// Must match recipeCardShadow/recipeCardSurface's own borderRadius in
// recipeBooksStyles.ts — the compact thumb's top corners borrow this value
// directly so the two can never drift out of sync.
const CARD_RADIUS = 24;

type Props = {
  recipe: Recipe;
  onView: () => void;
  removable?: boolean;
  onRemove?: () => void;
  // Grid mode (iPad): fixed card height so a row of four lines up
  // regardless of content length. Both modes open the recipe on tap —
  // "Modifier" lives in the view modal's own footer button instead of a
  // second button on the card.
  compact?: boolean;
};

// Shared by the phone book-detail list and the iPad recipe grid — pulls its
// core visual styles from recipeBooksStyles so both stay in sync.
export default function RecipeCard({
  recipe,
  onView,
  removable,
  onRemove,
  compact,
}: Props) {
  const hasImage = !!(recipe.coverImageUrl || recipe.imageUrls[0]);

  const thumbnail = compact ? (
    hasImage ? (
      <Image
        source={{ uri: recipe.coverImageUrl || recipe.imageUrls[0] }}
        style={localStyles.compactThumb}
      />
    ) : (
      // Same footprint as a real photo so every card stays the same height
      // whether or not the recipe has one.
      <View
        style={[localStyles.compactThumb, localStyles.thumbPlaceholder]}
      >
        <Feather name="image" size={24} color={colors.accentTertiary} />
      </View>
    )
  ) : hasImage ? (
    <Image
      source={{ uri: recipe.coverImageUrl || recipe.imageUrls[0] }}
      style={booksStyles.recipeThumb}
    />
  ) : null;

  const header = (
    <>
      <View
        style={[
          booksStyles.recipeHeader,
          // No photo above it on the phone card: the "RECETTE" label would
          // otherwise sit almost flush against the card's (near-zero)
          // top padding.
          !compact && !hasImage && localStyles.noPhotoHeaderSpacing,
        ]}
      >
        <View style={booksStyles.recipeHeadingBlock}>
          <Text style={booksStyles.recipeEyebrow}>Recette</Text>
          <Text
            style={[
              booksStyles.recipeTitle,
              compact && localStyles.compactTitle,
            ]}
            numberOfLines={2}
          >
            {recipe.title}
          </Text>
        </View>
      </View>

      <View
        style={[booksStyles.recipeMeta, compact && localStyles.compactMetaRow]}
      >
        <View
          style={[
            booksStyles.metaChip,
            booksStyles.metaChipAccent,
            compact && localStyles.compactMetaChip,
          ]}
        >
          <Text
            style={[
              booksStyles.metaChipText,
              booksStyles.metaChipTextAccent,
              compact && localStyles.compactMetaChipText,
            ]}
          >
            {recipe.difficulty}
          </Text>
        </View>
        {/* iPad grid: keep just difficulty + prep time — servings is dropped
            to leave more room for the title at this card size. */}
        {!compact ? (
          <View style={booksStyles.metaChip}>
            <Text style={booksStyles.metaChipText}>
              {recipe.servings} pers.
            </Text>
          </View>
        ) : null}
        {recipe.duration ? (
          <View
            style={[
              booksStyles.metaChip,
              compact && localStyles.compactMetaChip,
            ]}
          >
            <Text
              style={[
                booksStyles.metaChipText,
                compact && localStyles.compactMetaChipText,
              ]}
            >
              {formatDurationLabel(recipe.duration)}
            </Text>
          </View>
        ) : null}
      </View>
    </>
  );

  const removeButton =
    removable && onRemove ? (
      <PhysicalButtonAnimated
        variant="secondary"
        onPress={onRemove}
        innerStyle={localStyles.membershipButtonInner}
      >
        <Feather name="minus-circle" size={14} color="#6B705C" />
        <Text style={localStyles.membershipButtonText}>Retirer du livre</Text>
      </PhysicalButtonAnimated>
    ) : null;

  if (compact) {
    return (
      <Pressable
        onPress={onView}
        style={({ pressed }) => [
          booksStyles.recipeCardShadow,
          pressed && localStyles.pressed,
        ]}
      >
        {Platform.OS === "android" && (
          <View pointerEvents="none" style={booksStyles.recipeAndroidShadow} />
        )}
        {/* Photo sits outside the padded body and bleeds to the card's
            edges — the surface's own overflow:hidden clips it to the
            rounded corners, so it needs no radius of its own. */}
        <View
          style={[booksStyles.recipeCardSurface, localStyles.compactSurface]}
        >
          {thumbnail}
          <View style={localStyles.compactBody}>
            {header}
            {removeButton}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onView}
      style={({ pressed }) => [
        booksStyles.recipeCardShadow,
        pressed && localStyles.pressed,
      ]}
    >
      {Platform.OS === "android" && (
        <View pointerEvents="none" style={booksStyles.recipeAndroidShadow} />
      )}
      <View style={booksStyles.recipeCardSurface}>
        {thumbnail}
        {header}
        {removeButton}
      </View>
    </Pressable>
  );
}

const localStyles = StyleSheet.create({
  membershipButtonInner: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
  },
  membershipButtonText: {
    color: "#6B705C",
    fontSize: 13,
    fontWeight: "700",
  },
  noPhotoHeaderSpacing: {
    marginTop: 10,
  },
  // Zeroes out each specific padding edge rather than the `padding`
  // shorthand — recipeCardSurface sets paddingHorizontal/Top/Bottom
  // individually, and those more specific keys win over a generic
  // `padding` when the two styles are merged, so the shorthand alone left
  // the photo inset instead of flush with the card.
  compactSurface: {
    height: 248,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    gap: 0,
    overflow: "hidden",
  },
  // Padding lives here instead of on the surface, so the photo above it can
  // bleed edge to edge instead of sitting in a bordered inset.
  compactBody: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 12,
  },
  // Deliberately doesn't reuse booksStyles.recipeThumb: that style carries
  // an aspectRatio (16/9), and on <Image> — unlike a plain <View> —
  // aspectRatio wins over an explicit width even when width is also set,
  // so the photo rendered at height*aspectRatio instead of the card's full
  // width (photos ended up ~40% too narrow on iPad). Defining the compact
  // thumb from scratch, with height but no aspectRatio at all, avoids that.
  // A fixed height (rather than an aspect ratio) also means the grid's
  // column count changing the card's width can't throw off the
  // fixed-height budget below and push the meta chips past the card's
  // overflow:hidden bottom edge. Image defaults to resizeMode "cover", so
  // it still fills the frame at any width.
  compactThumb: {
    width: "100%",
    height: 118,
    borderRadius: CARD_RADIUS,
    backgroundColor: "#F5EFE4",
  },
  compactTitle: {
    fontSize: 16,
    lineHeight: 20,
    minHeight: 40,
  },
  // Smaller and non-wrapping so difficulty + prep time always sit side by
  // side at this card width instead of the second chip dropping to its own
  // line.
  compactMetaRow: {
    flexWrap: "nowrap",
  },
  compactMetaChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  compactMetaChipText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
});
