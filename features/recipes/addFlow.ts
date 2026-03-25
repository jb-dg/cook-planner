import {
  createEmptyFormState,
  createIngredient,
  Difficulty,
  Ingredient,
  IngredientUnit,
  RecipeInput,
} from "./types";

export type RecipeSourceType = "photo" | "url" | "paste" | "manual";
export type ExtractionStatus = "idle" | "loading" | "done" | "error";
export type DraftMissingField = "title" | "ingredients" | "description";

export type AddRecipeDraft = {
  bookId: string | null;
  sourceType: RecipeSourceType;
  sourceValue: string;
  title: string;
  duration: string;
  servings: string;
  difficulty: Difficulty;
  ingredients: Ingredient[];
  description: string;
  extractionStatus: ExtractionStatus;
  extractionMessage: string | null;
  updatedAt: string;
};

export type SourceExtractionResult = {
  title: string;
  duration: string;
  servings: string;
  difficulty: Difficulty;
  ingredients: Ingredient[];
  description: string;
  message: string;
};

const MINUTE_PATTERN = /(\d{1,3})\s*(?:min|mn|minutes?)/i;
const HOUR_PATTERN = /(\d{1,2})\s*(?:h|heure|heures)/i;
const SERVINGS_PATTERN = /(\d{1,2})\s*(?:pers|personnes?|portions?)/i;
const ISO_DURATION_PATTERN =
  /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i;
const QUANTITY_TOKEN_PATTERN =
  /^(?:(\d+(?:[.,]\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+|\d+[½¼¾⅓⅔⅛]|[½¼¾⅓⅔⅛])|(un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix))\b/i;

const FRACTION_SYMBOLS: Record<string, number> = {
  "¼": 0.25,
  "⅓": 1 / 3,
  "½": 0.5,
  "⅔": 2 / 3,
  "¾": 0.75,
  "⅛": 0.125,
};

const WORD_NUMBERS: Record<string, number> = {
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
};

const stripDiacritics = (value: string): string =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const normalizeUnit = (value: string): IngredientUnit => {
  const lowered = stripDiacritics(value).toLowerCase().trim();
  if (lowered.startsWith("unit")) {
    return "unité";
  }
  if (
    lowered.startsWith("ml") ||
    lowered.startsWith("millilitre") ||
    lowered.startsWith("centilitre") ||
    lowered === "cl" ||
    lowered.startsWith("litre") ||
    lowered === "l"
  ) {
    return "ml";
  }
  if (
    lowered.startsWith("kg") ||
    lowered.startsWith("kilogramme") ||
    lowered.startsWith("gr") ||
    lowered.startsWith("g") ||
    lowered.startsWith("gramme")
  ) {
    return "gr";
  }
  return "pièce";
};

const normalizeDifficulty = (value: string): Difficulty => {
  const lowered = value.toLowerCase();
  if (lowered.includes("expert")) return "Expert";
  if (lowered.includes("moy")) return "Moyen";
  return "Facile";
};

const parseQuantityValue = (rawValue: string): number | null => {
  const value = rawValue.trim().toLowerCase().replace(",", ".");

  if (WORD_NUMBERS[value]) return WORD_NUMBERS[value];
  if (FRACTION_SYMBOLS[value] !== undefined) return FRACTION_SYMBOLS[value];

  const compactFraction = value.match(/^(\d+)([½¼¾⅓⅔⅛])$/);
  if (compactFraction) {
    const base = Number(compactFraction[1]);
    const fraction = FRACTION_SYMBOLS[compactFraction[2]] ?? 0;
    return base + fraction;
  }

  const mixedFraction = value.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedFraction) {
    const whole = Number(mixedFraction[1]);
    const numerator = Number(mixedFraction[2]);
    const denominator = Number(mixedFraction[3]);
    if (!denominator) return whole;
    return whole + numerator / denominator;
  }

  const fraction = value.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (!denominator) return null;
    return numerator / denominator;
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) return numeric;

  return null;
};

const formatQuantity = (value: number): string => {
  if (Number.isInteger(value)) return String(value);

  const rounded = Math.round(value * 100) / 100;
  return String(rounded).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
};

const stripIngredientPrefix = (value: string): string =>
  value
    .replace(/^\s*[-*•]\s+/, "")
    .replace(/^\s*\d+[.)]\s+/, "")
    .replace(/\s+/g, " ")
    .trim();

const createIngredientFromLine = (line: string): Ingredient | null => {
  const clean = stripIngredientPrefix(line);

  if (!clean) return null;

  let remaining = clean;
  let quantityNumber: number | null = null;
  let quantity = "";
  let unit: IngredientUnit = "pièce";

  const quantityMatch = remaining.match(QUANTITY_TOKEN_PATTERN);
  if (quantityMatch) {
    const quantityToken = quantityMatch[1] || quantityMatch[2] || "";
    const parsedQuantity = parseQuantityValue(quantityToken);

    if (parsedQuantity !== null) {
      quantityNumber = parsedQuantity;
      quantity = formatQuantity(parsedQuantity);
      remaining = remaining.slice(quantityMatch[0].length).trim();
    }
  }

  // Handle ranges such as "10 à 15 cl ...": keep lower bound and continue parsing.
  const rangeContinuation = remaining.match(
    /^(?:a|à|-)\s*\d+(?:[.,]\d+)?(?:\s+\d+\/\d+)?\s+/i
  );
  if (rangeContinuation) {
    remaining = remaining.slice(rangeContinuation[0].length).trim();
  }

  const unitTokenMatch = remaining.match(/^([^\s,.;:()]+)/);
  const unitTokenRaw = unitTokenMatch?.[1] ?? "";
  const normalizedUnitToken = stripDiacritics(unitTokenRaw).toLowerCase();
  const hasKnownUnit = /^(kg|kilogrammes?|g|gr|grammes?|ml|millilitres?|cl|centilitres?|l|litres?|pieces?|unites?)$/.test(
    normalizedUnitToken
  );

  if (hasKnownUnit && unitTokenRaw) {
    const unitRaw = unitTokenRaw;
    unit = normalizeUnit(unitRaw);
    remaining = remaining
      .slice(unitTokenRaw.length)
      .trim()
      .replace(/^de\s+/i, "");

    if (quantityNumber !== null) {
      const loweredUnit = stripDiacritics(unitRaw).toLowerCase();
      if (loweredUnit.startsWith("kg") || loweredUnit.startsWith("kilogramme")) {
        quantity = formatQuantity(quantityNumber * 1000);
        unit = "gr";
      } else if (
        loweredUnit === "cl" ||
        loweredUnit.startsWith("centilitre")
      ) {
        quantity = formatQuantity(quantityNumber * 10);
        unit = "ml";
      } else if (loweredUnit === "l" || loweredUnit.startsWith("litre")) {
        quantity = formatQuantity(quantityNumber * 1000);
        unit = "ml";
      }
    }
  }

  const name = remaining || clean;
  if (!name) return null;

  return {
    ...createIngredient(),
    name,
    quantity,
    unit,
  };
};

const isIngredientsHeading = (value: string) =>
  /^(ingr[eé]dients?|ingredients?)\b/i.test(value.trim());

const isStepsHeading = (value: string) =>
  /^(pr[eé]paration|[eé]tapes?|instructions?|m[ée]thode)\b/i.test(
    value.trim()
  );

const normalizeTitleFromUrl = (rawUrl: string): string => {
  let parsed: URL | null = null;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return "";
  }

  const segment = parsed.pathname
    .split("/")
    .filter(Boolean)
    .at(-1)
    ?.replace(/[-_]+/g, " ")
    .trim();

  if (!segment) return "";

  return segment
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const inferDifficultyFromMinutes = (minutes: number): Difficulty => {
  if (minutes >= 70) return "Expert";
  if (minutes >= 35) return "Moyen";
  return "Facile";
};

const inferDurationFromText = (value: string): { label: string; minutes: number } => {
  const hourMatch = value.match(HOUR_PATTERN);
  const minuteMatch = value.match(MINUTE_PATTERN);

  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes <= 0) {
    return { label: "", minutes: 0 };
  }

  if (hours && minutes) {
    return { label: `${hours} h ${minutes} min`, minutes: totalMinutes };
  }

  if (hours) {
    return { label: `${hours} h`, minutes: totalMinutes };
  }

  return { label: `${minutes} min`, minutes: totalMinutes };
};

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("timeout"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const cleanText = (value: unknown): string => {
  if (typeof value !== "string") return "";

  return decodeHtmlEntities(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const getTypeValues = (node: Record<string, unknown>): string[] => {
  const rawType = node["@type"];

  if (typeof rawType === "string") return [rawType];
  if (Array.isArray(rawType)) {
    return rawType.filter((item): item is string => typeof item === "string");
  }

  return [];
};

const hasType = (node: Record<string, unknown>, target: string): boolean =>
  getTypeValues(node).some((value) => value.toLowerCase() === target.toLowerCase());

const parseIsoDurationToMinutes = (rawValue: unknown): number => {
  if (typeof rawValue !== "string") return 0;
  const match = rawValue.trim().match(ISO_DURATION_PATTERN);
  if (!match) return 0;

  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);

  return days * 24 * 60 + hours * 60 + minutes + (seconds > 0 ? 1 : 0);
};

const formatDurationLabelFromMinutes = (minutes: number): string => {
  if (minutes <= 0) return "";

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (hours && remaining) {
    return `${hours} h ${remaining} min`;
  }
  if (hours) {
    return `${hours} h`;
  }
  return `${remaining} min`;
};

const parseServings = (rawYield: unknown): string => {
  const values = Array.isArray(rawYield) ? rawYield : [rawYield];

  for (const value of values) {
    if (typeof value === "number" && value > 0) {
      return String(Math.round(value));
    }

    if (typeof value !== "string") continue;

    const match = value.match(/(\d{1,2})/);
    if (match) return match[1];
  }

  return "";
};

const parseInstructionLines = (raw: unknown): string[] => {
  if (!raw) return [];

  if (typeof raw === "string") {
    const text = cleanText(raw);
    return text ? [text] : [];
  }

  if (Array.isArray(raw)) {
    return raw.flatMap((item) => parseInstructionLines(item)).filter(Boolean);
  }

  if (typeof raw === "object") {
    const record = raw as Record<string, unknown>;

    if (Array.isArray(record.itemListElement)) {
      return parseInstructionLines(record.itemListElement);
    }

    const text = cleanText(record.text) || cleanText(record.name);
    return text ? [text] : [];
  }

  return [];
};

const readScriptBlocks = (html: string): string[] => {
  const blocks: string[] = [];
  const regex = /<script[^>]*>([\s\S]*?)<\/script>/gi;

  let match: RegExpExecArray | null = regex.exec(html);
  while (match) {
    blocks.push(match[1] ?? "");
    match = regex.exec(html);
  }

  return blocks;
};

const collectJsonLdNodes = (value: unknown): Record<string, unknown>[] => {
  const queue: unknown[] = [value];
  const nodes: Record<string, unknown>[] = [];
  let safety = 0;

  while (queue.length && safety < 3000) {
    safety += 1;
    const current = queue.shift();

    if (!current) continue;

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    if (typeof current !== "object") continue;

    const record = current as Record<string, unknown>;
    nodes.push(record);

    for (const nested of Object.values(record)) {
      if (nested && typeof nested === "object") {
        queue.push(nested);
      }
    }
  }

  return nodes;
};

const readJsonLdBlocks = (html: string): unknown[] => {
  const blocks: unknown[] = [];
  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match: RegExpExecArray | null = regex.exec(html);
  while (match) {
    const raw = match[1]?.trim();
    if (raw) {
      try {
        blocks.push(JSON.parse(raw));
      } catch {
        // Ignore malformed JSON-LD blocks.
      }
    }
    match = regex.exec(html);
  }

  return blocks;
};

const extractObjectLiteralAfterMarker = (
  script: string,
  marker: string
): string | null => {
  const markerIndex = script.indexOf(marker);
  if (markerIndex < 0) return null;

  const equalIndex = script.indexOf("=", markerIndex);
  if (equalIndex < 0) return null;

  const objectStart = script.indexOf("{", equalIndex);
  if (objectStart < 0) return null;

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let i = objectStart; i < script.length; i += 1) {
    const current = script[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (current === "\\") {
        escaped = true;
        continue;
      }
      if (current === quote) {
        inString = false;
        quote = "";
      }
      continue;
    }

    if (current === '"' || current === "'") {
      inString = true;
      quote = current;
      continue;
    }

    if (current === "{") {
      depth += 1;
      continue;
    }

    if (current === "}") {
      depth -= 1;
      if (depth === 0) {
        return script.slice(objectStart, i + 1);
      }
    }
  }

  return null;
};

const parseWprmRecipesObject = (html: string): Record<string, unknown> | null => {
  const marker = "window.wprm_recipes";

  for (const scriptContent of readScriptBlocks(html)) {
    if (!scriptContent.includes(marker)) continue;

    const objectLiteral = extractObjectLiteralAfterMarker(scriptContent, marker);
    if (!objectLiteral) continue;

    try {
      const parsed = JSON.parse(objectLiteral);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Ignore malformed JSON payloads.
    }
  }

  return null;
};

const isPieceLikeUnit = (value: string): boolean =>
  /^(pieces?|unites?)$/i.test(stripDiacritics(value).toLowerCase().trim());

const mapWprmIngredient = (rawValue: unknown): Ingredient | null => {
  if (!rawValue || typeof rawValue !== "object") return null;

  const row = rawValue as Record<string, unknown>;
  const amount = cleanText(row.amount);
  const unitRaw = cleanText(row.unit);
  const nameRaw = cleanText(row.name);
  const notesRaw = cleanText(row.notes);

  if (!nameRaw) return null;

  const normalizedUnit = unitRaw ? normalizeUnit(unitRaw) : ("pièce" as IngredientUnit);
  const shouldPrefixUnit =
    unitRaw && normalizedUnit === "pièce" && !isPieceLikeUnit(unitRaw);

  const nameParts = [
    shouldPrefixUnit ? unitRaw : "",
    nameRaw.replace(/^de\s+/i, ""),
    notesRaw ? `(${notesRaw})` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    ...createIngredient(),
    name: nameParts || nameRaw,
    quantity: amount,
    unit: normalizedUnit,
  };
};

const extractRecipeFromWprm = (
  html: string,
  source: string
): SourceExtractionResult | null => {
  const recipesMap = parseWprmRecipesObject(html);
  if (!recipesMap) return null;

  const recipeNodes = Object.values(recipesMap).filter(
    (entry): entry is Record<string, unknown> =>
      Boolean(entry) && typeof entry === "object" && !Array.isArray(entry)
  );
  if (!recipeNodes.length) return null;

  const bestRecipeNode = recipeNodes
    .map((node) => ({
      node,
      score: Array.isArray(node.ingredients) ? node.ingredients.length : 0,
    }))
    .sort((a, b) => b.score - a.score)[0]?.node;

  if (!bestRecipeNode) return null;

  const fallback = parseUrlRecipeFallback(source);
  const title = cleanText(bestRecipeNode.name) || fallback.title;

  const ingredients = Array.isArray(bestRecipeNode.ingredients)
    ? bestRecipeNode.ingredients
        .map((ingredient) => mapWprmIngredient(ingredient))
        .filter((item): item is Ingredient => Boolean(item))
    : [];

  const servings =
    (typeof bestRecipeNode.currentServingsParsed === "number" &&
    bestRecipeNode.currentServingsParsed > 0
      ? String(Math.round(bestRecipeNode.currentServingsParsed))
      : parseServings(bestRecipeNode.currentServings)) ||
    fallback.servings;

  return {
    title,
    duration: fallback.duration,
    servings,
    difficulty: fallback.difficulty,
    ingredients: ingredients.length ? ingredients : fallback.ingredients,
    description: fallback.description,
    message:
      ingredients.length > 0
        ? "Ingrédients extraits avec quantités/unités depuis la page."
        : fallback.message,
  };
};

const extractRecipeFromHtml = (
  html: string,
  source: string
): SourceExtractionResult | null => {
  const jsonLdBlocks = readJsonLdBlocks(html);
  if (!jsonLdBlocks.length) return null;

  const allNodes = jsonLdBlocks.flatMap((block) => collectJsonLdNodes(block));
  const recipeNodes = allNodes.filter((node) => hasType(node, "Recipe"));

  if (!recipeNodes.length) return null;

  const bestRecipeNode = recipeNodes
    .map((node) => {
      const ingredients = Array.isArray(node.recipeIngredient)
        ? node.recipeIngredient
        : [];
      const instructions = parseInstructionLines(node.recipeInstructions);

      return { node, score: ingredients.length * 2 + instructions.length };
    })
    .sort((a, b) => b.score - a.score)[0]?.node;

  if (!bestRecipeNode) return null;

  const fallback = parseUrlRecipeFallback(source);
  const title = cleanText(bestRecipeNode.name) || fallback.title;

  const ingredientLines = Array.isArray(bestRecipeNode.recipeIngredient)
    ? bestRecipeNode.recipeIngredient
        .map((item) => cleanText(item))
        .filter(Boolean)
    : [];

  const ingredients = ingredientLines
    .map((line) => createIngredientFromLine(line))
    .filter((item): item is Ingredient => Boolean(item));

  const instructionLines = parseInstructionLines(bestRecipeNode.recipeInstructions);
  const description = instructionLines
    .map((line, index) => `${index + 1}. ${line}`)
    .join("\n");

  const totalDurationMin = parseIsoDurationToMinutes(bestRecipeNode.totalTime);
  const prepDurationMin = parseIsoDurationToMinutes(bestRecipeNode.prepTime);
  const cookDurationMin = parseIsoDurationToMinutes(bestRecipeNode.cookTime);
  const minutes = totalDurationMin || prepDurationMin + cookDurationMin;
  const duration = formatDurationLabelFromMinutes(minutes) || fallback.duration;

  const servings = parseServings(bestRecipeNode.recipeYield) || fallback.servings;
  const difficulty = minutes
    ? inferDifficultyFromMinutes(minutes)
    : normalizeDifficulty(cleanText(bestRecipeNode.description) || fallback.duration);

  return {
    title,
    duration,
    servings,
    difficulty,
    ingredients: ingredients.length ? ingredients : fallback.ingredients,
    description: description || cleanText(bestRecipeNode.description) || fallback.description,
    message:
      ingredients.length || description
        ? "Recette extraite depuis la page: vérifie puis ajuste."
        : "Extraction partielle depuis la page: complète les champs manquants.",
  };
};

const parseTextRecipe = (source: string): SourceExtractionResult => {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const baseForm = createEmptyFormState();

  if (!lines.length) {
    return {
      ...baseForm,
      message: "Texte vide: complète les champs manuellement.",
    };
  }

  const titleLine =
    lines.find(
      (line) => !isIngredientsHeading(line) && !isStepsHeading(line) && line.length > 2
    ) ?? "";

  const ingredientsHeadingIndex = lines.findIndex(isIngredientsHeading);
  const stepsHeadingIndex = lines.findIndex(isStepsHeading);

  const ingredientLines: string[] = [];
  const stepLines: string[] = [];

  if (ingredientsHeadingIndex >= 0) {
    const ingredientsEnd =
      stepsHeadingIndex > ingredientsHeadingIndex ? stepsHeadingIndex : lines.length;
    ingredientLines.push(...lines.slice(ingredientsHeadingIndex + 1, ingredientsEnd));
  }

  if (stepsHeadingIndex >= 0) {
    stepLines.push(...lines.slice(stepsHeadingIndex + 1));
  }

  if (!ingredientLines.length && !stepLines.length) {
    const body = lines.slice(titleLine ? 1 : 0);
    const maybeIngredients = body.filter((line) => /\d/.test(line) && line.length < 90);
    const maybeSteps = body.filter((line) => !maybeIngredients.includes(line));
    ingredientLines.push(...maybeIngredients);
    stepLines.push(...maybeSteps);
  }

  const parsedIngredients = ingredientLines
    .map(createIngredientFromLine)
    .filter((item): item is Ingredient => Boolean(item))
    .slice(0, 25);

  const description = stepLines
    .map((line, index) => `${index + 1}. ${line.replace(/^[-*•\d.)\s]+/, "").trim()}`)
    .join("\n");

  const servingsMatch = source.match(SERVINGS_PATTERN);
  const inferredDuration = inferDurationFromText(source);

  const parsedDifficultyByText = normalizeDifficulty(source);
  const inferredDifficulty = inferredDuration.minutes
    ? inferDifficultyFromMinutes(inferredDuration.minutes)
    : parsedDifficultyByText;

  return {
    title: titleLine,
    duration: inferredDuration.label,
    servings: servingsMatch?.[1] ?? baseForm.servings,
    difficulty: inferredDifficulty,
    ingredients: parsedIngredients.length ? parsedIngredients : baseForm.ingredients,
    description,
    message:
      parsedIngredients.length || description
        ? "Recette pré-remplie: vérifie les ingrédients et les étapes." 
        : "Extraction partielle: certains champs restent à compléter.",
  };
};

const parseUrlRecipeFallback = (source: string): SourceExtractionResult => {
  const baseForm = createEmptyFormState();
  const titleFromUrl = normalizeTitleFromUrl(source);
  const inferredDuration = inferDurationFromText(source);
  const servingsMatch = source.match(SERVINGS_PATTERN);

  return {
    title: titleFromUrl,
    duration: inferredDuration.label,
    servings: servingsMatch?.[1] ?? baseForm.servings,
    difficulty: inferredDuration.minutes
      ? inferDifficultyFromMinutes(inferredDuration.minutes)
      : "Facile",
    ingredients: baseForm.ingredients,
    description: source ? `Source importée: ${source}` : "",
    message:
      titleFromUrl || inferredDuration.label
        ? "Lien analysé localement: complète les champs manquants."
        : "Analyse limitée du lien: complète la recette manuellement.",
  };
};

const fetchRecipeHtml = async (source: string): Promise<string | null> => {
  try {
    const response = await withTimeout(
      fetch(source, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
        },
      }),
      9000
    );

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
};

const parseUrlRecipe = async (source: string): Promise<SourceExtractionResult> => {
  const fallback = parseUrlRecipeFallback(source);
  const html = await fetchRecipeHtml(source);

  if (!html) {
    return fallback;
  }

  const jsonLdExtraction = extractRecipeFromHtml(html, source);
  const wprmExtraction = extractRecipeFromWprm(html, source);

  if (!jsonLdExtraction && !wprmExtraction) {
    return fallback;
  }

  const merged: SourceExtractionResult = {
    ...(jsonLdExtraction ?? fallback),
    ...(wprmExtraction
      ? {
          title: wprmExtraction.title || jsonLdExtraction?.title || fallback.title,
          servings:
            wprmExtraction.servings || jsonLdExtraction?.servings || fallback.servings,
          ingredients: wprmExtraction.ingredients.length
            ? wprmExtraction.ingredients
            : jsonLdExtraction?.ingredients ?? fallback.ingredients,
        }
      : {}),
    message:
      wprmExtraction && jsonLdExtraction
        ? "Recette extraite depuis la page (quantités/unités + étapes)."
        : wprmExtraction?.message ?? jsonLdExtraction?.message ?? fallback.message,
  };

  const inferredMinutes = inferDurationFromText(merged.duration).minutes;
  if (inferredMinutes > 0) {
    merged.difficulty = inferDifficultyFromMinutes(inferredMinutes);
  }

  return merged;
};

export const createEmptyAddRecipeDraft = (
  bookId: string | null = null
): AddRecipeDraft => {
  const empty = createEmptyFormState();
  return {
    bookId,
    sourceType: "manual",
    sourceValue: "",
    title: empty.title,
    duration: empty.duration,
    servings: empty.servings,
    difficulty: empty.difficulty,
    ingredients: empty.ingredients,
    description: empty.description,
    extractionStatus: "idle",
    extractionMessage: null,
    updatedAt: new Date().toISOString(),
  };
};

const sanitizeIngredients = (value: unknown): Ingredient[] => {
  if (!Array.isArray(value)) return [createIngredient()];

  const next = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;

      const raw = entry as Partial<Ingredient>;

      if (typeof raw.name !== "string") return null;

      const quantity = typeof raw.quantity === "string" ? raw.quantity : "";
      const unit =
        typeof raw.unit === "string" ? normalizeUnit(raw.unit) : ("pièce" as IngredientUnit);

      return {
        id: typeof raw.id === "string" ? raw.id : String(Date.now() + Math.random()),
        name: raw.name,
        quantity,
        unit,
      };
    })
    .filter((item): item is Ingredient => Boolean(item));

  return next.length ? next : [createIngredient()];
};

export const parseStoredAddRecipeDraft = (
  rawValue: string | null,
  fallbackBookId: string | null
): AddRecipeDraft | null => {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as Partial<AddRecipeDraft>;

    const sourceType =
      parsed.sourceType === "photo" ||
      parsed.sourceType === "url" ||
      parsed.sourceType === "paste" ||
      parsed.sourceType === "manual"
        ? parsed.sourceType
        : "manual";

    return {
      bookId:
        typeof parsed.bookId === "string"
          ? parsed.bookId
          : fallbackBookId,
      sourceType,
      sourceValue: typeof parsed.sourceValue === "string" ? parsed.sourceValue : "",
      title: typeof parsed.title === "string" ? parsed.title : "",
      duration: typeof parsed.duration === "string" ? parsed.duration : "",
      servings: typeof parsed.servings === "string" ? parsed.servings : "2",
      difficulty:
        parsed.difficulty === "Facile" ||
        parsed.difficulty === "Moyen" ||
        parsed.difficulty === "Expert"
          ? parsed.difficulty
          : "Facile",
      ingredients: sanitizeIngredients(parsed.ingredients),
      description: typeof parsed.description === "string" ? parsed.description : "",
      extractionStatus:
        parsed.extractionStatus === "idle" ||
        parsed.extractionStatus === "loading" ||
        parsed.extractionStatus === "done" ||
        parsed.extractionStatus === "error"
          ? parsed.extractionStatus
          : "idle",
      extractionMessage:
        typeof parsed.extractionMessage === "string" ? parsed.extractionMessage : null,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

export const getMissingFields = (draft: AddRecipeDraft): DraftMissingField[] => {
  const next: DraftMissingField[] = [];

  if (!draft.title.trim()) {
    next.push("title");
  }

  const hasIngredient = draft.ingredients.some(
    (ingredient) => ingredient.name.trim()
  );

  if (!hasIngredient) {
    next.push("ingredients");
  }

  if (!draft.description.trim()) {
    next.push("description");
  }

  return next;
};

export const canContinueFromSource = (draft: AddRecipeDraft): boolean => {
  if (draft.sourceType === "manual" || draft.sourceType === "photo") {
    return true;
  }

  return Boolean(draft.sourceValue.trim());
};

export const canContinueFromReview = (draft: AddRecipeDraft): boolean =>
  getMissingFields(draft).length === 0;

export const getExtractionFromSource = async (
  sourceType: RecipeSourceType,
  sourceValue: string
): Promise<SourceExtractionResult> => {
  if (sourceType === "url") {
    return parseUrlRecipe(sourceValue);
  }

  if (sourceType === "paste") {
    return parseTextRecipe(sourceValue);
  }

  if (sourceType === "photo") {
    const baseForm = createEmptyFormState();
    return {
      ...baseForm,
      message: "Analyse photo bientôt disponible. Continue en saisie manuelle.",
    };
  }

  const baseForm = createEmptyFormState();
  return {
    ...baseForm,
    message: "Saisie manuelle activée.",
  };
};

export const toRecipeInput = (draft: AddRecipeDraft): RecipeInput => ({
  title: draft.title.trim(),
  duration: draft.duration.trim(),
  description: draft.description.trim(),
  servings: Number(draft.servings) > 0 ? Number(draft.servings) : 1,
  difficulty: draft.difficulty,
  ingredients: draft.ingredients
    .filter((ingredient) => ingredient.name.trim())
    .map((ingredient) => ({
      ...ingredient,
      name: ingredient.name.trim(),
      quantity: ingredient.quantity.trim(),
    })),
});
