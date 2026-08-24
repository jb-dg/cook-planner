import { Feather } from "@expo/vector-icons";
import { Session } from "@supabase/supabase-js";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import PhysicalButtonAnimated from "../../../components/PhysicalButtonAnimated";
import { colors, spacing } from "../../../theme/design";
import { MealKey } from "../utils/types";

type Props = {
  slot: { key: MealKey; label: string };
  meal: { recipe: string };
  session: Session | null;
  recipesLength: number;
  syncing: boolean;
  saving: boolean;
  recipesLoading: boolean;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  onOpenRecipePicker: () => void;
  onRemove: () => void;
};

export const DayMealCard = ({
  slot,
  meal,
  session,
  recipesLength,
  syncing,
  saving,
  recipesLoading,
  onChangeText,
  onBlur,
  onOpenRecipePicker,
  onRemove,
}: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const filled = !!meal.recipe?.trim();
  const isLunch = slot.key === "lunch";
  const slotLabel = isLunch ? "Déjeuner" : "Dîner";
  const disabled = syncing || saving;

  const startEditing = () => {
    setDraft(meal.recipe ?? "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraft("");
  };

  const handleSave = () => {
    const value = draft.trim();
    if (!value) {
      // Matches the reference behavior: an empty save just cancels — it
      // never clears an already-filled slot.
      cancelEditing();
      return;
    }
    onChangeText(value);
    onBlur();
    setIsEditing(false);
    setDraft("");
  };

  const handlePickFromRecipes = () => {
    setIsEditing(false);
    setDraft("");
    onOpenRecipePicker();
  };

  // Editing an already-filled slot: white input on the cream card, "Enregistrer".
  if (isEditing && filled) {
    return (
      <View style={[styles.card, styles.cardCream]}>
        <Text style={[styles.slotLabel, styles.slotLabelMuted]}>
          {slotLabel.toUpperCase()}
        </Text>

        <TextInput
          value={draft}
          onChangeText={setDraft}
          autoFocus
          editable={!disabled}
          placeholder="Nom du plat"
          placeholderTextColor={colors.muted}
          style={styles.inputFilled}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        <View style={styles.editActionsRow}>
          <PhysicalButtonAnimated
            variant="primary"
            onPress={handleSave}
            disabled={disabled}
            borderRadius={12}
            innerStyle={styles.saveButtonInner}
          >
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          </PhysicalButtonAnimated>

          <PhysicalButtonAnimated
            variant="secondary"
            onPress={handlePickFromRecipes}
            disabled={disabled || recipesLoading || !session}
            borderRadius={12}
            innerStyle={styles.recipesButtonInner}
            accessibilityLabel="Choisir depuis mes recettes"
          >
            <Feather name="book-open" size={14} color={colors.accent} />
            <Text style={styles.recipesButtonText}>Recettes</Text>
          </PhysicalButtonAnimated>

          <Pressable onPress={cancelEditing} hitSlop={10} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Filled, read view: label + pencil, dish name, dot row (lunch only).
  if (filled) {
    return (
      <View style={[styles.card, styles.cardCream]}>
        <View style={styles.slotHeader}>
          <Text style={[styles.slotLabel, styles.slotLabelMuted]}>
            {slotLabel.toUpperCase()}
          </Text>
          <View style={styles.slotHeaderActions}>
            <Pressable
              hitSlop={10}
              onPress={startEditing}
              disabled={disabled}
              style={[styles.recipeBtn, disabled && styles.recipeBtnDisabled]}
              accessibilityLabel={`Modifier le ${isLunch ? "déjeuner" : "dîner"}`}
            >
              <Feather name="edit-2" size={15} color={colors.accent} />
            </Pressable>
            <Pressable
              hitSlop={10}
              onPress={onRemove}
              disabled={disabled}
              style={[styles.recipeBtn, disabled && styles.recipeBtnDisabled]}
              accessibilityLabel={`Retirer le ${isLunch ? "déjeuner" : "dîner"}`}
            >
              <Feather name="x" size={16} color={colors.muted} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.dishName} numberOfLines={2}>
          {meal.recipe}
        </Text>

        {isLunch ? (
          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: colors.accent }]} />
            <View style={[styles.dot, { backgroundColor: "#E8B98A" }]} />
          </View>
        ) : null}
      </View>
    );
  }

  // Empty: dashed card, always-visible "browse recipes" row, plus an
  // inline quick-add row that turns into a text input on tap.
  return (
    <View style={[styles.card, styles.cardEmpty]}>
      <Text style={[styles.slotLabel, styles.slotLabelAccent]}>
        {slotLabel.toUpperCase()}
      </Text>

      <Pressable
        style={styles.addRow}
        onPress={onOpenRecipePicker}
        disabled={disabled || recipesLoading}
      >
        <View style={styles.addCircle}>
          <Feather name="plus" size={16} color={colors.accent} />
        </View>
        <View style={styles.addTextBlock}>
          <Text style={styles.addText}>
            Ajouter {isLunch ? "un déjeuner" : "un dîner"}
          </Text>
          <Text style={styles.addSubtext}>
            Rechercher une recette ou saisir directement
          </Text>
        </View>
      </Pressable>

      {isEditing ? (
        <>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            autoFocus
            editable={!disabled}
            placeholder="Saisir directement..."
            placeholderTextColor={colors.muted}
            style={styles.inputQuick}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <View style={styles.quickSaveWrapper}>
            <PhysicalButtonAnimated
              variant="primary"
              onPress={handleSave}
              disabled={disabled || !draft.trim()}
              borderRadius={12}
              innerStyle={styles.saveButtonInner}
            >
              <Text style={styles.saveButtonText}>Ajouter</Text>
            </PhysicalButtonAnimated>
          </View>
        </>
      ) : (
        <Pressable onPress={startEditing} disabled={disabled} style={styles.quickInputRow}>
          <Text style={styles.quickInputText}>Saisir directement…</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
  },
  cardCream: {
    backgroundColor: colors.surfaceWarm,
  },
  cardEmpty: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#E6D3B8",
  },
  slotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  slotLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  slotLabelMuted: {
    color: colors.muted,
  },
  slotLabelAccent: {
    color: colors.accent,
    marginBottom: 12,
  },
  slotHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recipeBtn: {
    padding: 4,
  },
  recipeBtnDisabled: {
    opacity: 0.4,
  },
  dishName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginTop: 6,
    marginBottom: 8,
  },
  dotRow: {
    flexDirection: "row",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  inputFilled: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 10,
  },
  editActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  saveButtonInner: {
    paddingHorizontal: 16,
    minHeight: 40,
    paddingVertical: 0,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  recipesButtonInner: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 40,
    paddingVertical: 0,
  },
  recipesButtonText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 12,
  },
  cancelButton: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cancelButtonText: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE3D2",
  },
  addCircle: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  addTextBlock: {
    flexShrink: 1,
    gap: 1,
  },
  addText: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 17,
  },
  addSubtext: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 13,
  },
  quickInputRow: {
    marginTop: 14,
    minHeight: 24,
    justifyContent: "center",
  },
  quickInputText: {
    fontSize: 15,
    color: "#B3A88F",
    fontWeight: "600",
  },
  quickSaveWrapper: {
    marginTop: 10,
    alignSelf: "flex-start",
  },
  inputQuick: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginTop: 14,
  },
});
