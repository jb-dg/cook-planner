const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (value: string) => {
  if (!value.trim()) {
    return "L'email est requis.";
  }
  if (!emailPattern.test(value.trim())) {
    return "Renseigne un email valide.";
  }
  return null;
};

export const validatePassword = (value: string) => {
  if (!value) {
    return "Le mot de passe est requis.";
  }
  if (value.length < 8) {
    return "Au moins 8 caractères.";
  }
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
    return "Inclure lettres et chiffres.";
  }
  return null;
};

// Used at sign-in: the server is the source of truth for whether a password
// is correct, so the client only needs to prevent an empty submission —
// applying the full complexity rules here would lock out accounts whose
// (valid, already-registered) password predates those rules.
export const validatePasswordPresence = (value: string) => {
  if (!value) {
    return "Le mot de passe est requis.";
  }
  return null;
};

export const validateConfirmPassword = (
  password: string,
  confirm: string
) => {
  if (!confirm) {
    return "Confirme ton mot de passe.";
  }
  if (password !== confirm) {
    return "Les mots de passe ne correspondent pas.";
  }
  return null;
};
