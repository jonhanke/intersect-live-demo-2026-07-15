import { NextResponse } from "next/server";

// Tier-2 description (issue #4): fetch a real prose summary from Wikipedia
// for the ONE restaurant the wheel landed on — never for whole result lists.
// Keyless and billing-free, per the v1 constraint in SPEC.md §4.

const USER_AGENT =
  "WheelOfLunch/0.1 (https://github.com/jonhanke/intersect-live-demo-2026-07-15)";

// Summaries change rarely; cache aggressively to stay polite to Wikimedia.
const REVALIDATE_SECONDS = 86400;

interface WikipediaSummary {
  title?: string;
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
}

async function fetchSummary(
  lang: string,
  title: string,
): Promise<WikipediaSummary | null> {
  const res = await fetch(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: REVALIDATE_SECONDS },
    },
  );
  if (!res.ok) return null;
  return (await res.json()) as WikipediaSummary;
}

/** Resolve a Wikidata QID to a Wikipedia lang+title via its sitelinks. */
async function resolveWikidata(
  qid: string,
): Promise<{ lang: string; title: string } | null> {
  const res = await fetch(
    `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`,
    {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: REVALIDATE_SECONDS },
    },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    entities?: Record<
      string,
      { sitelinks?: Record<string, { title?: string }> }
    >;
  };
  const sitelinks = data.entities?.[qid]?.sitelinks ?? {};
  // Prefer English, then take any Wikipedia sitelink (keys look like "enwiki").
  const key =
    "enwiki" in sitelinks
      ? "enwiki"
      : Object.keys(sitelinks).find((k) => /^[a-z-]+wiki$/.test(k));
  const title = key ? sitelinks[key]?.title : undefined;
  if (!key || !title) return null;
  return { lang: key.replace(/wiki$/, ""), title };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const wikipedia = params.get("wikipedia");
  const wikidata = params.get("wikidata");

  let lang: string | undefined;
  let title: string | undefined;

  if (wikipedia) {
    // OSM wikipedia tags look like "en:Restaurant Name" (lang prefix optional).
    const colon = wikipedia.indexOf(":");
    lang = colon > 0 ? wikipedia.slice(0, colon) : "en";
    title = colon > 0 ? wikipedia.slice(colon + 1) : wikipedia;
    if (!/^[a-z-]{2,12}$/i.test(lang) || !title) {
      return NextResponse.json(
        { error: "Malformed wikipedia reference" },
        { status: 400 },
      );
    }
  } else if (wikidata) {
    if (!/^Q\d{1,10}$/.test(wikidata)) {
      return NextResponse.json(
        { error: "Malformed wikidata reference" },
        { status: 400 },
      );
    }
    try {
      const resolved = await resolveWikidata(wikidata);
      if (!resolved) {
        return NextResponse.json(
          { error: "No Wikipedia article for that entity" },
          { status: 404 },
        );
      }
      ({ lang, title } = resolved);
    } catch {
      return NextResponse.json({ error: "Lookup failed" }, { status: 502 });
    }
  } else {
    return NextResponse.json(
      { error: "Provide a wikipedia or wikidata query parameter" },
      { status: 400 },
    );
  }

  try {
    const summary = await fetchSummary(lang, title);
    if (!summary?.extract) {
      return NextResponse.json({ error: "No summary found" }, { status: 404 });
    }
    return NextResponse.json({
      source: "wikipedia",
      title: summary.title ?? title,
      extract: summary.extract,
      url: summary.content_urls?.desktop?.page ?? null,
      attribution: `Text from Wikipedia (${lang}), CC BY-SA 4.0`,
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 502 });
  }
}
