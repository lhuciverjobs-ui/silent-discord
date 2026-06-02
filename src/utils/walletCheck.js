/**
 * walletCheck.js — Multi-chain wallet checker
 * Supports: EVM (ETH, BSC, Polygon, Celo, Avalanche, Arbitrum, Optimism, Base, Fantom)
 *           + Solana, Aptos
 * Uses raw JSON-RPC (no deps), falls back to scan APIs for tx details & tokens.
 */
const coinData = require('./coinData');

// ─── Chain definitions ──────────────────────────────────────────────────

const CHAINS = {
  eth: {
    name: 'Ethereum',
    rpc: 'https://ethereum-rpc.publicnode.com',
    coingeckoId: 'ethereum',
    symbol: 'ETH',
    decimals: 18n,
    explorer: 'https://etherscan.io/address/{addr}',
    chainId: 1,
  },
  bsc: {
    name: 'BNB Smart Chain',
    rpc: 'https://bsc-rpc.publicnode.com',
    coingeckoId: 'binancecoin',
    symbol: 'BNB',
    decimals: 18n,
    explorer: 'https://bscscan.com/address/{addr}',
    chainId: 56,
  },
  polygon: {
    name: 'Polygon',
    rpc: 'https://polygon-bor-rpc.publicnode.com',
    coingeckoId: 'matic-network',
    symbol: 'MATIC',
    decimals: 18n,
    explorer: 'https://polygonscan.com/address/{addr}',
    chainId: 137,
  },
  celo: {
    name: 'Celo',
    rpc: 'https://forno.celo.org',
    coingeckoId: 'celo',
    symbol: 'CELO',
    decimals: 18n,
    explorer: 'https://celoscan.io/address/{addr}',
    chainId: 42220,
  },
  avax: {
    name: 'Avalanche C-Chain',
    rpc: 'https://avalanche-c-chain-rpc.publicnode.com',
    coingeckoId: 'avalanche-2',
    symbol: 'AVAX',
    decimals: 18n,
    explorer: 'https://snowtrace.io/address/{addr}',
    chainId: 43114,
  },
  arbitrum: {
    name: 'Arbitrum',
    rpc: 'https://arbitrum-rpc.publicnode.com',
    coingeckoId: 'ethereum',
    symbol: 'ETH',
    decimals: 18n,
    explorer: 'https://arbiscan.io/address/{addr}',
    chainId: 42161,
  },
  optimism: {
    name: 'Optimism',
    rpc: 'https://optimism-rpc.publicnode.com',
    coingeckoId: 'ethereum',
    symbol: 'ETH',
    decimals: 18n,
    explorer: 'https://optimistic.etherscan.io/address/{addr}',
    chainId: 10,
  },
  base: {
    name: 'Base',
    rpc: 'https://base-rpc.publicnode.com',
    coingeckoId: 'ethereum',
    symbol: 'ETH',
    decimals: 18n,
    explorer: 'https://basescan.org/address/{addr}',
    chainId: 8453,
  },
  fantom: {
    name: 'Fantom',
    rpc: 'https://rpc.fantom.network',
    coingeckoId: 'fantom',
    symbol: 'FTM',
    decimals: 18n,
    explorer: 'https://ftmscan.com/address/{addr}',
    chainId: 250,
  },
  sol: {
    name: 'Solana',
    rpc: 'https://api.mainnet-beta.solana.com',
    coingeckoId: 'solana',
    symbol: 'SOL',
    decimals: 9n,
    explorer: 'https://explorer.solana.com/address/{addr}',
    scanApi: null,
  },
  apt: {
    name: 'Aptos',
    rpc: 'https://fullnode.mainnet.aptoslabs.com/v1',
    coingeckoId: 'aptos',
    symbol: 'APT',
    decimals: 8n,
    explorer: 'https://explorer.aptoslabs.com/account/{addr}',
    scanApi: null,
  },
};

const CHAIN_ALIASES = {};
for (const [key, chain] of Object.entries(CHAINS)) {
  CHAIN_ALIASES[key] = key;
  CHAIN_ALIASES[chain.name.toLowerCase()] = key;
  // Only register symbol alias if not already taken (multiple chains share symbols like 'ETH')
  if (!CHAIN_ALIASES[chain.symbol.toLowerCase()]) {
    CHAIN_ALIASES[chain.symbol.toLowerCase()] = key;
  }
}
// Extra aliases (higher priority - register AFTER loop to avoid symbol clashes)
CHAIN_ALIASES.ethereum = 'eth';
CHAIN_ALIASES.bnb = 'bsc';
CHAIN_ALIASES.matic = 'polygon';
CHAIN_ALIASES.avalanche = 'avax';
CHAIN_ALIASES.arb = 'arbitrum';
CHAIN_ALIASES.op = 'optimism';
CHAIN_ALIASES.solana = 'sol';
CHAIN_ALIASES.aptos = 'apt';

// ─── Common tokens per chain ────────────────────────────────────────────
// { chainKey: { symbol: { address, coingeckoId } } }
const COMMON_TOKENS = {
  eth: {
    USDC:  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', gecko: 'usd-coin', decimals: 6 },
    USDT:  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', gecko: 'tether', decimals: 6 },
    WBTC:  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', gecko: 'wrapped-bitcoin', decimals: 8 },
    DAI:   { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', gecko: 'dai', decimals: 18 },
    SHIB:  { address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', gecko: 'shiba-inu', decimals: 18 },
    LINK:  { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', gecko: 'chainlink', decimals: 18 },
    UNI:   { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', gecko: 'uniswap', decimals: 18 },
    PEPE:  { address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', gecko: 'pepe', decimals: 18 },
    AAVE:  { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', gecko: 'aave', decimals: 18 },
    CRV:   { address: '0xD533a949740bb3306d119CC777fa900bA034cd52', gecko: 'curve-dao-token', decimals: 18 },
  },
  bsc: {
    USDC:  { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', gecko: 'usd-coin', decimals: 18 },
    USDT:  { address: '0x55d398326f99059fF775485246999027B3197955', gecko: 'tether', decimals: 18 },
    WBNB:  { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', gecko: 'wbnb', decimals: 18 },
    CAKE:  { address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', gecko: 'pancakeswap', decimals: 18 },
    XRP:   { address: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE', gecko: 'ripple', decimals: 18 },
    ADA:   { address: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47', gecko: 'cardano', decimals: 18 },
    DOGE:  { address: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', gecko: 'dogecoin', decimals: 8 },
    DOT:   { address: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402', gecko: 'polkadot', decimals: 18 },
    BUSD:  { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', gecko: 'binance-usd', decimals: 18 },
    SHIB:  { address: '0x2859e4544C4bB03966803b044A93563Bd2D0DD4D', gecko: 'shiba-inu', decimals: 18 },
  },
  polygon: {
    USDC:  { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', gecko: 'usd-coin', decimals: 6 },
    USDT:  { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', gecko: 'tether', decimals: 6 },
    WETH:  { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', gecko: 'ethereum', decimals: 18 },
    WBTC:  { address: '0x1bfd67037b42cf73acF2047067bd4F2C47D9BfD6', gecko: 'wrapped-bitcoin', decimals: 8 },
    DAI:   { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', gecko: 'dai', decimals: 18 },
    LINK:  { address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', gecko: 'chainlink', decimals: 18 },
    MATIC: { address: '0x0000000000000000000000000000000000001010', gecko: 'matic-network', decimals: 18 },
    QUICK: { address: '0xB5C064F955D8e7F38fE0460C556a72987494eE17', gecko: 'quickswap', decimals: 18 },
  },
  celo: {
    cUSD:  { address: '0x765DE816845861e75A25fCA122bb6898B8B1282a', gecko: 'celo-dollar', decimals: 18 },
    cEUR:  { address: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73', gecko: 'celo-euro', decimals: 18 },
    cREAL: { address: '0xe8537a3d056DA446677B9E9d6c5dBa0e63764Fd7', gecko: 'celo-real-creal', decimals: 18 },
    USDC:  { address: '0xcebA9300f2b948710d2653dD7B07f33A8B1510F9', gecko: 'usd-coin', decimals: 6 },
    USDT:  { address: '0x617f3112bf5397D0467D315cC709EF968D9ba546', gecko: 'tether', decimals: 6 },
    WETH:  { address: '0x2DEf4285787d58a2f811AF24755A8150622f4361', gecko: 'ethereum', decimals: 18 },
  },
  avax: {
    USDC:  { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', gecko: 'usd-coin', decimals: 6 },
    USDT:  { address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', gecko: 'tether', decimals: 6 },
    WAVAX: { address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', gecko: 'avalanche-2', decimals: 18 },
    DAI:   { address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', gecko: 'dai', decimals: 18 },
    JOE:   { address: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd', gecko: 'joe', decimals: 18 },
    LINK:  { address: '0x5947BB275c521040051D82396192181b413227A3', gecko: 'chainlink', decimals: 18 },
  },
  arbitrum: {
    USDC:  { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', gecko: 'usd-coin', decimals: 6 },
    USDT:  { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', gecko: 'tether', decimals: 6 },
    DAI:   { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', gecko: 'dai', decimals: 18 },
    ARB:   { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', gecko: 'arbitrum', decimals: 18 },
    LINK:  { address: '0xf97f4df75117a78c1A5a0DBb814Ab92458339FBb', gecko: 'chainlink', decimals: 18 },
    UNI:   { address: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', gecko: 'uniswap', decimals: 18 },
  },
  optimism: {
    USDC:  { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', gecko: 'usd-coin', decimals: 6 },
    USDT:  { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', gecko: 'tether', decimals: 6 },
    DAI:   { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', gecko: 'dai', decimals: 18 },
    OP:    { address: '0x4200000000000000000000000000000000000042', gecko: 'optimism', decimals: 18 },
    SNX:   { address: '0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4', gecko: 'synthetix-network-token', decimals: 18 },
  },
  base: {
    USDC:  { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', gecko: 'usd-coin', decimals: 6 },
    DAI:   { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', gecko: 'dai', decimals: 18 },
    WETH:  { address: '0x4200000000000000000000000000000000000006', gecko: 'ethereum', decimals: 18 },
    AERO:  { address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', gecko: 'aerodrome-finance', decimals: 18 },
    BRETT: { address: '0x532f27101965dd16442E59d40670FaF5eBB142E4', gecko: 'brett-2', decimals: 18 },
  },
  fantom: {
    USDC:  { address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', gecko: 'usd-coin', decimals: 6 },
    USDT:  { address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A', gecko: 'tether', decimals: 6 },
    WFTM:  { address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', gecko: 'fantom', decimals: 18 },
    DAI:   { address: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', gecko: 'dai', decimals: 18 },
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function rpcCall(rpcUrl, method, params) {
  const payload = {
    jsonrpc: '2.0',
    method,
    params,
    id: Date.now(),
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(`RPC: ${data.error.message}`);
    return data.result;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

function hexToDecimalStr(hex) {
  // hex like "0x1234abc" → decimal string
  if (!hex || hex === '0x') return '0';
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (cleanHex.length === 0) return '0';
  // Use BigInt
  return BigInt('0x' + cleanHex).toString();
}

function hexToBigInt(hex) {
  if (!hex || hex === '0x') return 0n;
  const cleanHex = hex.startsWith('0x') ? hex : '0x' + hex;
  return BigInt(cleanHex);
}

function formatTimeAgo(timestampMs) {
  const diff = Date.now() - timestampMs;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds} detik lalu`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  return `${months} bulan lalu`;
}

function formatNumber(num) {
  if (num === 0) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  // Use en-US locale only for formatting (not undefined/system locale)
  // Apply maximum 6 decimals without trailing zeros
  const s = num.toFixed(6).replace(/\.?0+$/, '');
  if (num >= 1 && num < 1000) return s;
  return s;
}

function truncateAddress(addr) {
  if (addr.length <= 14) return addr;
  return addr.slice(0, 8) + '...' + addr.slice(-6);
}

function validateEVMAddress(addr) {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

function validateSolAddress(addr) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

function validateAptAddress(addr) {
  // Aptos: 0x + 64 hex, or just 0x + hex (variable length)
  return /^0x[0-9a-fA-F]{1,64}$/.test(addr);
}

// ─── Chain detection ────────────────────────────────────────────────────

function detectChain(address, hint) {
  // If user specified a chain, resolve it
  if (hint) {
    const key = CHAIN_ALIASES[hint.toLowerCase().trim()];
    if (key && CHAINS[key]) return { ...CHAINS[key], key };
  }

  // Auto-detect by address format
  if (address.startsWith('0x')) {
    const len = address.length;
    const hexLen = address.length - 2; // without '0x'

    // 42 chars (0x + 40 hex) = standard EVM address
    if (len === 42 && validateEVMAddress(address)) {
      return { ...CHAINS.eth, key: 'eth' };
    }

    // 66 chars (0x + 64 hex) = full Aptos address (32 bytes)
    if (len === 66 && validateAptAddress(address)) {
      return { ...CHAINS.apt, key: 'apt' };
    }

    // Other lengths: check Aptos (only if reasonably long, min 16 hex chars = 8 bytes)
    // to avoid matching garbage like 0xdeadbeef
    if (hexLen >= 16 && validateAptAddress(address)) {
      return { ...CHAINS.apt, key: 'apt' };
    }

    // Fallback to Ethereum (shouldn't reach here for valid 42-char EVM addresses)
    if (validateEVMAddress(address)) {
      return { ...CHAINS.eth, key: 'eth' };
    }
  }

  // Base58 = Solana
  if (validateSolAddress(address)) {
    return { ...CHAINS.sol, key: 'sol' };
  }

  return null;
}

// ─── Balance checks ─────────────────────────────────────────────────────

async function getEvmBalance(chain, address) {
  const hexBalance = await rpcCall(chain.rpc, 'eth_getBalance', [address, 'latest']);
  const balanceWei = hexToBigInt(hexBalance);
  const decimals = chain.decimals || 18n;
  // Convert to decimal number (lossy for huge numbers, fine for most wallets)
  const divisor = 10n ** decimals;
  const integerPart = balanceWei / divisor;
  const remainder = balanceWei % divisor;
  const fractionalStr = remainder.toString().padStart(Number(decimals), '0').slice(0, 6);
  const fullStr = integerPart.toString() + '.' + fractionalStr;
  return {
    raw: balanceWei,
    value: parseFloat(fullStr),
    formatted: fullStr,
  };
}

async function getSolBalance(chain, address) {
  const result = await rpcCall(chain.rpc, 'getBalance', [address]);
  // Solana RPC returns { context: { slot }, value: <lamports> }
  const lamports = BigInt(result.value);
  const sol = Number(lamports) / 1e9;
  return {
    raw: lamports,
    value: sol,
    formatted: sol.toFixed(6),
  };
}

async function getAptBalance(chain, address) {
  const res = await fetch(`${chain.rpc}/accounts/${address}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Aptos API: HTTP ${res.status}`);
  const data = await res.json();
  // Get APT balance from coin resource
  const coinRes = await fetch(
    `${chain.rpc}/accounts/${address}/resource/0x1::coin::CoinStore%3C0x1::aptos_coin::AptosCoin%3E`,
    { signal: AbortSignal.timeout(10000) }
  );
  let aptBalance = 0n;
  if (coinRes.ok) {
    const coinData = await coinRes.json();
    if (coinData?.data?.coin?.value) {
      aptBalance = BigInt(coinData.data.coin.value);
    }
  }
  const divisor = 10n ** (chain.decimals || 8n);
  const integerPart = aptBalance / divisor;
  const remainder = aptBalance % divisor;
  const fractionalStr = remainder.toString().padStart(8, '0').slice(0, 4);
  const fullStr = integerPart.toString() + '.' + fractionalStr;
  return {
    raw: aptBalance,
    value: parseFloat(fullStr),
    formatted: fullStr,
    sequence: data.sequence_number || '0',
  };
}

async function getBalance(chain, address) {
  if (chain.key === 'sol') return getSolBalance(chain, address);
  if (chain.key === 'apt') return getAptBalance(chain, address);
  return getEvmBalance(chain, address);
}

// ─── Transaction count ──────────────────────────────────────────────────

async function getTxCount(chain, address) {
  if (chain.key === 'sol') {
    try {
      const sigs = await rpcCall(chain.rpc, 'getSignaturesForAddress', [address, { limit: 1 }]);
      if (Array.isArray(sigs) && sigs.length > 0 && sigs[0].blockTime) {
        return { count: null, lastTxTimestamp: sigs[0].blockTime * 1000 };
      }
    } catch { /* ignore */ }
    return { count: null, lastTxTimestamp: null };
  }
  if (chain.key === 'apt') {
    const res = await fetch(`${chain.rpc}/accounts/${address}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { count: null, lastTxTimestamp: null };
    const data = await res.json();
    return { count: parseInt(data.sequence_number), lastTxTimestamp: null };
  }
  // EVM
  try {
    const hexCount = await rpcCall(chain.rpc, 'eth_getTransactionCount', [address, 'latest']);
    const count = parseInt(hexCount, 16);
    return { count, lastTxTimestamp: null };
  } catch {
    return { count: null, lastTxTimestamp: null };
  }
}

// ─── Last transaction timestamp (via scan API) ─────────────────────────

const SCAN_API_V2 = 'https://api.etherscan.io/v2/api';

function getScanApiKey() {
  return process.env.SCAN_API_KEY || process.env.ETHERSCAN_API_KEY || '';
}

async function scanApiCall(params, apiKey) {
  const query = new URLSearchParams({ ...params, apikey: apiKey || '' });
  try {
    const res = await fetch(`${SCAN_API_V2}?${query}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getLastTxTimestamp(chain, address) {
  if (!chain.chainId) return null;

  const apiKey = getScanApiKey();
  if (!apiKey) return null;

  // Try normal tx list via Etherscan V2 unified API
  let data = await scanApiCall({
    chainid: chain.chainId,
    module: 'account', action: 'txlist',
    address, sort: 'desc', offset: '1',
  }, apiKey);

  if (data?.status === '1' && data.result?.length > 0) {
    return parseInt(data.result[0].timeStamp) * 1000;
  }

  // Try token tx list (ERC20 transfers)
  data = await scanApiCall({
    chainid: chain.chainId,
    module: 'account', action: 'tokentx',
    address, sort: 'desc', offset: '1',
  }, apiKey);

  if (data?.status === '1' && data.result?.length > 0) {
    return parseInt(data.result[0].timeStamp) * 1000;
  }

  return null;
}

// ─── Token holdings ─────────────────────────────────────────────────────

// ERC20 balanceOf ABI: 0x70a08231 + address padded to 32 bytes
function erc20BalanceOfData(address) {
  // ABI encode: function selector (0x70a08231) + 32-byte address (left-padded to 64 hex chars)
  const clean = address.toLowerCase().replace('0x', '');
  return '0x70a08231' + clean.padStart(64, '0');
}

async function getEvmTokenBalances(chain, address) {
  const tokens = COMMON_TOKENS[chain.key];
  if (!tokens) return [];

  // Parallel eth_call with concurrency limit of 4 to avoid RPC rate limits
  const entries = Object.entries(tokens);
  const nonZeroBalances = [];
  const BATCH_SIZE = 4;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async ([symbol, token]) => {
      try {
        const data = erc20BalanceOfData(address);
        const result = await rpcCall(chain.rpc, 'eth_call', [
          { to: token.address, data },
          'latest',
        ]);
        const balance = hexToBigInt(result);
        if (balance > 0n) {
          return { symbol, token, balance };
        }
      } catch { /* skip */ }
      return null;
    });

    const batchResults = await Promise.all(promises);
    for (const r of batchResults) {
      if (r) nonZeroBalances.push(r);
    }
  }

  if (nonZeroBalances.length === 0) return [];

  // Batch get prices from CoinGecko (single API call instead of N calls)
  const geckoIds = [...new Set(nonZeroBalances.map(b => b.token.gecko))];
  let priceMap = {};
  try {
    const priceData = await coinData.fetchPrice(geckoIds, 'usd');
    priceMap = priceData;
  } catch { /* prices unavailable */ }

  // Build results with correct decimals
  const results = nonZeroBalances.map(({ symbol, token, balance }) => {
    const dec = BigInt(token.decimals || 18);
    const divisor = 10n ** dec;
    const humanBalance = Number(balance) / Number(divisor);

    let usdValue = null;
    if (priceMap[token.gecko]?.usd) {
      usdValue = humanBalance * priceMap[token.gecko].usd;
    }

    return { symbol, balance: humanBalance, usdValue };
  });

  // Sort by USD value descending
  results.sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0));
  return results.slice(0, 10);
}

// ─── Wallet health check ────────────────────────────────────────────────

function assessWallet(balance, txCount, tokens) {
  const traits = [];
  if (txCount === 0 || txCount === null) traits.push('🆕 Baru');
  else if (txCount < 10) traits.push('🐣 Baru aktif');
  else if (txCount < 100) traits.push('📗 Aktif');
  else if (txCount < 1000) traits.push('📘 Sangat aktif');
  else traits.push('📈 Power user');

  if (balance.value === 0) traits.push('💀 Kosong');
  else if (balance.value < 0.01) traits.push('💤 Minim');
  else if (balance.value < 1) traits.push('⚡ Cukup');
  else if (balance.value < 10) traits.push('💰 Kaya');
  else if (balance.value < 100) traits.push('🤑 Sultan');
  else if (balance.value < 1000) traits.push('👑 Whale');
  else traits.push('🐋🐋🐋 Super Whale');

  // Check if holds tokens
  if (tokens.length > 0) {
    const memecoins = tokens.filter(t =>
      ['SHIB', 'PEPE', 'BONK', 'WIF', 'FLOKI', 'BRETT', 'DOGE'].includes(t.symbol)
    );
    if (memecoins.length > 0) traits.push('🎭 Hold meme coin');
    traits.push(`💎 ${tokens.length} token`);
  }

  return traits;
}

// ─── Main check function ────────────────────────────────────────────────

async function checkWallet(address, hintChain = null) {
  // Detect chain
  const chain = detectChain(address, hintChain);
  if (!chain) {
    return {
      ok: false,
      error: 'Alamat tidak dikenal. Format tidak valid untuk chain mana pun.',
    };
  }

  // Validate address format for detected chain
  if (chain.key === 'sol' && !validateSolAddress(address)) {
    return { ok: false, error: 'Alamat Solana tidak valid (base58, 32-44 karakter).' };
  }
  if (chain.key === 'apt' && !validateAptAddress(address)) {
    return { ok: false, error: 'Alamat Aptos tidak valid.' };
  }
  if (!['sol', 'apt'].includes(chain.key) && !validateEVMAddress(address)) {
    return { ok: false, error: 'Alamat EVM tidak valid (0x + 40 karakter hex).' };
  }

  // Fetch data in parallel
  const [balance, txInfo] = await Promise.all([
    getBalance(chain, address),
    getTxCount(chain, address),
  ]);

      // Get USD price + scan + tokens in parallel
  const [usdResult, lastTxTimestamp, tokens] = await Promise.all([
    (async () => {
      try {
        const priceData = await coinData.fetchPrice([chain.coingeckoId], 'usd');
        if (priceData[chain.coingeckoId]?.usd) {
          return { usdPrice: priceData[chain.coingeckoId].usd, usdValue: balance.value * priceData[chain.coingeckoId].usd };
        }
      } catch {}
      return { usdPrice: null, usdValue: null };
    })(),
    getLastTxTimestamp(chain, address),
    (async () => {
      if (['sol', 'apt'].includes(chain.key)) return [];
      try {
        return await getEvmTokenBalances(chain, address);
      } catch { return []; }
    })(),
  ]);

  const { usdPrice, usdValue } = usdResult;

  // Merge lastTxTimestamp: prefer scan API, fallback to txInfo
  const mergedLastTx = lastTxTimestamp || txInfo.lastTxTimestamp || null;

  // Assess wallet
  const traits = assessWallet(balance, txInfo.count || 0, tokens);

  return {
    ok: true,
    chain,
    address,
    balance,
    txCount: txInfo.count,
    lastTxTimestamp: mergedLastTx,
    usdPrice,
    usdValue,
    tokens,
    traits,
    explorerUrl: chain.explorer.replace('{addr}', address),
  };
}

// ─── Exports ────────────────────────────────────────────────────────────

module.exports = {
  CHAINS,
  CHAIN_ALIASES,
  COMMON_TOKENS,
  detectChain,
  getBalance,
  getTxCount,
  getLastTxTimestamp,
  getEvmTokenBalances,
  checkWallet,
  formatTimeAgo,
  truncateAddress,
  formatNumber,
};
