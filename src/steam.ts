export type PatchNote = {
  gid: string;
  title: string;
  url: string;
  date: number; // unix seconds
  summary: string;
};

type NewsItem = {
  gid: string;
  title: string;
  url: string;
  date: number;
  contents: string;
  feedname: string;
  tags?: string[] | null;
};

const PATCH_TITLE = /\b(patch|hotfix)\b/i;

export function isPatchNote(item: Pick<NewsItem, "feedname" | "title" | "tags">): boolean {
  if (item.feedname !== "steam_community_announcements") return false;
  return item.tags?.includes("patchnotes") || PATCH_TITLE.test(item.title);
}

/** Steam contents are BBCode-ish; strip markup down to readable text. */
export function cleanSummary(contents: string): string {
  return contents
    .replace(/\{STEAM_CLAN_IMAGE\}\S*/g, "")
    .replace(/\[\/?[^\]]+\]/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchPatchNotes(appId: string, count = 20): Promise<PatchNote[]> {
  const url = new URL("https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/");
  url.search = new URLSearchParams({
    appid: appId,
    count: String(count),
    maxlength: "300",
    feeds: "steam_community_announcements",
    format: "json",
  }).toString();

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Steam API ${res.status}: ${await res.text()}`);

  const body = (await res.json()) as { appnews?: { newsitems?: NewsItem[] } };
  const items = body.appnews?.newsitems ?? [];

  return items
    .filter(isPatchNote)
    .map((i) => ({ gid: i.gid, title: i.title, url: i.url, date: i.date, summary: cleanSummary(i.contents) }))
    .sort((a, b) => a.date - b.date); // oldest first, so alerts post in order
}
