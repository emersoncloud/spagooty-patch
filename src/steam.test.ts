import { describe, expect, test } from "bun:test";
import { cleanSummary, isPatchNote } from "./steam";
import { formatPatchNote } from "./telegram";

const official = "steam_community_announcements";

describe("isPatchNote", () => {
  test("tagged patchnotes", () => {
    expect(isPatchNote({ feedname: official, title: "Beta Patch Notes - v0.111.0", tags: ["patchnotes"] })).toBe(true);
  });
  test("untagged but titled as patch/hotfix", () => {
    expect(isPatchNote({ feedname: official, title: "Hotfix v1.0.2", tags: null })).toBe(true);
  });
  test("newsletter is not a patch", () => {
    expect(isPatchNote({ feedname: official, title: "The Neowsletter - October 2026", tags: null })).toBe(false);
  });
  test("press coverage is ignored even if it mentions patches", () => {
    expect(isPatchNote({ feedname: "PCGamesN", title: "New Slay the Spire 2 patch nerfs Mirage", tags: null })).toBe(false);
  });
});

test("cleanSummary strips BBCode and images", () => {
  expect(cleanSummary("[h2]BUG FIXES[/h2]\n{STEAM_CLAN_IMAGE}/abc.png [list][*]Fixed thing[/list]")).toBe("BUG FIXES Fixed thing");
});

test("formatPatchNote escapes HTML", () => {
  const msg = formatPatchNote({ gid: "1", title: "A<B> & C", url: "https://x.y/?a=1&b=2", date: 0, summary: "<3" });
  expect(msg).toContain("A&lt;B&gt; &amp; C");
  expect(msg).toContain('href="https://x.y/?a=1&amp;b=2"');
  expect(msg).toContain("&lt;3");
});
