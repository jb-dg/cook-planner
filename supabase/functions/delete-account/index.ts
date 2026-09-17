// @ts-nocheck

// Deletes the calling user's account and all of their data. Shared by the
// native app (cook-planner) and the web app (weatly-web) — both point at the
// same Supabase project. The user id is always read from the caller's JWT,
// never from the request body, so this endpoint can only ever delete the
// account of whoever is calling it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: corsHeaders });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "missing_authorization" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "server_misconfigured" }, 500);
  }

  // Resolve the caller from their access token. This is the only source of
  // the user id below.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: caller, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !caller?.user) {
    return json({ error: "invalid_session" }, 401);
  }

  const userId = caller.user.id;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Households owned by the user are deleted outright so co-members aren't
    // left pointing at a dangling owner. Membership rows and household-scoped
    // data cascade from the households row.
    const { data: ownedHouseholds } = await admin
      .from("households")
      .select("id")
      .eq("owner_id", userId);

    if (ownedHouseholds?.length) {
      await admin
        .from("households")
        .delete()
        .in(
          "id",
          ownedHouseholds.map((row) => row.id),
        );
    }

    // Personal data. Most of these also cascade from auth.users, but they are
    // removed explicitly so deletion still completes if a cascade is ever
    // missing on the live schema. The service role bypasses RLS.
    await admin.from("shopping_list_items").delete().eq("user_id", userId);
    await admin.from("weekly_menus").delete().eq("user_id", userId);
    await admin.from("recipes").delete().eq("user_id", userId);
    await admin.from("household_members").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("user_id", userId);

    // Uploaded avatars / recipe images live in storage, which has no FK
    // cascade — best-effort cleanup.
    try {
      const prefix = `profiles/${userId}`;
      const { data: files } = await admin.storage.from("media").list(prefix);
      if (files?.length) {
        await admin.storage
          .from("media")
          .remove(files.map((file) => `${prefix}/${file.name}`));
      }
    } catch (storageError) {
      console.warn("delete-account: storage cleanup failed", storageError);
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("delete-account: deleteUser failed", deleteError);
      return json({ error: "delete_failed" }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error("delete-account: unexpected error", error);
    return json({ error: "delete_failed" }, 500);
  }
});
