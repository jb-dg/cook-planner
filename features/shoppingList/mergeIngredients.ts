export type MergeableIngredient = {
  name: string;
  quantity: string | null;
  unit: string | null;
};

export const normalizeIngredientKey = (
  name: string,
  unit: string | null,
): string =>
  `${name.trim().toLowerCase().replace(/\s+/g, " ")}::${(unit ?? "").trim().toLowerCase()}`;

export const parseNumericQuantity = (
  quantity: string | null | undefined,
): number | null => {
  if (!quantity) return null;
  const trimmed = quantity.trim();
  if (!trimmed) return null;

  const fractionMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    const denominator = Number(fractionMatch[2]);
    if (denominator === 0) return null;
    return Number(fractionMatch[1]) / denominator;
  }

  if (!/^\d+([.,]\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed.replace(",", "."));
  return Number.isFinite(value) ? value : null;
};

export const formatNumericQuantity = (value: number): string =>
  (Math.round(value * 100) / 100).toString().replace(".", ",");

const mergeQuantityStrings = (
  a: string | null,
  b: string | null,
): string | null => {
  const numA = parseNumericQuantity(a);
  const numB = parseNumericQuantity(b);
  if (numA !== null && numB !== null) {
    return formatNumericQuantity(numA + numB);
  }

  const parts = [a, b].map((part) => (part ?? "").trim()).filter(Boolean);
  const unique = Array.from(new Set(parts));
  return unique.length ? unique.join(" + ") : null;
};

export type MergePlanItem<T extends MergeableIngredient> = {
  existing: T;
  nextQuantity: string | null;
};

export type MergeResult<T extends MergeableIngredient> = {
  updates: MergePlanItem<T>[];
  inserts: MergeableIngredient[];
};

export function planIngredientMerge<T extends MergeableIngredient>(
  existingItems: T[],
  incoming: MergeableIngredient[],
): MergeResult<T> {
  const existingByKey = new Map<string, T>();
  for (const item of existingItems) {
    existingByKey.set(normalizeIngredientKey(item.name, item.unit), item);
  }

  const updatesByKey = new Map<string, MergePlanItem<T>>();
  const insertsByKey = new Map<string, MergeableIngredient>();

  for (const raw of incoming) {
    const name = raw.name.trim();
    if (!name) continue;
    const unit = raw.unit ? raw.unit.trim() : null;
    const key = normalizeIngredientKey(name, unit);

    const existing = existingByKey.get(key);
    if (existing) {
      const pendingUpdate = updatesByKey.get(key);
      const baseQuantity = pendingUpdate
        ? pendingUpdate.nextQuantity
        : existing.quantity;
      updatesByKey.set(key, {
        existing,
        nextQuantity: mergeQuantityStrings(baseQuantity, raw.quantity),
      });
      continue;
    }

    const pendingInsert = insertsByKey.get(key);
    if (pendingInsert) {
      insertsByKey.set(key, {
        name: pendingInsert.name,
        unit: pendingInsert.unit,
        quantity: mergeQuantityStrings(pendingInsert.quantity, raw.quantity),
      });
      continue;
    }

    insertsByKey.set(key, { name, unit, quantity: raw.quantity ?? null });
  }

  const updates = Array.from(updatesByKey.values()).filter(
    (update) => update.nextQuantity !== update.existing.quantity,
  );

  return { updates, inserts: Array.from(insertsByKey.values()) };
}
