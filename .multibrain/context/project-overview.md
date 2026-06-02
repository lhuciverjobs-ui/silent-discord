# Project Overview

## Discord Bot — Full Stack

**Runtime:** Node v24.16.0 — native `fetch`, no polyfill
**Library:** Discord.js v14.26.4
**Platform:** Windows (win32)

### Architecture
```
src/
├── index.js                    ← Entry point, loads commands/events
├── commands/ (24 files)        ← Prefix-based (!)
├── events/                     ← clientReady, messageCreate, guildMemberAdd/Remove
├── utils/                      ← coinData, walletCheck, alertStore, guildConfig, mathEval, jamClock, afkStore
├── coindata-cache.json         ← CoinGecko list cache (~2MB, 24h refresh)
├── guild-settings.json         ← Per-guild config
└── afk-store.json              ← AFK status storage
```

### Commands (24)
| Category | Commands |
|----------|----------|
| Crypto | `price`, `alert`, `alerts`, `cek`, `gas`, `chart` |
| Komunitas | `userinfo`, `serverinfo`, `cuaca`, `sellers`, `afk`, `back` |
| Moderation | `ban`, `kick` |
| Admin | `addseller`, `delseller`, `setwelcome`, `setgoodbye`, `testwelcome`, `testgoodbye`, `setjam` |
| Utility | `help`, `announce`, `poll` |

### Smart Features (no prefix)
- Math calculator (safe recursive descent parser)
- Currency/crypto conversion (multi-provider)
- "jam" keyword → clock image
- "seller" keyword → seller list
- AFK auto-detect (mention reply + auto-remove)

### Key Config
- Default prefix: `!`
- Default jam image URL (hardcoded)
- Two `guild-settings.json` files: root (empty), `src/guild-settings.json` (real)
- SCAN_API_KEY required for Etherscan V2 wallet tx timestamp

### Tests
- `test/welcome-goodbye.test.js` — 4 tests, 2 pre-existing failures (unrelated)
