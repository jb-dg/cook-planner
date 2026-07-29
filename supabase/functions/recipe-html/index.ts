// @ts-nocheck

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const normalizeRecipeUrl = (value: unknown): string | null => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return Response.json(
      { error: "method_not_allowed" },
      { status: 405, headers: corsHeaders }
    );
  }

  let payload: { url?: unknown } = {};
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "invalid_json" },
      { status: 400, headers: corsHeaders }
    );
  }

  const url = normalizeRecipeUrl(payload.url);
  if (!url) {
    return Response.json(
      { error: "invalid_url" },
      { status: 400, headers: corsHeaders }
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (compatible; WeatlyRecipeImporter/1.0; +https://weatly.app)",
      },
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.toLowerCase().includes("text/html")) {
      return Response.json(
        { error: "unavailable" },
        { status: 502, headers: corsHeaders }
      );
    }

    return Response.json(
      {
        html: await response.text(),
        finalUrl: response.url,
      },
      { headers: corsHeaders }
    );
  } catch {
    return Response.json(
      { error: "fetch_failed" },
      { status: 502, headers: corsHeaders }
    );
  } finally {
    clearTimeout(timeoutId);
  }
});
