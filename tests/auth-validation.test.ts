import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
} from "../lib/validation/auth";

describe("validateEmail", () => {
  it("rejects empty input", () => {
    expect(validateEmail(" ")).toBe("L'email est requis.");
  });

  it("rejects invalid format", () => {
    expect(validateEmail("invalid-email")).toBe("Renseigne un email valide.");
  });

  it("accepts valid emails", () => {
    expect(validateEmail("user@example.com")).toBeNull();
  });
});

describe("validatePassword", () => {
  it("requires a value", () => {
    expect(validatePassword("")).toBe("Le mot de passe est requis.");
  });

  it("enforces min length", () => {
    expect(validatePassword("abc12")).toBe("Au moins 8 caractères.");
  });

  it("enforces letters and numbers", () => {
    expect(validatePassword("abcdefgh")).toBe("Inclure lettres et chiffres.");
  });

  it("accepts strong password", () => {
    expect(validatePassword("Securite123")).toBeNull();
  });
});

describe("validateConfirmPassword", () => {
  it("requires confirmation", () => {
    expect(validateConfirmPassword("Password1", "")).toBe(
      "Confirme ton mot de passe."
    );
  });

  it("detects mismatch", () => {
    expect(validateConfirmPassword("Password1", "Password2")).toBe(
      "Les mots de passe ne correspondent pas."
    );
  });

  it("accepts matching values", () => {
    expect(validateConfirmPassword("Password1", "Password1")).toBeNull();
  });
});
