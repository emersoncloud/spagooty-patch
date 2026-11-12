import { fetchPatchNotes } from "./steam";
import { chatName, discoverChats, formatPatchNote, sendMessage } from "./telegram";

const SLAY_THE_SPIRE_2 = "2868840";
const MAX_SEEN = 200;

type State = { seen: string[] };

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name} (see .env.example)`);
  return v;
}

async function loadState(path: string): Promise<State | null> {
  const file = Bun.file(path);
  return (await file.exists()) ? ((await file.json()) as State) : null;
}

const saveState = (path: string, state: State) =>
  Bun.write(path, JSON.stringify({ seen: state.seen.slice(-MAX_SEEN) }, null, 2) + "\n");

async function check(): Promise<void> {
  const appId = process.env.STEAM_APP_ID ?? SLAY_THE_SPIRE_2;
  const statePath = process.env.STATE_FILE ?? "state.json";

  const notes = await fetchPatchNotes(appId);
  const state = await loadState(statePath);

  // First run: record what already exists so we don't dump the whole backlog into the chat.
  if (!state) {
    await saveState(statePath, { seen: notes.map((n) => n.gid) });
    console.log(`Seeded ${statePath} with ${notes.length} existing patch notes; future patches will alert.`);
    return;
  }

  const seen = new Set(state.seen);
  const fresh = notes.filter((n) => !seen.has(n.gid));
  if (fresh.length === 0) return console.log("No new patch notes.");

  const token = env("TELEGRAM_BOT_TOKEN");
  const chatId = env("TELEGRAM_CHAT_ID");

  for (const note of fresh) {
    await sendMessage(token, chatId, formatPatchNote(note));
    state.seen.push(note.gid);
    await saveState(statePath, state); // persist per message so a mid-loop failure doesn't re-send
    console.log(`Alerted: ${note.title}`);
  }
}

async function main() {
  const cmd = process.argv[2] ?? "check";

  if (cmd === "chats") {
    const d = await discoverChats(env("TELEGRAM_BOT_TOKEN"));
    console.log(`Bot @${d.bot} · privacy mode ${d.privacyMode ? "ON" : "off"} · ${d.updateCount} pending updates`);
    if (d.webhookUrl) {
      console.log(`A webhook is set (${d.webhookUrl}), so getUpdates is disabled. Remove it with:`);
      console.log(`  curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/deleteWebhook"`);
      return;
    }
    for (const c of d.chats) {
      console.log(`${c.id}\t${c.type}\t${c.name}${c.migratedTo ? `\t→ migrated, use ${c.migratedTo}` : ""}`);
    }
    if (d.chats.length === 0) {
      console.log("No chats found. Updates only stay available for 24h, and in groups with privacy mode on, @mentions");
      console.log(`aren't delivered. Send "/start@${d.bot}" in the group, or remove and re-add the bot, then retry.`);
    }
    return;
  }

  if (cmd === "test") {
    const [latest] = (await fetchPatchNotes(process.env.STEAM_APP_ID ?? SLAY_THE_SPIRE_2)).slice(-1);
    if (!latest) throw new Error("No patch notes found to send.");
    const chat = await sendMessage(env("TELEGRAM_BOT_TOKEN"), env("TELEGRAM_CHAT_ID"), formatPatchNote(latest));
    return console.log(`Sent test alert "${latest.title}" to ${chat.type} "${chatName(chat)}" (${chat.id})`);
  }

  if (cmd === "watch") {
    const minutes = Number(process.env.POLL_INTERVAL_MINUTES ?? 10);
    console.log(`Polling every ${minutes}m`);
    while (true) {
      await check().catch((e) => console.error(new Date().toISOString(), e));
      await Bun.sleep(minutes * 60_000);
    }
  }

  if (cmd === "check") return check();

  throw new Error(`Unknown command "${cmd}". Use: check | watch | chats | test`);
}

await main();
