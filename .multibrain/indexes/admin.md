# Admin Bucket

## Commands
- `setwelcome.js` / `setgoodbye.js` — Set welcome/goodbye channel via `guildConfig.js`
- `testwelcome.js` / `testgoodbye.js` — Preview welcome/goodbye embeds
- `setjam.js` — Set custom image URL for "jam" keyword
- `setsellerrole.js` — Set role yg auto-assign ke seller baru
- `addseller.js` / `delseller.js` — Trusted seller management (admin-only)

## Events
- `guildMemberAdd.js` — Send welcome embed in configured channel
- `guildMemberRemove.js` — Send goodbye embed in configured channel

## Key Decisions
- Guild config stored in `src/guild-settings.json`
- Welcome/goodbye use guild-specific channel config
- Seller role disimpan sebagai `sellerRoleId` di guild config
- `!addseller` auto-assign role kalo dikonfigurasi; `!delseller` auto-remove
- Bot cek `role.editable` sebelum assign/copot buat avoid error

## Known Issues
- 2 pre-existing test failures in `test/welcome-goodbye.test.js` — mock channel objects missing `send` method. Not related to our changes.

## Files
- `src/commands/setwelcome.js`
- `src/commands/setgoodbye.js`
- `src/commands/testwelcome.js`
- `src/commands/testgoodbye.js`
- `src/commands/setjam.js`
- `src/commands/setsellerrole.js`
- `src/events/guildMemberAdd.js`
- `src/events/guildMemberRemove.js`
- `src/utils/guildConfig.js` — includes `getSellerRoleId()`, `setSellerRoleId()`, `clearSellerRoleId()`
