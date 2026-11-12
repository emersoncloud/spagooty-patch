import { afterEach, expect, mock, test } from "bun:test";
import { discoverChats } from "./telegram";

const realFetch = globalThis.fetch;
afterEach(() => (globalThis.fetch = realFetch));

function mockTelegram(results: Record<string, unknown>) {
  globalThis.fetch = mock(async (url: string | URL | Request) => {
    const method = String(url).split("/").pop()!;
    return Response.json({ ok: true, result: results[method] });
  }) as unknown as typeof fetch;
}

const group = { id: -100123, type: "supergroup", title: "Spire Heads" };

test("finds chats from bot-added events and handles migration", async () => {
  mockTelegram({
    getMe: { username: "SpagootyBot", can_read_all_group_messages: false },
    getWebhookInfo: { url: "" },
    getUpdates: [
      { update_id: 1, my_chat_member: { chat: group } },
      { update_id: 2, message: { chat: { id: -555, type: "group", title: "Old" }, migrate_to_chat_id: -100123 } },
      { update_id: 3, message: { chat: { id: 42, type: "private", first_name: "Em" } } },
    ],
  });
  const d = await discoverChats("t");
  expect(d.privacyMode).toBe(true);
  expect(d.chats).toEqual([
    { id: -100123, type: "supergroup", name: "Spire Heads" },
    { id: -555, type: "group", name: "Old", migratedTo: -100123 },
    { id: 42, type: "private", name: "Em" },
  ]);
});

test("skips getUpdates when a webhook is set", async () => {
  mockTelegram({ getMe: { username: "b", can_read_all_group_messages: true }, getWebhookInfo: { url: "https://x" } });
  const d = await discoverChats("t");
  expect(d.webhookUrl).toBe("https://x");
  expect(d.chats).toEqual([]);
});
