import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, radii } from "../../../theme/design";
import {
  createEmptyFormState,
  createIngredient,
  DIFFICULTIES,
  INGREDIENT_UNITS,
  Ingredient,
  RecipeFormState,
  RecipeInput,
} from "./types";

type RecipeFormProps = {
  initialValues?: RecipeFormState;
  submitLabel: string;
  onSubmit: (values: RecipeInput) => Promise<void>;
};

export default function RecipeForm({
  initialValues,
  submitLabel,
  onSubmit,
}: RecipeFormProps) {
  const [form, setForm] = useState<RecipeFormState>(
    initialValues ?? createEmptyFormState()
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setForm(initialValues);
    }
  }, [initialValues]);

  const canSubmit = useMemo(() => {
    return (
      Boolean(form.title.trim()) &&
      Boolean(form.description.trim()) &&
      Number(form.servings) > 0 &&
      form.ingredients.some(
        (item) => item.name.trim() && item.quantity.trim()
      ) &&
      !submitting
    );
  }, [form, submitting]);

  const handleIngredientChange = (
    id: string,
    field: "name" | "quantity" | "unit",
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleAddIngredient = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, createIngredient()],
    }));
  };

  const handleRemoveIngredient = (id: string) => {
    setForm((prev) => ({
      ...prev,
      ingredients:
        prev.ingredients.length === 1
          ? prev.ingredients
          : prev.ingredients.filter((item) => item.id !== id),
    }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const preparedIngredients = form.ingredients
      .filter((item) => item.name.trim() && item.quantity.trim())
      .map((item) => ({
        id: item.id,
        name: item.name.trim(),
        quantity: item.quantity.trim(),
        unit: item.unit,
      }));

    const payload: RecipeInput = {
      title: form.title.trim(),
      duration: form.duration.trim(),
      description: form.description.trim(),
      servings: Number(form.servings) || 1,
      difficulty: form.difficulty,
      ingredients: preparedIngredients,
    };

    try {
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.form}>
      <TextInput
        placeholder="Titre"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={form.title}
        onChangeText={(value) => setForm((prev) => ({ ...prev, title: value }))}
        editable={!submitting}
      />
      <TextInput
        placeholder="Durée (optionnel)"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={form.duration}
        onChangeText={(value) =>
          setForm((prev) => ({ ...prev, duration: value }))
        }
        editable={!submitting}
      />
      <View style={styles.inlineRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Nombre de personnes</Text>
          <TextInput
            placeholder="4"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={form.servings}
            onChangeText={(value) =>
              setForm((prev) => ({ ...prev, servings: value }))
            }
            editable={!submitting}
            keyboardType="number-pad"
          />
        </View>
      </View>
      <View>
        <Text style={styles.label}>Difficulté</Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTIES.map((item) => (
            <Pressable
              key={item}
              style={[
                styles.difficultyChip,
                form.difficulty === item && styles.difficultyChipActive,
              ]}
              onPress={() =>
                setForm((prev) => ({ ...prev, difficulty: item }))
              }
              disabled={submitting}
            >
              <Text
                style={[
                  styles.difficultyChipText,
                  form.difficulty === item && styles.difficultyChipTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View>
        <Text style={styles.label}>Ingrédients</Text>
        <View style={styles.ingredientsEditor}>
          {form.ingredients.map((ingredient, index) => (
            <View key={ingredient.id} style={styles.ingredientCard}>
              <View style={styles.ingredientHeader}>
                <Text style={styles.ingredientHeading}>
                  Ingrédient {index + 1}
                </Text>
                {form.ingredients.length > 1 ? (
                  <Pressable
                    onPress={() => handleRemoveIngredient(ingredient.id)}
                    hitSlop={8}
                  >
                    <Text style={styles.removeText}>Supprimer</Text>
                  </Pressable>
                ) : null}
              </View>
              <TextInput
                placeholder="Nom (ex: Carottes)"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={ingredient.name}
                onChangeText={(value) =>
                  handleIngredientChange(ingredient.id, "name", value)
                }
                editable={!submitting}
              />
              <View style={styles.ingredientInputsRow}>
                <TextInput
                  placeholder="Quantité"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, styles.quantityInput]}
                  value={ingredient.quantity}
                  onChangeText={(value) =>
                    handleIngredientChange(ingredient.id, "quantity", value)
                  }
                  editable={!submitting}
                  keyboardType="decimal-pad"
                />
                <View style={styles.unitRow}>
                  {INGREDIENT_UNITS.map((unit) => (
                    <Pressable
                      key={unit}
                      style={[
                        styles.unitChip,
                        ingredient.unit === unit && styles.unitChipActive,
                      ]}
                      onPress={() =>
                        handleIngredientChange(ingredient.id, "unit", unit)
                      }
                      disabled={submitting}
                    >
                      <Text
                        style={[
                          styles.unitChipText,
                          ingredient.unit === unit && styles.unitChipTextActive,
                        ]}
                      >
                        {unit}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ))}
          <Pressable
            style={styles.addIngredientButton}
            onPress={handleAddIngredient}
            disabled={submitting}
          >
            <Text style={styles.addIngredientText}>
              + Ajouter un ingrédient
            </Text>
          </Pressable>
        </View>
      </View>
      <TextInput
        placeholder="Descriptif (étapes, astuces, etc.)"
        placeholderTextColor={colors.muted}
        style={[styles.input, styles.notesInput]}
        value={form.description}
        onChangeText={(value) =>
          setForm((prev) => ({ ...prev, description: value }))
        }
        multiline
        numberOfLines={4}
        editable={!submitting}
      />
      <Pressable
        disabled={!canSubmit}
        onPress={handleSubmit}
        style={[styles.saveButton, !canSubmit && styles.saveButtonDisabled]}
      >
        <Text style={styles.saveButtonText}>
          {submitting ? "Enregistrement…" : submitLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  inlineRow: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  notesInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  label: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  difficultyRow: {
    flexDirection: "row",
    gap: 8,
  },
  difficultyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
  },
  difficultyChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  difficultyChipText: {
    color: colors.text,
    fontWeight: "500",
  },
  difficultyChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  ingredientsEditor: {
    gap: 12,
  },
  ingredientCard: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    padding: 12,
    gap: 10,
    backgroundColor: colors.surface,
  },
  ingredientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ingredientHeading: {
    fontWeight: "600",
    color: colors.text,
  },
  removeText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
  ingredientInputsRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  quantityInput: {
    flex: 1,
  },
  unitRow: {
    flexDirection: "row",
    gap: 6,
  },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
  },
  unitChipActive: {
    backgroundColor: colors.accentSecondary,
    borderColor: colors.accentSecondary,
  },
  unitChipText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 12,
  },
  unitChipTextActive: {
    color: "#fff",
  },
  addIngredientButton: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  addIngredientText: {
    color: colors.text,
    fontWeight: "600",
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
