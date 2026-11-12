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
