# spagooty-patch

Telegram bot that posts to a chat when Slay the Spire 2 publishes patch notes on Steam.

Source: Steam News API (`ISteamNews/GetNewsForApp`, no key needed), official announcements only, filtered to
posts tagged `patchnotes` or titled "patch"/"hotfix". Seen post IDs are kept in `state.json`.

## Setup

1. Create a bot with [@BotFather](https://t.me/BotFather) → copy the token.
2. Add the bot to your group and send any message in it.
3. `cp .env.example .env`, fill in `TELEGRAM_BOT_TOKEN`, then `just chats` to get the chat ID → set `TELEGRAM_CHAT_ID`.
4. `just test-alert` sends the latest patch note to confirm it works.

## Running

- `just check` — one-shot (for cron/launchd/GitHub Actions)
- `just watch` — long-running poller, `POLL_INTERVAL_MINUTES` (default 10)

### GitHub Actions (free hosting)

Push to a GitHub repo, add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` as repo secrets. The workflow:

- checks every 5 minutes (GitHub's minimum; runs are often late by 5–20 min under load)
- `just watch-remote 240` starts a watch window that polls every 60s for N minutes (max 350) — use it before a
  known patch drop for ~1 minute latency independent of GitHub's cron delays

It commits `state.json` back when it alerts, so `git pull` before editing locally. GitHub disables scheduled
workflows after 60 days without repo activity — re-enable from the Actions tab if that happens.
