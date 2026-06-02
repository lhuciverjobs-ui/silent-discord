# Moderation Bucket

## Commands
- `ban.js` — Ban member with embed confirmation
- `kick.js` — Kick member with embed confirmation

## Key Decisions
- Both require `BanMembers` / `KickMembers` permissions
- Permission check in `messageCreate.js` via `command.permissions`

## Files
- `src/commands/ban.js`
- `src/commands/kick.js`
