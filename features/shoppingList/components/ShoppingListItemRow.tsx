import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing } from "@/theme/design";

import type { ShoppingListItem } from "../types";

type Props = {
  item: ShoppingListItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export const ShoppingListItemRow = ({ item, onToggle, onDelete }: Props) => {
  const quantityLabel = [item.quantity, item.unit].filter(Boolean).join(" ");

  return (
    <View style={[styles.row, item.isChecked && styles.rowChecked]}>
      <Pressable
        style={[styles.checkbox, item.isChecked && styles.checkboxChecked]}
        onPress={() => onToggle(item.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.isChecked }}
        accessibilityLabel={`Cocher ${item.name}`}
      >
        {item.isChecked && <Feather name="check" size={14} color="#FFFFFF" />}
      </Pressable>

      <View style={styles.info}>
        <Text
          style={[styles.name, item.isChecked && styles.nameChecked]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        {quantityLabel ? (
          <Text style={styles.quantity}>{quantityLabel}</Text>
        ) : null}
      </View>

      <Pressable
        style={styles.deleteButton}
        onPress={() => onDelete(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`Supprimer ${item.name}`}
      >
        <Feather name="trash-2" size={16} color={colors.muted} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.base,
  },
  rowChecked: {
    backgroundColor: colors.surfaceAlt,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  nameChecked: {
    color: colors.muted,
    textDecorationLine: "line-through",
  },
  quantity: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
