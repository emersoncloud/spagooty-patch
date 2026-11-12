# Check once for new patch notes and alert (first run seeds state.json silently)
check:
    bun src/main.ts check

# Long-running poller (POLL_INTERVAL_MINUTES, default 10)
watch:
    bun src/main.ts watch

# List chat IDs that have messaged the bot — use to find TELEGRAM_CHAT_ID
chats:
    bun src/main.ts chats

# Send the latest patch note to the chat to verify setup
test-alert:
    bun src/main.ts test

test:
    bun test

typecheck:
    bunx tsc

# On GitHub Actions: poll every 60s for N minutes (max 350) — start shortly before an expected patch
watch-remote minutes="240":
    gh workflow run check.yml -f watch_minutes={{minutes}}

# Trigger a single check on GitHub Actions now
check-remote:
    gh workflow run check.yml
