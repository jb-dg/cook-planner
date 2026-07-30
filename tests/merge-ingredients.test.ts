import {
  formatNumericQuantity,
  parseNumericQuantity,
  planIngredientMerge,
} from "../features/shoppingList/mergeIngredients";

describe("parseNumericQuantity", () => {
  it("parses plain integers", () => {
    expect(parseNumericQuantity("2")).toBe(2);
  });

  it("parses decimals with a comma", () => {
    expect(parseNumericQuantity("1,5")).toBe(1.5);
  });

  it("parses decimals with a dot", () => {
    expect(parseNumericQuantity("1.5")).toBe(1.5);
  });

  it("parses simple fractions", () => {
    expect(parseNumericQuantity("1/2")).toBe(0.5);
  });

  it("rejects non-numeric free text", () => {
    expect(parseNumericQuantity("10 à 15")).toBeNull();
    expect(parseNumericQuantity("au goût")).toBeNull();
    expect(parseNumericQuantity("1 pincée")).toBeNull();
  });

  it("returns null for empty or missing input", () => {
    expect(parseNumericQuantity("")).toBeNull();
    expect(parseNumericQuantity(null)).toBeNull();
    expect(parseNumericQuantity(undefined)).toBeNull();
  });
});

describe("formatNumericQuantity", () => {
  it("uses a comma as decimal separator", () => {
    expect(formatNumericQuantity(3.5)).toBe("3,5");
  });

  it("drops trailing zeros", () => {
    expect(formatNumericQuantity(3)).toBe("3");
  });

  it("rounds to two decimals", () => {
    expect(formatNumericQuantity(1 / 3)).toBe("0,33");
  });
});

describe("planIngredientMerge", () => {
  it("inserts new ingredients that don't exist yet", () => {
    const result = planIngredientMerge([], [
      { name: "Ail", quantity: "2", unit: "pièce" },
    ]);
    expect(result.updates).toEqual([]);
    expect(result.inserts).toEqual([
      { name: "Ail", quantity: "2", unit: "pièce" },
    ]);
  });

  it("sums numeric quantities for a matching existing item", () => {
    const existing = [
      { id: "1", name: "Ail", quantity: "2", unit: "pièce" },
    ];
    const result = planIngredientMerge(existing, [
      { name: "ail", quantity: "1,5", unit: "pièce" },
    ]);
    expect(result.inserts).toEqual([]);
    expect(result.updates).toEqual([
      { existing: existing[0], nextQuantity: "3,5" },
    ]);
  });

  it("concatenates non-numeric quantities instead of summing", () => {
    const existing = [
      { id: "1", name: "Poivre", quantity: "10 à 15", unit: null },
    ];
    const result = planIngredientMerge(existing, [
      { name: "Poivre", quantity: "2", unit: null },
    ]);
    expect(result.updates).toEqual([
      { existing: existing[0], nextQuantity: "10 à 15 + 2" },
    ]);
  });

  it("treats items with different units as distinct", () => {
    const existing = [
      { id: "1", name: "Lait", quantity: "200", unit: "ml" },
    ];
    const result = planIngredientMerge(existing, [
      { name: "Lait", quantity: "1", unit: "unité" },
    ]);
    expect(result.updates).toEqual([]);
    expect(result.inserts).toEqual([
      { name: "Lait", quantity: "1", unit: "unité" },
    ]);
  });

  it("folds duplicates within the same incoming batch before reconciling", () => {
    const result = planIngredientMerge([], [
      { name: "Oignon", quantity: "1", unit: "pièce" },
      { name: "oignon", quantity: "1", unit: "pièce" },
    ]);
    expect(result.inserts).toEqual([
      { name: "Oignon", quantity: "2", unit: "pièce" },
    ]);
  });

  it("skips a no-op update when the merged quantity is unchanged", () => {
    const existing = [
      { id: "1", name: "Sel", quantity: "au goût", unit: null },
    ];
    const result = planIngredientMerge(existing, [
      { name: "Sel", quantity: "au goût", unit: null },
    ]);
    expect(result.updates).toEqual([]);
    expect(result.inserts).toEqual([]);
  });

  it("ignores incoming ingredients with an empty name", () => {
    const result = planIngredientMerge([], [
      { name: "   ", quantity: "1", unit: "pièce" },
    ]);
    expect(result.inserts).toEqual([]);
    expect(result.updates).toEqual([]);
  });
});
