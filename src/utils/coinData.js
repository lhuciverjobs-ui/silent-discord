const fs = require('fs');
const path = require('path');

const FOREX_API = 'https://open.er-api.com/v6/latest/USD';

const CACHE_PATH = path.join(__dirname, '..', 'coindata-cache.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const API_COIN_LIST = 'https://api.coingecko.com/api/v3/coins/list';
const API_BASE = 'https://api.coingecko.com/api/v3';

// ─── Priority coin map — symbol → CoinGecko ID ─────────────────
// Biar pas cari "btc" dapet Bitcoin, bukan scam coin lain
const PRIORITY_COINS = {
  btc: 'bitcoin', eth: 'ethereum', sol: 'solana', xrp: 'ripple',
  doge: 'dogecoin', ada: 'cardano', bnb: 'binancecoin', dot: 'polkadot',
  avax: 'avalanche-2', matic: 'matic-network', link: 'chainlink',
  uni: 'uniswap', atom: 'cosmos', algo: 'algorand', fil: 'filecoin',
  sand: 'the-sandbox', mana: 'decentraland', vet: 'vechain',
  icp: 'internet-computer', near: 'near', apt: 'aptos',
  arbitrum: 'arbitrum', op: 'optimism', inj: 'injective-protocol',
  sei: 'sei-network', sui: 'sui', tia: 'celestia', dym: 'dymension',
  wif: 'dogwifcoin', pepe: 'pepe', bonk: 'bonk',
  shib: 'shiba-inu', floki: 'floki', people: 'constitutiondao',
  ltc: 'litecoin', bch: 'bitcoin-cash', zec: 'zcash', dash: 'dash',
  xmr: 'monero', etc: 'ethereum-classic', xlm: 'stellar',
  trx: 'tron', ton: 'the-open-network', eos: 'eos',
  xtz: 'tezos', algo: 'algorand', flow: 'flow', theta: 'theta-token',
  ftt: 'ftx-token', cro: 'crypto-com-chain', hbar: 'hedera',
  iota: 'iota', ksm: 'kusama', waves: 'waves', egld: 'elrond-erd-2',
  neo: 'neo', xem: 'nem', zil: 'zilliqa', hot: 'holotoken',
  one: 'harmony', celo: 'celo', rose: 'oasis-network',
  axs: 'axie-infinity', slp: 'smooth-love-potion', enj: 'enjincoin',
  chz: 'chiliz', gala: 'gala', loom: 'loom-network',
  aave: 'aave', comp: 'compound', crv: 'curve-dao-token',
  yfi: 'yearn-finance', snx: 'synthetix-network-token',
  bal: 'balancer', ldo: 'lido-dao', rpl: 'rocket-pool',
  fx: 'function-x', stg: 'stargate-finance', gmx: 'gmx',
  cake: 'pancakeswap', sushi: 'sushi', quickswap: 'quickswap',
  pendle: 'pendle', rdnt: 'radiant-capital', ar: 'arweave',
  hnt: 'helium', iost: 'iost', btt: 'bittorrent',
  win: 'wink', fet: 'fetch-ai', ocean: 'ocean-protocol',
  agix: 'singularitynet', nmr: 'numeraire', gtc: 'gitcoin',
  zen: 'horizen', sc: 'siacoin', storj: 'storj', ankr: 'ankr',
  ens: 'ethereum-name-service', bico: 'biconomy', mask: 'mask-network',
  tel: 'telcoin', bat: 'basic-attention-token', zrx: '0x',
  dydx: 'dydx', perp: 'perpetual-protocol', stmx: 'stormx',
  rlc: 'iexec-rlc', poly: 'polymath', orbs: 'orbs',
  pay: 'tenx', knc: 'kyber-network-crystal', omg: 'omisego',
  lrc: 'loopring', bnt: 'bancor', ant: 'aragon', gno: 'gnosis',
  cvc: 'civic', powr: 'power-ledger', rep: 'augur',
  ada: 'cardano', algo: 'algorand',
  // Stablecoins
  usdt: 'tether', usdc: 'usd-coin', dai: 'dai', tusd: 'true-usd',
  frax: 'frax', busd: 'binance-usd', usdd: 'usdd',
  // AI & Gaming
  rndr: 'render-token', taik: 'taiko', wld: 'worldcoin-org',
  beam: 'beam', imx: 'immutable-x', pixel: 'pixels',
  // Additional popular
  strk: 'starknet', zk: 'zksync', core: 'coredao',
  ordi: 'ordinals', sats: 'sats', rats: 'rats',
  mkr: 'maker', tusd: 'true-usd',
};

const PRIORITY_KEYS = new Set(Object.keys(PRIORITY_COINS));

const CURRENCY_SYMBOLS = {
  usd: '$', idr: 'Rp', eur: '€', gbp: '£', jpy: '¥', cny: '¥',
  krw: '₩', sgd: 'S$', myr: 'RM', php: '₱', thb: '฿', vnd: '₫',
  cad: 'C$', aud: 'A$', chf: 'Fr', hkd: 'HK$', twd: 'NT$', zar: 'R',
  brl: 'R$', inr: '₹', rub: '₽', try: '₺', sar: '﷼', aed: 'د.إ',
  nok: 'kr', dkk: 'kr', sek: 'kr', pln: 'zł', czk: 'Kč',
};

const FIAT_CODES = new Set(Object.keys(CURRENCY_SYMBOLS));

async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

let coinCache = null;
let cacheTimestamp = 0;
let priorityCoinCache = null; // Pre-resolved priority coins from cache

function loadCacheFromDisk() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const raw = fs.readFileSync(CACHE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      coinCache = data.list || [];
      cacheTimestamp = data.timestamp || 0;
      return true;
    }
  } catch { /* ignore */ }
  return false;
}

function saveCacheToDisk(list) {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify({ timestamp: Date.now(), list }, null, 2));
  } catch { /* ignore */ }
}

function resolvePriorityCoins() {
  if (!coinCache) return;
  priorityCoinCache = {};
  for (const [symbol, id] of Object.entries(PRIORITY_COINS)) {
    const coin = coinCache.find(c => c.id === id);
    if (coin) priorityCoinCache[symbol] = coin;
  }
}

async function fetchCoinList() {
  const res = await fetchWithTimeout(API_COIN_LIST, 15000);
  if (!res.ok) throw new Error(`CoinGecko list API: ${res.status}`);
  return res.json();
}

async function ensureCoinList() {
  if (!coinCache) loadCacheFromDisk();
  const now = Date.now();
  if (coinCache && (now - cacheTimestamp) < CACHE_TTL_MS) {
    if (!priorityCoinCache) resolvePriorityCoins();
    return;
  }

  try {
    const list = await fetchCoinList();
    coinCache = list;
    cacheTimestamp = now;
    saveCacheToDisk(list);
    resolvePriorityCoins();
    console.log(`✅ Coin list cached: ${list.length} coins, ${Object.keys(priorityCoinCache || {}).length} priority`);
  } catch (err) {
    console.error('❌ Gagal fetch coin list:', err.message);
    if (!coinCache) coinCache = [];
    if (!priorityCoinCache) priorityCoinCache = {};
  }
}

function searchCoin(query) {
  if (!coinCache) return [];
  const q = query.toLowerCase().trim();

  // 1. Priority symbol check — cegah scam coin duplicate symbol
  if (PRIORITY_KEYS.has(q) && priorityCoinCache?.[q]) {
    return [priorityCoinCache[q]];
  }

  // 2. Priority name check — biar "bitcoin" dapet Bitcoin, bukan coin scam dgn symbol "bitcoin"
  if (priorityCoinCache) {
    const nameMatch = Object.values(priorityCoinCache).find(c => c.name.toLowerCase() === q);
    if (nameMatch) return [nameMatch];
  }

  // 3. Name starts with priority check
  if (priorityCoinCache) {
    const nameStartsMatch = Object.values(priorityCoinCache).find(c => c.name.toLowerCase().startsWith(q));
    if (nameStartsMatch) return [nameStartsMatch];
  }

  // 4. Normal search dari full list
  const exactSymbol = coinCache.filter(c => c.symbol.toLowerCase() === q);
  if (exactSymbol.length === 1) return exactSymbol;

  const symbolStarts = coinCache.filter(c => c.symbol.toLowerCase().startsWith(q));
  if (symbolStarts.length === 1) return symbolStarts;

  const nameStarts = coinCache.filter(c => c.name.toLowerCase().startsWith(q));
  if (nameStarts.length === 1) return nameStarts;

  const nameIncludes = coinCache.filter(c => c.name.toLowerCase().includes(q));

  if (exactSymbol.length > 1) {
    for (const coin of exactSymbol) {
      if (Object.values(priorityCoinCache || {}).some(p => p.id === coin.id)) {
        return [coin];
      }
    }
    return exactSymbol.slice(0, 5);
  }
  if (nameStarts.length > 0) return nameStarts.slice(0, 5);
  if (nameIncludes.length > 0) return nameIncludes.slice(0, 5);
  if (symbolStarts.length > 0) return symbolStarts.slice(0, 5);

  return [];
}

async function fetchPrice(coinIds, currency = 'usd') {
  const currs = [...new Set(['usd', currency.toLowerCase()])].join(',');
  const url = `${API_BASE}/simple/price?ids=${coinIds.join(',')}&vs_currencies=${currs}&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`CoinGecko price API: ${res.status}`);
  return res.json();
}

async function fetchCoinMarketData(coinId) {
  const url = `${API_BASE}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`CoinGecko coin API: ${res.status}`);
  return res.json();
}

function getCurrencySymbol(currency) {
  const c = currency.toLowerCase();
  return CURRENCY_SYMBOLS[c] || c.toUpperCase() + ' ';
}

function formatPrice(num, currency = 'usd') {
  if (num == null) return 'N/A';
  const symbol = getCurrencySymbol(currency);

  if (num >= 1) {
    return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  const str = num.toFixed(10).replace(/0+$/, '');
  const decimals = str.split('.')[1];
  const precision = Math.min(6, (decimals?.length || 2) + 2);
  return `${symbol}${num.toFixed(Math.max(2, precision))}`;
}

function formatQuantityTotal(price, quantity, currency) {
  return formatPrice(price * quantity, currency);
}

function formatChange(change) {
  if (change == null) return 'N/A';
  const sign = change >= 0 ? '📈' : '📉';
  const color = change >= 0 ? '🟢' : '🔴';
  return `${sign} ${color} ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
}

function isFiatCurrency(code) {
  return FIAT_CODES.has(code.toLowerCase());
}

// ─── Forex (fiat-to-fiat) ─────────────────────────────────

let fiatRatesCache = null;
let fiatRatesTimestamp = 0;
const FIAT_RATES_TTL = 5 * 60 * 1000; // 5 min

async function ensureFiatRates() {
  const now = Date.now();
  if (fiatRatesCache && now - fiatRatesTimestamp < FIAT_RATES_TTL) return fiatRatesCache;

  try {
    const res = await fetchWithTimeout(FOREX_API, 8000);
    if (!res.ok) throw new Error(`Forex API: ${res.status}`);
    const data = await res.json();
    const rates = { usd: 1 };
    for (const code of FIAT_CODES) {
      if (code === 'usd') continue;
      const upper = code.toUpperCase();
      if (data.rates?.[upper]) rates[code] = data.rates[upper];
    }
    fiatRatesCache = rates;
    fiatRatesTimestamp = now;
    return rates;
  } catch (err) {
    if (fiatRatesCache) return fiatRatesCache; // stale cache better than nothing
    throw new Error(`Gagal ambil kurs forex: ${err.message}`);
  }
}

// ─── Quick symbol check for converter ─────────────────────

const PRIORITY_SYMBOLS = new Set(Object.keys(PRIORITY_COINS));

function isKnownSymbol(symbol) {
  const s = symbol.toLowerCase();
  if (FIAT_CODES.has(s)) return true;
  if (PRIORITY_SYMBOLS.has(s)) return true;
  if (!coinCache) return false;
  return coinCache.some(c => c.symbol.toLowerCase() === s);
}

// ─── Unified converter ────────────────────────────────────

async function convert({ amount, from, to }) {
  const fromL = from.toLowerCase();
  const toL = to.toLowerCase();

  // Crypto → fiat (or crypto → crypto via USD bridge)
  const fromCoin = searchCoin(fromL);
  const toCoin = searchCoin(toL);
  const isFromCrypto = fromCoin.length > 0;
  const isToCrypto = toCoin.length > 0;

  // Both are fiat
  if (!isFromCrypto && !isToCrypto && FIAT_CODES.has(fromL) && FIAT_CODES.has(toL)) {
    const rates = await ensureFiatRates();
    const inUsd = fromL === 'usd' ? amount : amount / rates[fromL];
    const result = toL === 'usd' ? inUsd : inUsd * rates[toL];
    return {
      result,
      label: `${formatPrice(amount, fromL)} → ${formatPrice(result, toL)}`,
      from: fromL.toUpperCase(),
      to: toL.toUpperCase(),
      rate: fromL === 'usd' ? rates[toL] : rates[toL] / rates[fromL],
    };
  }

  // From is crypto → get price in target
  if (isFromCrypto) {
    const price = await fetchPrice([fromCoin[0].id], toL);
    const data = price[fromCoin[0].id];
    if (!data || data[toL] == null) {
      throw new Error(`Harga ${fromCoin[0].name} dalam ${toL.toUpperCase()} tidak tersedia`);
    }
    const rate = data[toL];
    const result = amount * rate;
    return {
      result,
      label: `${formatPrice(amount, fromL)} → ${formatPrice(result, toL)}`,
      from: fromCoin[0].symbol.toUpperCase(),
      to: toL.toUpperCase(),
      rate,
    };
  }

  // To is crypto — must convert via USD
  if (isToCrypto) {
    let inUsd;
    if (FIAT_CODES.has(fromL)) {
      const rates = await ensureFiatRates();
      inUsd = fromL === 'usd' ? amount : amount / rates[fromL];
    } else {
      // from is also crypto — get its USD price
      const fromPrice = await fetchPrice([fromCoin[0].id], 'usd');
      const fromData = fromPrice[fromCoin[0].id];
      if (!fromData?.usd) throw new Error(`Harga ${fromCoin[0].name} tidak tersedia`);
      inUsd = amount * fromData.usd;
    }
    const toPrice = await fetchPrice([toCoin[0].id], 'usd');
    const toData = toPrice[toCoin[0].id];
    if (!toData?.usd) throw new Error(`Harga ${toCoin[0].name} tidak tersedia`);
    const result = inUsd / toData.usd;
    return {
      result,
      label: `${formatPrice(amount, fromL)} → ${amount} ${toCoin[0].symbol.toUpperCase()}`,
      from: fromL.toUpperCase(),
      to: toCoin[0].symbol.toUpperCase(),
      rate: 1 / toData.usd,
    };
  }

  throw new Error(`Konversi ${fromL.toUpperCase()} → ${toL.toUpperCase()} tidak didukung`);
}

// ─── Amount parser untuk converter ────────────────────────

function parseAmountExpr(expr) {
  if (!expr || !expr.trim()) return 1;
  const s = expr.trim().toLowerCase();
  // Handle k/m/b suffixes
  const sfx = s.match(/^(\d+(?:\.\d+)?)([kmb])$/);
  if (sfx) {
    const n = parseFloat(sfx[1]);
    const m = { k: 1e3, m: 1e6, b: 1e9 }[sfx[2]];
    return n * m;
  }
  // Try math evaluation
  const { isMathExpression, evaluate } = require('./mathEval');
  if (isMathExpression(s)) {
    const res = evaluate(s);
    if (res.ok) return res.value;
  }
  // Try plain number
  const n = parseFloat(s);
  if (!isNaN(n) && isFinite(n)) return n;
  return null;
}

module.exports = {
  ensureCoinList,
  searchCoin,
  fetchPrice,
  fetchCoinMarketData,
  formatPrice,
  formatQuantityTotal,
  formatChange,
  getCurrencySymbol,
  isFiatCurrency,
  isKnownSymbol,
  FIAT_CODES,
  getFiatRatesCache: () => fiatRatesCache, // raw cache access (may be null)
  convert,
  parseAmountExpr,
};
