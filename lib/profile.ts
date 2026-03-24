import type { PostgrestError, User } from "@supabase/supabase-js";

import { supabase } from "./supabase";

const normalizeEmail = (email: string | null | undefined) =>
  email?.trim().toLowerCase() ?? null;

const buildPseudoBase = (user: User) => {
  const rawSource =
    user.email?.split("@")[0] ??
    (user.user_metadata?.full_name as string | undefined) ??
    "chef";
  const sanitized = rawSource
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

  if (sanitized.length >= 3) {
    return sanitized.slice(0, 24);
  }

  return `chef${user.id.slice(0, 5)}`.toLowerCase();
};

const withPseudoSuffix = (base: string) => `${base}${Math.floor(Math.random() * 900 + 100)}`;

export const ensureProfileRecord = async (user: User): Promise<string> => {
  const email = normalizeEmail(user.email);
  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("pseudo,email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  const existingPseudo = existing?.pseudo?.trim() ?? "";
  const existingEmail = normalizeEmail(existing?.email ?? null);

  if (existingPseudo) {
    if (email && existingEmail !== email) {
      const { error: updateEmailError } = await supabase
        .from("profiles")
        .update({ email })
        .eq("user_id", user.id);

      if (updateEmailError) {
        throw updateEmailError;
      }
    }

    return existingPseudo;
  }

  const base = buildPseudoBase(user);
  let candidate = base;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        pseudo: candidate,
        email,
      })
      .select("pseudo")
      .single();

    if (!error && data?.pseudo) {
      return data.pseudo;
    }

    if ((error as PostgrestError).code !== "23505") {
      throw error;
    }

    candidate = withPseudoSuffix(base);
  }

  return base;
};
