# AFK Bucket

## Commands
- `afk.js` — `!afk [alasan]` — Set user as AFK. Stores userId, reason, timestamp to `afk-store.json`. Sends embed + DM confirmation.
- `back.js` — `!back` — Manual AFK removal. Shows duration embed.

## Auto-Detect (in `messageCreate.js`)
1. **Mention AFK** — If message mentions a user who is AFK, bot replies with embed showing who's AFK, reason, and since when.
2. **Auto-remove** — If message author is AFK, automatically removes AFK and sends welcome back embed with duration.

## Logic
```
!afk → setAFK(userId, reason, timestamp) → afk-store.json
ngirim chat → check if author AFK? → removeAFK → embed welcome back
              check if mentioned users AFK? → reply embed
```

## Storage
- `src/afk-store.json` — Simple JSON, { userId: { reason, since } }
- `src/utils/afkStore.js` — CRUD methods (setAFK, removeAFK, getAFK, isAFK, getAllAFK, formatDuration)

## Files
- `src/commands/afk.js`
- `src/commands/back.js`
- `src/utils/afkStore.js`
- `src/events/messageCreate.js` (modified)
