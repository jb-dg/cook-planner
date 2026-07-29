import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
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
  createRecipeStep,
  DIFFICULTIES,
  INGREDIENT_UNITS,
  RecipeFormState,
  RecipeInput,
} from "../../../features/recipes/types";
import { pickAndUploadImage } from "../../../lib/mediaUpload";

type RecipeFormProps = {
  initialValues?: RecipeFormState;
  submitLabel: string;
  uploadPathPrefix?: string;
  onSubmit: (values: RecipeInput) => Promise<void>;
};

export default function RecipeForm({
  initialValues,
  submitLabel,
  uploadPathPrefix,
  onSubmit,
}: RecipeFormProps) {
  const [form, setForm] = useState<RecipeFormState>(
    initialValues ?? createEmptyFormState()
  );
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setForm(initialValues);
    }
  }, [initialValues]);

  const canSubmit = useMemo(() => {
    return (
      Boolean(form.title.trim()) &&
      Number(form.servings) > 0 &&
      form.ingredients.some(
        (item) => item.name.trim() && item.quantity.trim()
      ) &&
      form.steps.some((item) => item.text.trim()) &&
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

  const handleStepChange = (id: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((item) =>
        item.id === id ? { ...item, text: value } : item
      ),
    }));
  };

  const handleAddStep = () => {
    setForm((prev) => ({
      ...prev,
      steps: [...prev.steps, createRecipeStep(prev.steps.length + 1)],
    }));
  };

  const handleRemoveStep = (id: string) => {
    setForm((prev) => {
      const nextSteps =
        prev.steps.length === 1
          ? prev.steps
          : prev.steps.filter((item) => item.id !== id);

      return {
        ...prev,
        steps: nextSteps.map((item, index) => ({ ...item, order: index + 1 })),
      };
    });
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
      steps: form.steps
        .filter((item) => item.text.trim())
        .map((item, index) => ({
          ...item,
          order: index + 1,
          text: item.text.trim(),
        })),
      source_url: form.sourceUrl.trim() || null,
      image_urls: form.imageUrls,
      cover_image_url: form.coverImageUrl || form.imageUrls[0] || null,
    };

    try {
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddImage = async () => {
    if (!uploadPathPrefix || uploadingImage) return;
    setUploadingImage(true);
    try {
      const url = await pickAndUploadImage({
        pathPrefix: uploadPathPrefix,
        fileNamePrefix: "recipe",
        aspect: [4, 3],
      });

      if (!url) return;

      setForm((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, url],
        coverImageUrl: prev.coverImageUrl || url,
      }));
    } catch (error) {
      console.error("upload recipe image", error);
      if (error instanceof Error && error.message === "media-bucket-not-found") {
        Alert.alert(
          "Migration Supabase requise",
          "Le bucket media n'existe pas encore. Applique la migration Supabase puis réessaie."
        );
        return;
      }
      Alert.alert(
        "Erreur",
        "Impossible d'ajouter cette photo. Vérifie les permissions et réessaie."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (url: string) => {
    setForm((prev) => {
      const nextUrls = prev.imageUrls.filter((item) => item !== url);
      return {
        ...prev,
        imageUrls: nextUrls,
        coverImageUrl:
          prev.coverImageUrl === url ? nextUrls[0] ?? "" : prev.coverImageUrl,
      };
    });
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
              onPress={() => setForm((prev) => ({ ...prev, difficulty: item }))}
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
      <View style={styles.photosSection}>
        <View style={styles.photosHeader}>
          <Text style={styles.label}>Photos</Text>
          <Pressable
            style={[styles.addPhotoButton, uploadingImage && styles.buttonDisabled]}
            onPress={handleAddImage}
            disabled={!uploadPathPrefix || uploadingImage}
          >
            <Text style={styles.addPhotoText}>
              {uploadingImage ? "Upload..." : "+ Ajouter"}
            </Text>
          </Pressable>
        </View>
        {form.imageUrls.length ? (
          <View style={styles.photoGrid}>
            {form.imageUrls.map((url) => {
              const isCover = (form.coverImageUrl || form.imageUrls[0]) === url;
              return (
                <View key={url} style={styles.photoTile}>
                  <Image source={{ uri: url }} style={styles.photoPreview} />
                  <View style={styles.photoActions}>
                    <Pressable
                      style={[styles.photoAction, isCover && styles.photoActionActive]}
                      onPress={() =>
                        setForm((prev) => ({ ...prev, coverImageUrl: url }))
                      }
                    >
                      <Text
                        style={[
                          styles.photoActionText,
                          isCover && styles.photoActionTextActive,
                        ]}
                      >
                        {isCover ? "Couverture" : "Définir"}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.photoAction}
                      onPress={() => handleRemoveImage(url)}
                    >
                      <Text style={styles.photoRemoveText}>Retirer</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.helperText}>Aucune photo ajoutée.</Text>
        )}
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
        placeholder="Note ou introduction (optionnel)"
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
      <View>
        <Text style={styles.label}>Étapes</Text>
        <View style={styles.ingredientsEditor}>
          {form.steps.map((recipeStep, index) => (
            <View key={recipeStep.id} style={styles.ingredientCard}>
              <View style={styles.ingredientHeader}>
                <Text style={styles.ingredientHeading}>Étape {index + 1}</Text>
                {form.steps.length > 1 ? (
                  <Pressable
                    onPress={() => handleRemoveStep(recipeStep.id)}
                    hitSlop={8}
                  >
                    <Text style={styles.removeText}>Supprimer</Text>
                  </Pressable>
                ) : null}
              </View>
              <TextInput
                placeholder="Décris cette étape"
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.stepInput]}
                value={recipeStep.text}
                onChangeText={(value) => handleStepChange(recipeStep.id, value)}
                multiline
                numberOfLines={3}
                editable={!submitting}
              />
            </View>
          ))}
          <Pressable
            style={styles.addIngredientButton}
            onPress={handleAddStep}
            disabled={submitting}
          >
            <Text style={styles.addIngredientText}>+ Ajouter une étape</Text>
          </Pressable>
        </View>
      </View>
      <TextInput
        placeholder="Lien source (optionnel)"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={form.sourceUrl}
        onChangeText={(value) =>
          setForm((prev) => ({ ...prev, sourceUrl: value }))
        }
        autoCapitalize="none"
        keyboardType="url"
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
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    padding: 14,
    fontSize: 15,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  notesInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  stepInput: {
    minHeight: 86,
    textAlignVertical: "top",
  },
  label: {
    fontSize: 11,
    color: colors.accentTertiary,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  helperText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  photosSection: {
    gap: 10,
  },
  photosHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  addPhotoButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(188, 108, 37, 0.3)",
    backgroundColor: "rgba(188, 108, 37, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addPhotoText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  photoTile: {
    width: 138,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
  },
  photoPreview: {
    width: "100%",
    height: 104,
    backgroundColor: colors.surfaceAlt,
  },
  photoActions: {
    gap: 6,
    padding: 8,
  },
  photoAction: {
    minHeight: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  photoActionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  photoActionText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  photoActionTextActive: {
    color: "#FFFFFF",
  },
  photoRemoveText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: "800",
  },
  difficultyRow: {
    flexDirection: "row",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  difficultyChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.lg,
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
    fontWeight: "600",
  },
  difficultyChipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  ingredientsEditor: {
    gap: 12,
  },
  ingredientCard: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 16,
    gap: 12,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    shadowColor: "rgba(107, 112, 92, 0.15)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  ingredientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ingredientHeading: {
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.accentTertiary,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
  },
  unitChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
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
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  addIngredientText: {
    color: colors.accentTertiary,
    fontWeight: "700",
    fontSize: 14,
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
