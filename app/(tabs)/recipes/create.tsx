import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../../contexts/AuthContext";
import WebFooter from "../../../components/WebFooter";
import {
  AddRecipeDraft,
  canContinueFromReview,
  canContinueFromSource,
  createEmptyAddRecipeDraft,
  getExtractionFromSource,
  getMissingFields,
  parseStoredAddRecipeDraft,
  RecipeSourceType,
  toRecipeInput,
} from "../../../features/recipes/addFlow";
import {
  buildBooksStorageKey,
  parseStoredBooks,
  SYSTEM_BOOK_ID,
} from "../../../features/recipes/books";
import {
  createIngredient,
  createRecipeStep,
  DIFFICULTIES,
  INGREDIENT_UNITS,
} from "../../../features/recipes/types";
import { fetchHouseholdScope, HouseholdScope } from "../../../lib/households";
import { supabase } from "../../../lib/supabase";
import { colors, layout, radii, spacing } from "../../../theme/design";

type Step = 1 | 2 | 3;

type SelectableBook = {
  id: string;
  name: string;
  isSystem: boolean;
};

type SourceOption = {
  type: RecipeSourceType;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  disabled?: boolean;
};

const SOURCE_OPTIONS: SourceOption[] = [
  {
    type: "photo",
    label: "Photo",
    description: "Analyse caméra bientôt disponible",
    icon: "camera",
    disabled: true,
  },
  {
    type: "url",
    label: "Lien web",
    description: "Colle une URL de recette",
    icon: "link",
  },
  {
    type: "paste",
    label: "Copier-coller",
    description: "Colle la recette brute",
    icon: "clipboard",
  },
  {
    type: "manual",
    label: "Manuel",
    description: "Saisie guidée pas à pas",
    icon: "edit-3",
  },
];

const MISSING_LABELS: Record<string, string> = {
  title: "Titre",
  ingredients: "Ingrédients",
  steps: "Étapes",
};

const SOURCE_STORAGE_PREFIX = "recipe-add-flow";

const buildDraftStorageKey = (userId: string, householdId: string | null) =>
  `${SOURCE_STORAGE_PREFIX}:${householdId ?? `user-${userId}`}`;

const toRouteParam = (value: string | string[] | undefined): string | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
};

const stepTitle = (step: Step) => {
  if (step === 1) return "1. Importer";
  if (step === 2) return "2. Révision auto";
  return "3. Finaliser";
};

export default function CreateRecipeScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const { bookId } = useLocalSearchParams<{ bookId?: string | string[] }>();
  const routeBookId = toRouteParam(bookId);

  const [scope, setScope] = useState<HouseholdScope | null>(null);
  const [customBooks, setCustomBooks] = useState<
    { id: string; name: string; recipeIds: string[] }[]
  >([]);
  const [booksLoading, setBooksLoading] = useState(true);

  const [draft, setDraft] = useState<AddRecipeDraft>(() =>
    createEmptyAddRecipeDraft(routeBookId)
  );
  const [step, setStep] = useState<Step>(1);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const extractionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (extractionTimerRef.current) {
        clearTimeout(extractionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setScope(null);
      return;
    }

    let cancelled = false;
    fetchHouseholdScope(session.user.id)
      .then((nextScope) => {
        if (cancelled) return;
        setScope(nextScope);
      })
      .catch((error) => {
        console.error("fetch household scope", error);
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  const booksStorageKey = useMemo(() => {
    if (!session || !scope) return null;
    return buildBooksStorageKey(session.user.id, scope.householdId);
  }, [session, scope]);

  const draftStorageKey = useMemo(() => {
    if (!session || !scope) return null;
    return buildDraftStorageKey(session.user.id, scope.householdId);
  }, [session, scope]);

  useEffect(() => {
    let cancelled = false;

    if (!booksStorageKey) {
      setCustomBooks([]);
      setBooksLoading(false);
      return;
    }

    setBooksLoading(true);
    AsyncStorage.getItem(booksStorageKey)
      .then((value) => {
        if (cancelled) return;
        setCustomBooks(parseStoredBooks(value));
      })
      .catch((error) => {
        console.error("load recipe books", error);
        if (!cancelled) {
          setCustomBooks([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBooksLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [booksStorageKey]);

  useEffect(() => {
    let cancelled = false;

    if (!draftStorageKey) {
      setDraft(createEmptyAddRecipeDraft(routeBookId));
      setDraftHydrated(true);
      return;
    }

    setDraftHydrated(false);

    AsyncStorage.getItem(draftStorageKey)
      .then((value) => {
        if (cancelled) return;

        const restored = parseStoredAddRecipeDraft(value, routeBookId);
        if (!restored) {
          setDraft(createEmptyAddRecipeDraft(routeBookId));
          return;
        }

        setDraft({
          ...restored,
          bookId: routeBookId ?? restored.bookId,
        });
      })
      .catch((error) => {
        console.error("load add-recipe draft", error);
        if (!cancelled) {
          setDraft(createEmptyAddRecipeDraft(routeBookId));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDraftHydrated(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [draftStorageKey, routeBookId]);

  const books = useMemo<SelectableBook[]>(() => {
    const systemBook: SelectableBook = {
      id: SYSTEM_BOOK_ID,
      name: scope?.householdId ? "Recettes du foyer" : "Toutes les recettes",
      isSystem: true,
    };

    return [
      systemBook,
      ...customBooks.map((book) => ({
        id: book.id,
        name: book.name,
        isSystem: false,
      })),
    ];
  }, [scope?.householdId, customBooks]);

  const selectedBook = useMemo(
    () => books.find((book) => book.id === draft.bookId) ?? books[0] ?? null,
    [books, draft.bookId]
  );

  useEffect(() => {
    if (!draftHydrated || !books.length) return;

    const shouldUseRouteBook =
      routeBookId && books.some((book) => book.id === routeBookId);

    if (shouldUseRouteBook && draft.bookId !== routeBookId) {
      setDraft((prev) => ({ ...prev, bookId: routeBookId }));
      return;
    }

    if (!draft.bookId || !books.some((book) => book.id === draft.bookId)) {
      setDraft((prev) => ({ ...prev, bookId: books[0]?.id ?? SYSTEM_BOOK_ID }));
    }
  }, [books, routeBookId, draft.bookId, draftHydrated]);

  useEffect(() => {
    if (!draftHydrated || !draftStorageKey) return;

    const timeoutId = setTimeout(() => {
      const payload = {
        ...draft,
        updatedAt: new Date().toISOString(),
      };
      AsyncStorage.setItem(draftStorageKey, JSON.stringify(payload))
        .then(() => {
          setLastSavedAt(Date.now());
        })
        .catch((error) => {
          console.error("save add-recipe draft", error);
        });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [draft, draftHydrated, draftStorageKey]);

  const missingFields = useMemo(() => getMissingFields(draft), [draft]);
  const canGoToReview = canContinueFromSource(draft);
  const canGoToFinalize = canContinueFromReview(draft);

  const updateDraft = (updater: (prev: AddRecipeDraft) => AddRecipeDraft) => {
    setDraft((prev) => ({
      ...updater(prev),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSourceTypeChange = (sourceType: RecipeSourceType) => {
    if (sourceType === "photo") {
      Alert.alert(
        "Bientôt disponible",
        "L’analyse photo arrive bientôt. Utilise le lien, le texte ou la saisie manuelle pour le moment."
      );
      return;
    }

    updateDraft((prev) => ({
      ...prev,
      sourceType,
      sourceValue: sourceType === "manual" ? "" : prev.sourceValue,
      extractionStatus: "idle",
      extractionMessage: null,
    }));
  };

  const runExtraction = async () => {
    if (draft.sourceType !== "url" && draft.sourceType !== "paste") {
      updateDraft((prev) => ({
        ...prev,
        extractionStatus: "done",
        extractionMessage: "Saisie manuelle active: complète les champs puis continue.",
      }));
      return;
    }

    updateDraft((prev) => ({
      ...prev,
      extractionStatus: "loading",
      extractionMessage: null,
    }));

    try {
      await new Promise<void>((resolve) => {
        extractionTimerRef.current = setTimeout(() => resolve(), 650);
      });

      const extracted = await getExtractionFromSource(
        draft.sourceType,
        draft.sourceValue
      );

      updateDraft((prev) => {
        const shouldReplaceIngredients = extracted.ingredients.some(
          (ingredient) => ingredient.name.trim() || ingredient.quantity.trim()
        );

        return {
          ...prev,
          title: extracted.title || prev.title,
          duration: extracted.duration || prev.duration,
          servings: extracted.servings || prev.servings,
          difficulty: extracted.difficulty,
          ingredients: shouldReplaceIngredients ? extracted.ingredients : prev.ingredients,
          description: extracted.description || prev.description,
          steps: extracted.steps.some((step) => step.text.trim())
            ? extracted.steps
            : prev.steps,
          sourceUrl: extracted.sourceUrl || prev.sourceUrl,
          extractionStatus: "done",
          extractionMessage: extracted.message,
        };
      });
    } catch (error) {
      console.error("extract recipe", error);
      updateDraft((prev) => ({
        ...prev,
        extractionStatus: "error",
        extractionMessage:
          "Analyse impossible pour le moment. Tu peux continuer en complétant les champs manuellement.",
      }));
    }
  };

  const handleContinueFromSource = () => {
    if (!canGoToReview) {
      Alert.alert("Source incomplète", "Ajoute un lien ou un texte avant de continuer.");
      return;
    }

    setStep(2);
    void runExtraction();
  };

  const handleContinueFromReview = () => {
    if (!canGoToFinalize) {
      const fields = missingFields.map((field) => MISSING_LABELS[field]).join(", ");
      Alert.alert("Champs manquants", `Complète: ${fields}.`);
      return;
    }

    setStep(3);
  };

  const handleIngredientChange = (
    ingredientId: string,
    field: "name" | "quantity" | "unit",
    value: string
  ) => {
    updateDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient) =>
        ingredient.id === ingredientId ? { ...ingredient, [field]: value } : ingredient
      ),
    }));
  };

  const handleAddIngredient = () => {
    updateDraft((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, createIngredient()],
    }));
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    updateDraft((prev) => ({
      ...prev,
      ingredients:
        prev.ingredients.length > 1
          ? prev.ingredients.filter((ingredient) => ingredient.id !== ingredientId)
          : prev.ingredients,
    }));
  };

  const handleStepChange = (stepId: string, value: string) => {
    updateDraft((prev) => ({
      ...prev,
      steps: prev.steps.map((recipeStep) =>
        recipeStep.id === stepId ? { ...recipeStep, text: value } : recipeStep
      ),
    }));
  };

  const handleAddStep = () => {
    updateDraft((prev) => ({
      ...prev,
      steps: [...prev.steps, createRecipeStep(prev.steps.length + 1)],
    }));
  };

  const handleRemoveStep = (stepId: string) => {
    updateDraft((prev) => {
      const nextSteps =
        prev.steps.length > 1
          ? prev.steps.filter((recipeStep) => recipeStep.id !== stepId)
          : prev.steps;

      return {
        ...prev,
        steps: nextSteps.map((recipeStep, index) => ({
          ...recipeStep,
          order: index + 1,
        })),
      };
    });
  };

  const handleSaveRecipe = async () => {
    if (!session) return;

    const validationMissing = getMissingFields(draft);
    if (validationMissing.length) {
      const fields = validationMissing
        .map((field) => MISSING_LABELS[field])
        .join(", ");
      Alert.alert("Champs manquants", `Complète: ${fields}.`);
      setStep(2);
      return;
    }

    setSaving(true);

    try {
      const activeScope = scope ?? (await fetchHouseholdScope(session.user.id));
      const input = toRecipeInput(draft);

      const { data, error } = await supabase
        .from("recipes")
        .insert({
          user_id: session.user.id,
          household_id: activeScope.householdId,
          ...input,
        })
        .select("id")
        .single();

      if (error) throw error;

      const recipeId = data?.id ? String(data.id) : null;
      const targetBookId = selectedBook?.id ?? SYSTEM_BOOK_ID;

      if (
        recipeId &&
        targetBookId !== SYSTEM_BOOK_ID &&
        booksStorageKey
      ) {
        const currentBooks = parseStoredBooks(await AsyncStorage.getItem(booksStorageKey));
        const nextBooks = currentBooks.map((book) => {
          if (book.id !== targetBookId) return book;
          if (book.recipeIds.includes(recipeId)) return book;
          return { ...book, recipeIds: [recipeId, ...book.recipeIds] };
        });

        await AsyncStorage.setItem(booksStorageKey, JSON.stringify(nextBooks));
      }

      if (draftStorageKey) {
        await AsyncStorage.removeItem(draftStorageKey);
      }

      if (targetBookId !== SYSTEM_BOOK_ID) {
        router.replace({
          pathname: "/(tabs)/recipes/books/[bookId]",
          params: { bookId: targetBookId },
        });
        return;
      }

      if (recipeId) {
        router.replace({
          pathname: "/(tabs)/recipes/[id]",
          params: { id: recipeId, mode: "view" },
        });
        return;
      }

      router.back();
    } catch (error) {
      console.error("create recipe", error);
      Alert.alert(
        "Erreur",
        "Impossible d'enregistrer la recette. Réessaie plus tard."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveLabel = selectedBook && !selectedBook.isSystem
    ? "Enregistrer dans ce livre"
    : "Enregistrer la recette";

  if (!session) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>Connecte-toi pour ajouter une recette.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!draftHydrated || booksLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.accentSecondary} size="large" />
          <Text style={styles.loadingText}>Chargement du brouillon...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[styles.container, isWeb && styles.containerWeb]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.heading}>Ajouter une recette</Text>
          <Text style={styles.subheading}>{stepTitle(step)}</Text>

          <View style={styles.progressRow}>
            {[1, 2, 3].map((item) => {
              const current = item as Step;
              const active = current === step;
              const completed = current < step;
              return (
                <View
                  key={item}
                  style={[
                    styles.progressDot,
                    active && styles.progressDotActive,
                    completed && styles.progressDotComplete,
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.bookPickerWrap}>
            <Text style={styles.sectionLabel}>Livre de destination</Text>
            <View style={styles.bookPickerRow}>
              {books.map((book) => {
                const selected = draft.bookId === book.id;
                return (
                  <Pressable
                    key={book.id}
                    style={[styles.bookChip, selected && styles.bookChipActive]}
                    onPress={() => updateDraft((prev) => ({ ...prev, bookId: book.id }))}
                  >
                    <Text style={[styles.bookChipText, selected && styles.bookChipTextActive]}>
                      {book.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {step === 1 ? (
          <View style={styles.stepSection}>
            <Text style={styles.sectionLabel}>Choisir une source</Text>

            <View style={styles.sourceGrid}>
              {SOURCE_OPTIONS.map((option) => {
                const selected = draft.sourceType === option.type;
                return (
                  <Pressable
                    key={option.type}
                    style={[
                      styles.sourceCard,
                      selected && styles.sourceCardSelected,
                      option.disabled && styles.sourceCardDisabled,
                    ]}
                    onPress={() => handleSourceTypeChange(option.type)}
                    disabled={option.disabled}
                  >
                    <Feather
                      name={option.icon}
                      size={18}
                      color={selected ? "#FFFFFF" : colors.accentTertiary}
                    />
                    <Text
                      style={[
                        styles.sourceCardTitle,
                        selected && styles.sourceCardTitleSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.sourceCardDescription,
                        selected && styles.sourceCardDescriptionSelected,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {draft.sourceType === "url" ? (
              <TextInput
                style={styles.input}
                placeholder="https://exemple.com/recette"
                placeholderTextColor={colors.muted}
                value={draft.sourceValue}
                onChangeText={(value) =>
                  updateDraft((prev) => ({ ...prev, sourceValue: value }))
                }
                autoCapitalize="none"
                keyboardType="url"
              />
            ) : null}

            {draft.sourceType === "paste" ? (
              <TextInput
                style={[styles.input, styles.largeInput]}
                placeholder="Colle ici la recette brute (titre, ingrédients, étapes)."
                placeholderTextColor={colors.muted}
                value={draft.sourceValue}
                onChangeText={(value) =>
                  updateDraft((prev) => ({ ...prev, sourceValue: value }))
                }
                multiline
                numberOfLines={8}
              />
            ) : null}

            {draft.sourceType === "manual" ? (
              <View style={styles.inlineHint}>
                <Feather name="edit-3" size={14} color={colors.accentTertiary} />
                <Text style={styles.inlineHintText}>
                  La prochaine étape te propose une saisie guidée complète.
                </Text>
              </View>
            ) : null}

            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.primaryButton, !canGoToReview && styles.buttonDisabled]}
                onPress={handleContinueFromSource}
                disabled={!canGoToReview}
              >
                <Text style={styles.primaryButtonText}>Continuer</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.stepSection}>
            <View style={styles.stepHeaderRow}>
              <Text style={styles.sectionLabel}>Révision et validation</Text>
              {(draft.sourceType === "url" || draft.sourceType === "paste") && (
                <Pressable
                  style={styles.secondaryInlineButton}
                  onPress={() => {
                    void runExtraction();
                  }}
                >
                  <Feather name="refresh-cw" size={13} color={colors.accent} />
                  <Text style={styles.secondaryInlineButtonText}>Relancer l’analyse</Text>
                </Pressable>
              )}
            </View>

            {draft.extractionStatus === "loading" ? (
              <View style={styles.loaderCard}>
                <ActivityIndicator color={colors.accentSecondary} />
                <Text style={styles.loaderCardText}>Analyse de la recette...</Text>
              </View>
            ) : null}

            {draft.extractionMessage ? (
              <View style={styles.inlineHint}>
                <Feather name="info" size={14} color={colors.accentTertiary} />
                <Text style={styles.inlineHintText}>{draft.extractionMessage}</Text>
              </View>
            ) : null}

            {missingFields.length ? (
              <View style={styles.badgesRow}>
                {missingFields.map((field) => (
                  <View key={field} style={styles.missingBadge}>
                    <Text style={styles.missingBadgeText}>À compléter: {MISSING_LABELS[field]}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Titre"
              placeholderTextColor={colors.muted}
              value={draft.title}
              onChangeText={(value) => updateDraft((prev) => ({ ...prev, title: value }))}
            />

            <View style={styles.inlineFormRow}>
              <TextInput
                style={[styles.input, styles.growInput]}
                placeholder="Durée (ex: 40 min)"
                placeholderTextColor={colors.muted}
                value={draft.duration}
                onChangeText={(value) =>
                  updateDraft((prev) => ({ ...prev, duration: value }))
                }
              />
              <TextInput
                style={[styles.input, styles.servingsInput]}
                placeholder="Pers."
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                value={draft.servings}
                onChangeText={(value) =>
                  updateDraft((prev) => ({ ...prev, servings: value }))
                }
              />
            </View>

            <View style={styles.chipRow}>
              {DIFFICULTIES.map((difficulty) => {
                const selected = draft.difficulty === difficulty;
                return (
                  <Pressable
                    key={difficulty}
                    style={[styles.choiceChip, selected && styles.choiceChipActive]}
                    onPress={() =>
                      updateDraft((prev) => ({ ...prev, difficulty }))
                    }
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        selected && styles.choiceChipTextActive,
                      ]}
                    >
                      {difficulty}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.ingredientsWrap}>
              <Text style={styles.sectionLabel}>Ingrédients</Text>
              {draft.ingredients.map((ingredient, index) => (
                <View key={ingredient.id} style={styles.ingredientCard}>
                  <View style={styles.ingredientHeader}>
                    <Text style={styles.ingredientTitle}>Ingrédient {index + 1}</Text>
                    {draft.ingredients.length > 1 ? (
                      <Pressable onPress={() => handleRemoveIngredient(ingredient.id)}>
                        <Text style={styles.removeText}>Supprimer</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Nom"
                    placeholderTextColor={colors.muted}
                    value={ingredient.name}
                    onChangeText={(value) =>
                      handleIngredientChange(ingredient.id, "name", value)
                    }
                  />

                  <View style={styles.inlineFormRow}>
                    <TextInput
                      style={[styles.input, styles.growInput]}
                      placeholder="Quantité"
                      placeholderTextColor={colors.muted}
                      keyboardType="decimal-pad"
                      value={ingredient.quantity}
                      onChangeText={(value) =>
                        handleIngredientChange(ingredient.id, "quantity", value)
                      }
                    />
                    <View style={styles.unitRow}>
                      {INGREDIENT_UNITS.map((unit) => {
                        const selected = ingredient.unit === unit;
                        return (
                          <Pressable
                            key={unit}
                            style={[styles.unitChip, selected && styles.unitChipActive]}
                            onPress={() =>
                              handleIngredientChange(ingredient.id, "unit", unit)
                            }
                          >
                            <Text
                              style={[
                                styles.unitChipText,
                                selected && styles.unitChipTextActive,
                              ]}
                            >
                              {unit}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              ))}

              <Pressable style={styles.addIngredientButton} onPress={handleAddIngredient}>
                <Text style={styles.addIngredientText}>+ Ajouter un ingrédient</Text>
              </Pressable>
            </View>

            <View style={styles.stepsWrap}>
              <Text style={styles.sectionLabel}>Étapes</Text>
              {draft.steps.map((recipeStep, index) => (
                <View key={recipeStep.id} style={styles.stepCard}>
                  <View style={styles.ingredientHeader}>
                    <Text style={styles.ingredientTitle}>Étape {index + 1}</Text>
                    {draft.steps.length > 1 ? (
                      <Pressable onPress={() => handleRemoveStep(recipeStep.id)}>
                        <Text style={styles.removeText}>Supprimer</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <TextInput
                    style={[styles.input, styles.stepInput]}
                    placeholder="Décris cette étape"
                    placeholderTextColor={colors.muted}
                    value={recipeStep.text}
                    onChangeText={(value) => handleStepChange(recipeStep.id, value)}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              ))}

              <Pressable style={styles.addIngredientButton} onPress={handleAddStep}>
                <Text style={styles.addIngredientText}>+ Ajouter une étape</Text>
              </Pressable>
            </View>

            <TextInput
              style={[styles.input, styles.largeInput]}
              placeholder="Note ou introduction (optionnel)"
              placeholderTextColor={colors.muted}
              value={draft.description}
              onChangeText={(value) =>
                updateDraft((prev) => ({ ...prev, description: value }))
              }
              multiline
              numberOfLines={6}
            />

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setStep(1)}
              >
                <Text style={styles.secondaryButtonText}>Retour</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, !canGoToFinalize && styles.buttonDisabled]}
                onPress={handleContinueFromReview}
                disabled={!canGoToFinalize}
              >
                <Text style={styles.primaryButtonText}>Suivant</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.stepSection}>
            <Text style={styles.sectionLabel}>Aperçu final</Text>

            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>
                {draft.title.trim() || "Recette sans titre"}
              </Text>

              <View style={styles.previewMetaRow}>
                <View style={styles.previewChip}>
                  <Text style={styles.previewChipText}>{draft.difficulty}</Text>
                </View>
                <View style={styles.previewChip}>
                  <Text style={styles.previewChipText}>{draft.servings || "1"} pers.</Text>
                </View>
                {draft.duration.trim() ? (
                  <View style={styles.previewChip}>
                    <Text style={styles.previewChipText}>{draft.duration}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.previewLabel}>Livre</Text>
              <Text style={styles.previewBody}>{selectedBook?.name ?? "Aucun"}</Text>

              <Text style={styles.previewLabel}>Ingrédients</Text>
              <Text style={styles.previewBody}>
                {draft.ingredients
                  .filter((ingredient) => ingredient.name.trim() && ingredient.quantity.trim())
                  .slice(0, 4)
                  .map((ingredient) => `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`)
                  .join("\n") || "Aucun ingrédient"}
              </Text>

              <Text style={styles.previewLabel}>Étapes</Text>
              <Text style={styles.previewBody} numberOfLines={6}>
                {draft.steps
                  .filter((recipeStep) => recipeStep.text.trim())
                  .slice(0, 4)
                  .map((recipeStep, index) => `${index + 1}. ${recipeStep.text.trim()}`)
                  .join("\n") || "Aucune étape"}
              </Text>

              {draft.sourceUrl.trim() ? (
                <>
                  <Text style={styles.previewLabel}>Source</Text>
                  <Text style={styles.previewBody} numberOfLines={2}>
                    {draft.sourceUrl.trim()}
                  </Text>
                </>
              ) : null}
            </View>

            <View style={styles.inlineHint}>
              <Feather name="save" size={14} color={colors.accentTertiary} />
              <Text style={styles.inlineHintText}>
                {lastSavedAt
                  ? `Brouillon sauvegardé automatiquement à ${new Date(
                      lastSavedAt
                    ).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}.`
                  : "Brouillon sauvegardé automatiquement."}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <Pressable style={styles.secondaryButton} onPress={() => setStep(2)}>
                <Text style={styles.secondaryButtonText}>Retour</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, saving && styles.buttonDisabled]}
                onPress={() => {
                  void handleSaveRecipe();
                }}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? "Enregistrement..." : saveLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {isWeb && <WebFooter />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.screen,
    gap: 18,
    paddingBottom: 180,
  },
  containerWeb: {
    paddingTop: layout.webNavOffset + spacing.screen,
    paddingBottom: 40,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: spacing.screen,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  headerBlock: {
    gap: 8,
  },
  heading: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.8,
  },
  subheading: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  progressRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E4D9C8",
  },
  progressDotActive: {
    backgroundColor: "#DDA15E",
  },
  progressDotComplete: {
    backgroundColor: colors.accent,
  },
  sectionLabel: {
    fontSize: 11,
    color: colors.accentTertiary,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  bookPickerWrap: {
    gap: 8,
    marginTop: 6,
  },
  bookPickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  bookChip: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  bookChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  bookChipText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  bookChipTextActive: {
    color: "#FFFFFF",
  },
  stepSection: {
    gap: 12,
  },
  sourceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sourceCard: {
    width: "48.5%",
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 8,
  },
  sourceCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  sourceCardDisabled: {
    opacity: 0.5,
  },
  sourceCardTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 15,
  },
  sourceCardTitleSelected: {
    color: "#FFFFFF",
  },
  sourceCardDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  sourceCardDescriptionSelected: {
    color: "rgba(255,255,255,0.92)",
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
  largeInput: {
    minHeight: 130,
    textAlignVertical: "top",
  },
  inlineHint: {
    borderWidth: 1,
    borderColor: "rgba(165, 165, 141, 0.4)",
    borderRadius: 14,
    backgroundColor: "rgba(245, 239, 228, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineHintText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  primaryButton: {
    flex: 1,
    minHeight: 47,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 47,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  stepHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  secondaryInlineButton: {
    borderWidth: 1,
    borderColor: "rgba(188, 108, 37, 0.3)",
    backgroundColor: "rgba(188, 108, 37, 0.08)",
    borderRadius: 999,
    minHeight: 32,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  secondaryInlineButtonText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  loaderCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loaderCardText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  missingBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(199, 82, 82, 0.3)",
    backgroundColor: "rgba(199, 82, 82, 0.09)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  missingBadgeText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 11,
  },
  inlineFormRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  growInput: {
    flex: 1,
  },
  servingsInput: {
    width: 92,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  choiceChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  choiceChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  choiceChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  choiceChipTextActive: {
    color: "#FFFFFF",
  },
  ingredientsWrap: {
    gap: 10,
  },
  stepsWrap: {
    gap: 10,
  },
  ingredientCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.84)",
    backgroundColor: "rgba(255,255,255,0.86)",
    padding: 12,
    gap: 8,
  },
  stepCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.84)",
    backgroundColor: "rgba(255,255,255,0.86)",
    padding: 12,
    gap: 8,
  },
  stepInput: {
    minHeight: 82,
    textAlignVertical: "top",
  },
  ingredientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ingredientTitle: {
    color: colors.accentTertiary,
    fontWeight: "800",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  removeText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  unitRow: {
    flexDirection: "row",
    gap: 6,
    paddingTop: 4,
  },
  unitChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  unitChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  unitChipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  unitChipTextActive: {
    color: "#FFFFFF",
  },
  addIngredientButton: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  addIngredientText: {
    color: colors.accentTertiary,
    fontWeight: "700",
    fontSize: 13,
  },
  previewCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 10,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
  },
  previewMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  previewChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  previewChipText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  previewLabel: {
    color: colors.accentTertiary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  previewBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
});
