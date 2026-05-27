import { logApiCall, truncate } from "./logger";

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const MAX_DIGEST_CHARS = 2800;

function buildSearchQueries({ bookTitle, author, seriesName, seriesIndex }) {
  const queries = [`${bookTitle} ${author} novel`];

  if (seriesName && seriesIndex && seriesIndex > 1) {
    queries.push(`${seriesName} book ${seriesIndex - 1} plot summary`);
    queries.push(`${bookTitle} sequel previous book recap`);
  }

  if (seriesName) {
    queries.push(`${seriesName} ${bookTitle} characters`);
  }

  return [...new Set(queries)].slice(0, 3);
}

async function wikipediaSearchSummary(query) {
  const searchParams = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: query,
    format: "json",
    origin: "*",
    srlimit: "1",
  });

  const searchResponse = await fetch(`${WIKIPEDIA_API}?${searchParams.toString()}`, {
    next: { revalidate: 86400 },
  });

  if (!searchResponse.ok) {
    return null;
  }

  const searchData = await searchResponse.json();
  const pageTitle = searchData?.query?.search?.[0]?.title;
  if (!pageTitle) return null;

  const summaryResponse = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`,
    { next: { revalidate: 86400 } }
  );

  if (!summaryResponse.ok) {
    return null;
  }

  const summary = await summaryResponse.json();
  if (!summary?.extract) return null;

  return {
    title: pageTitle,
    extract: truncate(summary.extract, 900),
    url: summary.content_urls?.desktop?.page ?? null,
  };
}

async function tavilySearch(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: 3,
      include_answer: true,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const snippets = (data.results ?? [])
    .map((result) => result.content || result.snippet)
    .filter(Boolean)
    .slice(0, 3);

  return {
    answer: data.answer ? truncate(data.answer, 600) : null,
    snippets: snippets.map((snippet) => truncate(snippet, 400)),
  };
}

function appendDigest(parts, heading, body) {
  if (!body?.trim()) return;
  parts.push(`### ${heading}\n${body.trim()}`);
}

/**
 * Public web research for Story Atlas (no EPUB body text).
 */
export async function researchStoryAtlasContext(identity) {
  if (process.env.API_USE_MOCKS === "true") {
    return {
      digest:
        "Research (mock): Well-known fantasy sequel; prior volume establishes main factions and protagonists.",
      sources: ["mock"],
    };
  }

  if (process.env.STORY_ATLAS_DISABLE_WEB_RESEARCH === "true") {
    return { digest: "", sources: [] };
  }

  const log = logApiCall("Story Atlas research", {
    bookTitle: identity.bookTitle,
    seriesIndex: identity.seriesIndex,
  });

  const queries = buildSearchQueries(identity);
  const parts = [];
  const sources = [];

  try {
    for (const query of queries) {
      const wiki = await wikipediaSearchSummary(query);
      if (wiki) {
        appendDigest(parts, `Wikipedia: ${wiki.title}`, wiki.extract);
        if (wiki.url) sources.push(wiki.url);
      }

      const tavily = await tavilySearch(query);
      if (tavily?.answer) {
        appendDigest(parts, `Web summary: ${query}`, tavily.answer);
      }
      if (tavily?.snippets?.length) {
        appendDigest(parts, `Web notes: ${query}`, tavily.snippets.join("\n"));
      }
    }

    const digest = truncate(parts.join("\n\n"), MAX_DIGEST_CHARS);
    log.finish({ sources: sources.length, digestLength: digest.length });
    return { digest, sources };
  } catch (error) {
    log.fail(error);
    return { digest: "", sources: [] };
  }
}
