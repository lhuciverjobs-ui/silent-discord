# 🤖 Silent Discord Bot

Bot Discord multifungsi — **crypto suite lengkap** + komunitas tools.  
Dibuat buat server crypto Indo dengan fitur price checker, wallet checker, gas tracker, chart, OCR, seller management, reaction roles, dan masih banyak lagi.

> **Note:** Bot ini pake **prefix** (default `!`). Semua fitur jalan via command prefix + beberapa fitur otomatis tanpa prefix.

---

## 🚀 Fitur Lengkap

### 💰 Crypto
| Command | Fungsi |
|---|---|
| `!price btc` | Harga Bitcoin dalam USD |
| `!price 1 wld to idr` | 1 WLD ke Rupiah |
| `!price btc 10 idr` | 10 BTC dalam Rupiah |
| `!price 0.5 eth usd` | 0.5 ETH ke USD |
| `!cek 0x...` | Cek wallet (11 chains: ETH, BSC, Polygon, Solana, Aptos, Celo, Avalanche, Arbitrum, Optimism, Base, Fantom) |
| `!gas` | Gas fee Ethereum terkini |
| `!gas bsc` | Gas fee BNB Chain |
| `!chart btc` | Chart BTC 7 hari |
| `!chart eth 1d` | Chart ETH 24 jam |
| `!alert btc above 100000` | Alert kalo BTC di atas $100rb |
| `!alerts` | Lihat semua alert lo |
| `!alerts remove <id>` | Hapus alert |

**Fitur otomatis (tanpa prefix):**
- `2+2`, `sqrt(144)` → kalkulator
- `100 usd to idr` → konversi mata uang
- Kalo total `!price` > 1jt IDR → auto tag **AYAH KANDUNG! BOS! MY BINI!** 🗿

### 👥 Komunitas
| Command | Fungsi |
|---|---|
| `!help` | Menu bantuan lengkap |
| `!userinfo` | Info profil lo (lengkap) |
| `!userinfo @teman` | Info profil teman (terbatas) |
| `!serverinfo` | Detail server |
| `!cuaca jakarta` | Cek cuaca kota |
| `!sellers` | Lihat seller terpercaya |
| `!ocr` (reply/upload) | Baca teks dari gambar (ENG+IND) |
| `!afk mandi dulu` | Set status AFK |
| `!back` | Hapus status AFK |

**Fitur otomatis:**
- Ketik `jam` → liat gambar waktu
- Ketik `seller` → liat daftar seller
- Ketik `vmos` (cocok notes seller) → auto muncul seller terkait
- AFK auto-detect: mention yg AFK dikasih tau • auto-remove pas chat

### 🛡️ Moderasi
| Command | Fungsi |
|---|---|
| `!kick @user alasan` | Kick anggota |
| `!ban @user alasan` | Ban anggota |

### ⚙️ Admin
| Command | Fungsi |
|---|---|
| `!addseller @user` | Tambah seller terpercaya |
| `!delseller @user` | Hapus seller |
| `!setsellerrole @role` | Auto-assign role ke seller baru |
| `!setwelcome #channel` | Set channel welcome |
| `!setgoodbye #channel` | Set channel goodbye |
| `!setjam <url>` | Ganti gambar keyword "jam" |
| `!rr #channel "judul" 🎮 @role` | Buat reaction roles panel |

---

## 📦 Instalasi

### Prasyarat
- **Node.js** v18+ (recommended v20+)
- **npm** v9+
- **Discord Bot Token** — ambil di [Discord Developer Portal](https://discord.com/developers/applications)

### Langkah
```bash
# 1. Clone repo
git clone https://github.com/lhuciverjobs-ui/silent-discord.git
cd silent-discord

# 2. Install dependencies
npm install

# 3. Buat file .env
cp .env.example .env
# lalu isi BOT_TOKEN dan config lainnya

# 4. Jalankan bot
npm start
```

### 📄 File `.env`
```env
BOT_TOKEN=your_discord_bot_token_here
PREFIX=!
SCAN_API_KEY=your_etherscan_api_key
```

> `SCAN_API_KEY` — daftar gratis di [etherscan.io](https://etherscan.io/register) buat fitur `!cek` (last tx timestamp).

---

## 🏃‍♂️ Cara Run

### Mode development
```bash
npm start
```

### Mode production (PM2 — auto-restart kalo crash)
```bash
# Start
npm run pm2:start

# Cek status
npm run pm2:status

# Liat log realtime
npm run pm2:logs

# Restart
npm run pm2:restart

# Stop
npm run pm2:stop

# Dashboard interaktif
npm run pm2:monit
```

### Startup otomatis pas VPS nyala
```bash
npx pm2 startup
npx pm2 save
```

---

## 🧩 Dependencies

| Package | Versi | Fungsi |
|---|---|---|
| `discord.js` | ^14.16 | Discord API |
| `canvas` | ^3.2 | Generate gambar jam |
| `tesseract.js` | ^7.0 | OCR (baca teks dari gambar) |
| `dotenv` | ^16.3 | Load .env |
| `pm2` | ^7.0 | Process manager (dev dep) |

---

## 🧠 Fitur Smart (Tanpa Prefix)

Bot ini punya beberapa fitur yang jalan **otomatis tanpa perlu prefix `!`**:

1. **🧮 Kalkulator** — ketik `2+2`, `sqrt(144)`, `(10+5)*3`
2. **💱 Konversi** — ketik `100 usd to idr`, `btc to idr`
3. **🕐 Jam** — ketik `jam` → liat gambar waktu
4. **📋 Seller** — ketik `seller` → liat daftar seller
5. **🔍 Cari Seller** — ketik `vmos` → auto cocok notes seller
6. **💤 AFK** — auto-detect kalo mention user yg lagi AFK

---

## 🔧 Struktur Project

```
silent-discord/
├── src/
│   ├── index.js              # Entry point
│   ├── commands/             # Semua command (25 file)
│   │   ├── price.js          # Cek harga crypto
│   │   ├── cek.js            # Cek wallet
│   │   ├── gas.js            # Gas tracker
│   │   ├── chart.js          # Price chart
│   │   ├── ocr.js            # OCR dari gambar
│   │   ├── help.js           # Menu bantuan
│   │   └── ...
│   ├── events/               # Event handlers
│   │   ├── messageCreate.js  # Prefix + smart features
│   │   ├── ready.js          # Bot ready + alert checker
│   │   ├── guildMemberAdd.js # Welcome
│   │   └── guildMemberRemove.js # Goodbye
│   └── utils/                # Utility modules
│       ├── coinData.js       # CoinGecko API client
│       ├── walletCheck.js    # Multi-chain wallet engine
│       ├── guildConfig.js    # Guild settings CRUD
│       ├── mathEval.js       # Safe math parser
│       ├── jamClock.js       # Canvas clock generator
│       └── ...
├── test/                     # Unit tests
├── ecosystem.config.js       # PM2 config
├── package.json
└── .env                      # Config (gitignored)
```

---

## 📊 Stats

- **25+ commands** — dari crypto sampe moderasi
- **17k+ coins** — support dari CoinGecko
- **11 chains** — wallet checker (EVM + Solana + Aptos)
- **9 EVM chains** — gas tracker via raw RPC
- **0 API key required** — kebanyakan fitur gratis (kecuali scan API)
- **Zero npm dependencies for RPC** — raw `fetch()` untuk JSON-RPC

---

## 👤 Author

**Lhuciver (Jack)** — Full-stack developer & crypto enthusiast

---

## 📝 License

MIT — bebas dipake, diubah, didistribusiin.
