# Crypto Bucket

## Commands
- `price.js` — CoinGecko API, 17k+ coins, fuzzy search by symbol/name, priority coin map (128 coins) blocking scam duplicates, multi-currency + quantity support, universal parser (supports `!price 1 wld to idr`), 24h cache, QuickChart sparkline embed, **🗑️ delete button** (only command author, 2min timeout, auto-hides on timeout)
- `alert.js` / `alerts.js` — Price alert CRUD, DM notification every 60s via `alertStore.js`
- `cek.js` — Multi-chain wallet checker (11 chains: ETH, BSC, Polygon, Celo, Avalanche, Arbitrum, Optimism, Base, Fantom, Solana, Aptos). Raw JSON-RPC, auto-detect chain from address format, ERC20 token holdings via `eth_call` (batch 4 concurrent), CoinGecko batch pricing, Etherscan API V2 unified for last tx timestamp, wallet health traits
- `gas.js` — Gas tracker for 9 EVM chains via `eth_gasPrice` + `eth_feeHistory` RPC. Shows safe/standard/fast Gwei + USD cost estimates. No API key.
- `chart.js` — Price chart via CoinGecko + QuickChart. 6 periods (1d/7d/14d/30d/90d/1y). Attachment-based image (bypasses 2048 Discord embed URL limit). Color-coded green/red.

## Key Decisions
- CoinGecko sole price source (free, 17k+ coins, ~10-30 req/min)
- `alertStore.js` — JSON file CRUD
- Raw JSON-RPC for wallet + gas (no web3 package)
- CoinGecko list cache at `src/coindata-cache.json` (~2MB), refreshes 24h
- SCAN_API_KEY env var for Etherscan V2 unified API
- Batch CoinGecko pricing for tokens (1 call, not 1 per token)

## Known Issues
- CoinGecko rate limit (~10-30 req/min) — multiple !cek calls in succession may 429
- BSC scan API not on free Etherscan tier — no last tx timestamp for BSC
- Solana/Aptos have no scan API — no last tx timestamp

## Files
- `src/commands/price.js`
- `src/commands/cek.js`
- `src/commands/gas.js`
- `src/commands/chart.js`
- `src/commands/alert.js`
- `src/commands/alerts.js`
- `src/utils/coinData.js`
- `src/utils/alertStore.js`
- `src/utils/walletCheck.js`
