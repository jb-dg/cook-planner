// @ts-nocheck

// Free replacement for the old RecipeAPI.io-backed search (which gated
// French results behind a paid plan). Marmiton's search results page embeds
// a schema.org ItemList as JSON-LD for SEO — we read that instead of
// scraping HTML markup, so this keeps working even if Marmiton's page
// layout/class names change. Selecting a result later reuses recipe-html +
// the existing JSON-LD Recipe extraction on the recipe's own page, since
// Marmiton recipe pages also carry full schema.org Recipe markup.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MARMITON_SEARCH_URL = "https://www.marmiton.org/recettes/recherche.aspx";
const USER_AGENT =
  "Mozilla/5.0 (compatible; WeatlyRecipeSearch/1.0; +https://weatly.app)";

const jsonResponse = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: corsHeaders });

const readJsonLdBlocks = (html: string): unknown[] => {
  const blocks: unknown[] = [];
  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html))) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      // Ignore malformed blocks.
    }
  }

  return blocks;
};

// Marmiton wraps everything (Organization, WebSite, BreadcrumbList,
// ItemList, ...) in a single "@graph" array rather than separate <script>
// tags, so the ItemList node has to be found by walking each block.
const findItemList = (blocks: unknown[]): Record<string, unknown> | null => {
  const queue: unknown[] = [...blocks];

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    const record = current as Record<string, unknown>;
    if (record["@type"] === "ItemList" && Array.isArray(record.itemListElement)) {
      return record;
    }

    for (const value of Object.values(record)) {
      if (value && typeof value === "object") queue.push(value);
    }
  }

  return null;
};

type SearchResult = {
  id: string;
  title: string;
  imageUrl: string;
  readyInMinutes: null;
  servings: null;
  sourceName: string;
};

const firstImageUrl = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
};

const mapListItem = (rawValue: unknown): SearchResult | null => {
  if (!rawValue || typeof rawValue !== "object") return null;
  const row = rawValue as Record<string, unknown>;

  const url = typeof row.url === "string" ? row.url : "";
  const title = typeof row.name === "string" ? row.name : "";
  if (!url || !title) return null;

  return {
    id: url,
    title,
    imageUrl: firstImageUrl(row.image),
    readyInMinutes: null,
    servings: null,
    sourceName: "Marmiton",
  };
};

const searchMarmiton = async (
  query: string,
  limit: number
): Promise<SearchResult[]> => {
  const url = `${MARMITON_SEARCH_URL}?aqt=${encodeURIComponent(query)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  let html: string;
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Marmiton a répondu avec une erreur (${response.status}).`);
    }
    html = await response.text();
  } finally {
    clearTimeout(timeoutId);
  }

  const itemList = findItemList(readJsonLdBlocks(html));
  const items = Array.isArray(itemList?.itemListElement)
    ? itemList.itemListElement
    : [];

  return items
    .map(mapListItem)
    .filter((item): item is SearchResult => Boolean(item))
    .slice(0, limit);
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Méthode non supportée." }, 405);
  }

  let payload: { action?: unknown; query?: unknown; number?: unknown } = {};
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Requête invalide." }, 400);
  }

  if (payload.action !== "search") {
    return jsonResponse({ error: "Action non supportée." }, 400);
  }

  const query = typeof payload.query === "string" ? payload.query.trim() : "";
  if (!query) {
    return jsonResponse({ error: "Recherche vide." }, 400);
  }

  const limit =
    typeof payload.number === "number" && payload.number > 0
      ? Math.min(Math.round(payload.number), 20)
      : 10;

  try {
    const results = await searchMarmiton(query, limit);
    return jsonResponse({ results });
  } catch (error) {
    console.error("recipe-search marmiton error", error);
    return jsonResponse(
      { error: "Recherche indisponible pour le moment, réessaie plus tard." },
      502
    );
  }
});
