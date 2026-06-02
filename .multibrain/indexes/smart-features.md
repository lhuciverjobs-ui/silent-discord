# Smart Features Bucket

## Non-Prefix Features

### Math Calculator (`mathEval.js`)
- Safe recursive descent parser (~150 lines)
- 200-char max input
- No `eval()` — built from scratch
- Detection: `isMathExpression()` — must start with digit/paren/ident/minus, only contain `[0-9+\-*/()^%.a-zA-Z,\s]`, have at least one operator or function, and at least one digit
- Supports: +, -, *, /, ^, %, sqrt(), abs(), round(), floor(), ceil()

### Currency Conversion (`coinData.js`)
- Tokenizes by space, scans for known fiat + crypto codes
- Supports `100 usd to idr`, `btc to idr`, `eth * 2 usd`
- Intermediate "to"/"ke"/"dalam" separators
- Forex rates from open.er-api.com (free, no key), cached 5 min

### Keyword Triggers
- **"jam"** — Shows hardcoded image URL (customizable via `!setjam`)
- **"seller"** — Shows trusted seller list with @mentions. **Smart filter:** `seller vmos` → hanya tampilkan seller dengan notes mengandung "vmos". Regex: `seller\s+(\S+)`
- **Auto-detect seller notes** — Kalo ada yg ngetik kata (2-30 chars, /^[a-z0-9]+$/i) yg cocok sama notes seller, bot auto kirim seller itu. Tanpa perlu kata "seller". Contoh: ngetik "vmos" → muncul seller dengan notes "vmos"
- **Seller role** — `!setsellerrole @role` → pas `!addseller`, bot otomatis assign role + pas `!delseller` otomatis copot role. Role dicek `editable` dulu.
- **Rich check di price** — Kalo total value > 1jt IDR, bot tag "AYAH KANDUNG! BOS! MY BINI!". Ada 5 tier: 1jt, 10jt, 100jt, 1M, 10M IDR. Konversi via fiat cache + fallback 16000. Fun feature.

## Key Decisions
- Conversion only triggers when 2+ known currency codes found
- Words like "sellers" (with "s") don't trigger because `\bseller\b` uses word boundary
- Default jam image: `https://h.top4top.io/p_3804jcny5.png`

## Files
- `src/utils/mathEval.js`
- `src/utils/coinData.js` (convert, parseAmountExpr, isKnownSymbol, isFiatCurrency)
- `src/utils/guildConfig.js` (getJamImage, getSellers)
- `src/events/messageCreate.js`
