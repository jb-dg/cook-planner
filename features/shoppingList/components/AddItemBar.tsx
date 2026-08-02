import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { colors, radii } from "@/theme/design";

type Props = {
  onSubmit: (name: string, quantity: string, unit: string) => void;
};

export const AddItemBar = ({ onSubmit }: Props) => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit(name, quantity, unit);
    setName("");
    setQuantity("");
    setUnit("");
  };

  return (
    <View style={styles.row}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Ajouter un article"
        placeholderTextColor={colors.muted}
        style={[styles.input, styles.nameInput]}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
      />
      <TextInput
        value={quantity}
        onChangeText={setQuantity}
        placeholder="Qté"
        placeholderTextColor={colors.muted}
        style={[styles.input, styles.smallInput]}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
      />
      <TextInput
        value={unit}
        onChangeText={setUnit}
        placeholder="Unité"
        placeholderTextColor={colors.muted}
        style={[styles.input, styles.smallInput]}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
      />
      <Pressable
        style={[styles.addButton, !name.trim() && styles.addButtonDisabled]}
        onPress={handleSubmit}
        disabled={!name.trim()}
        accessibilityRole="button"
        accessibilityLabel="Ajouter l'article"
      >
        <Feather name="plus" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  nameInput: {
    flex: 1,
    minWidth: 0,
  },
  smallInput: {
    width: 64,
    flexShrink: 0,
  },
  addButton: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
});
