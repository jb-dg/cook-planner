import { Feather } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";

import { colors, radii, spacing } from "@/theme/design";

import type { RecipeBook } from "../books";

type Props = {
  visible: boolean;
  recipeTitle: string;
  currentBookName: string;
  // Custom books the recipe can move into — the caller filters out the
  // system book and the recipe's current book.
  targetBooks: RecipeBook[];
  onSelectBook: (bookId: string) => void;
  onClose: () => void;
};

export default function MoveRecipeToBookModal({
  visible,
  recipeTitle,
  currentBookName,
  targetBooks,
  onSelectBook,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Text style={styles.title} numberOfLines={1}>
              Déplacer «&nbsp;{recipeTitle}&nbsp;»
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Actuellement dans «&nbsp;{currentBookName}&nbsp;»
            </Text>
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={18} color={colors.text} />
          </Pressable>
        </View>

        {targetBooks.length ? (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {targetBooks.map((book) => (
              <Pressable
                key={book.id}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => onSelectBook(book.id)}
              >
                <View style={styles.rowIcon}>
                  {book.emoji ? (
                    <Text style={styles.rowIconEmoji}>{book.emoji}</Text>
                  ) : (
                    <Feather name="book-open" size={14} color={colors.accent} />
                  )}
                </View>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {book.name}
                </Text>
                <Feather name="chevron-right" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Aucun autre livre pour l’instant. Crée-en un depuis l’écran des livres pour pouvoir y
              déplacer cette recette.
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "80%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.card,
    gap: spacing.base,
    shadowColor: "rgba(66, 58, 50, 0.25)",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 8,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.cardBorder,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  list: {
    marginTop: 4,
  },
  listContent: {
    gap: 8,
    paddingBottom: spacing.base,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(188, 108, 37, 0.1)",
  },
  rowIconEmoji: {
    fontSize: 14,
  },
  rowTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  emptyState: {
    padding: spacing.base,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
  },
  emptyText: {
    color: colors.muted,
    textAlign: "center",
  },
});
