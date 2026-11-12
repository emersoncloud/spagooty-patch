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

Push to a GitHub repo, add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` as repo secrets. The workflow runs every
15 minutes and commits `state.json` back when it alerts. Caveats: GitHub cron often runs late by 5–20 min, and
disables scheduled workflows after 60 days without repo activity — re-enable from the Actions tab if that happens.
