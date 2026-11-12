import type { PatchNote } from "./steam";

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function formatPatchNote(note: PatchNote): string {
  const lines = [`🗡️ <b>Slay the Spire 2 — ${escapeHtml(note.title)}</b>`];
  if (note.summary) lines.push("", escapeHtml(note.summary));
  lines.push("", `<a href="${escapeHtml(note.url)}">Read the full patch notes</a>`);
  return lines.join("\n");
}

/** Returns the chat Telegram actually delivered to, so a wrong TELEGRAM_CHAT_ID is visible. */
export async function sendMessage(token: string, chatId: string, html: string): Promise<Chat> {
  const msg = await call<{ chat: Chat }>(token, "sendMessage", { chat_id: chatId, text: html, parse_mode: "HTML" });
  return msg.chat;
}

export const chatName = (c: Chat) => c.title ?? (c.username ? `@${c.username}` : c.first_name ?? "(unnamed)");

async function call<T>(token: string, method: string, params: object = {}): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!body.ok) throw new Error(`Telegram ${method} failed: ${body.description ?? res.status}`);
  return body.result;
}

export type Chat = { id: number; type: string; title?: string; username?: string; first_name?: string };
export type ChatInfo = { id: number; type: string; name: string; migratedTo?: number };

export type ChatDiscovery = {
  bot: string;
  privacyMode: boolean;
  webhookUrl: string;
  updateCount: number;
  chats: ChatInfo[];
};

/** Discovers chat IDs from pending updates, plus the bot settings that commonly hide them. */
export async function discoverChats(token: string): Promise<ChatDiscovery> {
  const me = await call<{ username: string; can_read_all_group_messages: boolean }>(token, "getMe");
  const webhook = await call<{ url: string }>(token, "getWebhookInfo");
  const base = { bot: me.username, privacyMode: !me.can_read_all_group_messages, webhookUrl: webhook.url };
  // getUpdates returns 409 while a webhook is set; nothing to read.
  if (webhook.url) return { ...base, updateCount: 0, chats: [] };

  const updates = await call<Record<string, any>[]>(token, "getUpdates", {
    allowed_updates: ["message", "edited_message", "channel_post", "edited_channel_post", "my_chat_member", "chat_member"],
  });

  const chats = new Map<number, ChatInfo>();
  for (const u of updates) {
    // Every update type carries its payload in a single field that has a .chat
    const payload = Object.values(u).find((v) => v && typeof v === "object" && "chat" in v);
    const chat: Chat | undefined = payload?.chat;
    if (!chat) continue;
    const info = chats.get(chat.id) ?? {
      id: chat.id,
      type: chat.type,
      name: chatName(chat),
    };
    // Group upgraded to supergroup: the old ID stops working
    if (payload.migrate_to_chat_id) info.migratedTo = payload.migrate_to_chat_id;
    chats.set(chat.id, info);
  }
  return { ...base, updateCount: updates.length, chats: [...chats.values()] };
}
