const { EmbedBuilder } = require('discord.js');
const coinData = require('../utils/coinData');

// ─── EVM chain RPCs for gas estimation ──────────────────────────────────

const GAS_CHAINS = {
  eth: {
    name: 'Ethereum',
    rpc: 'https://ethereum-rpc.publicnode.com',
    symbol: 'ETH',
    coingeckoId: 'ethereum',
    explorer: 'https://etherscan.io/gastracker',
    color: '#627EEA',
    emoji: '⬡',
  },
  bsc: {
    name: 'BNB Smart Chain',
    rpc: 'https://bsc-rpc.publicnode.com',
    symbol: 'BNB',
    coingeckoId: 'binancecoin',
    explorer: 'https://bscscan.com/gastracker',
    color: '#F0B90B',
    emoji: '◆',
  },
  polygon: {
    name: 'Polygon',
    rpc: 'https://polygon-bor-rpc.publicnode.com',
    symbol: 'MATIC',
    coingeckoId: 'matic-network',
    explorer: 'https://polygonscan.com/gastracker',
    color: '#8247E5',
    emoji: '⬡',
  },
  arbitrum: {
    name: 'Arbitrum',
    rpc: 'https://arbitrum-rpc.publicnode.com',
    symbol: 'ETH',
    coingeckoId: 'ethereum',
    explorer: 'https://arbiscan.io/gastracker',
    color: '#2D374B',
    emoji: '○',
  },
  optimism: {
    name: 'Optimism',
    rpc: 'https://optimism-rpc.publicnode.com',
    symbol: 'ETH',
    coingeckoId: 'ethereum',
    explorer: 'https://optimistic.etherscan.io/gastracker',
    color: '#FF0420',
    emoji: '○',
  },
  base: {
    name: 'Base',
    rpc: 'https://base-rpc.publicnode.com',
    symbol: 'ETH',
    coingeckoId: 'ethereum',
    explorer: 'https://basescan.org/gastracker',
    color: '#0052FF',
    emoji: '○',
  },
  celo: {
    name: 'Celo',
    rpc: 'https://forno.celo.org',
    symbol: 'CELO',
    coingeckoId: 'celo',
    explorer: 'https://celoscan.io/gastracker',
    color: '#35D07F',
    emoji: '●',
  },
  fantom: {
    name: 'Fantom',
    rpc: 'https://rpc.fantom.network',
    symbol: 'FTM',
    coingeckoId: 'fantom',
    explorer: 'https://ftmscan.com/gastracker',
    color: '#1969FF',
    emoji: '◈',
  },
  avalanche: {
    name: 'Avalanche C-Chain',
    rpc: 'https://avalanche-c-chain-rpc.publicnode.com',
    symbol: 'AVAX',
    coingeckoId: 'avalanche-2',
    explorer: 'https://snowtrace.io/gastracker',
    color: '#E84142',
    emoji: '▲',
  },
};

const CHAIN_ALIASES = {};
for (const [k, v] of Object.entries(GAS_CHAINS)) {
  CHAIN_ALIASES[k] = k;
  CHAIN_ALIASES[v.name.toLowerCase()] = k;
  // Only register symbol if not already taken (multiple chains share 'ETH')
  if (!CHAIN_ALIASES[v.symbol.toLowerCase()]) {
    CHAIN_ALIASES[v.symbol.toLowerCase()] = k;
  }
}
CHAIN_ALIASES.ethereum = 'eth';
CHAIN_ALIASES.bnb = 'bsc';
CHAIN_ALIASES.matic = 'polygon';
CHAIN_ALIASES.arb = 'arbitrum';
CHAIN_ALIASES.op = 'optimism';
CHAIN_ALIASES.ftm = 'fantom';
CHAIN_ALIASES.avax = 'avalanche';
CHAIN_ALIASES.avalanche = 'avalanche';

// ─── RPC helper ─────────────────────────────────────────────────────────

async function rpcCall(rpcUrl, method, params) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: Date.now() }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

// ─── Gas estimation ─────────────────────────────────────────────────────

async function estimateGas(chainKey) {
  const chain = GAS_CHAINS[chainKey];
  if (!chain) throw new Error('Chain tidak dikenal');

  // Get native token price for USD estimation
  let nativePrice = null;
  try {
    await coinData.ensureCoinList();
    const priceData = await coinData.fetchPrice([chain.coingeckoId], 'usd');
    nativePrice = priceData[chain.coingeckoId]?.usd || null;
  } catch { /* ignore */ }

  // Get gas data from RPC
  const [gasPriceHex, feeHistoryData] = await Promise.all([
    rpcCall(chain.rpc, 'eth_gasPrice', []),
    rpcCall(chain.rpc, 'eth_feeHistory', ['0x5', 'latest', [10, 25, 50, 75, 90]]).catch(() => null),
  ]);

  const gasPriceGwei = parseInt(gasPriceHex, 16) / 1e9;

  let safeGwei, standardGwei, fastGwei, baseFeeGwei;

  if (feeHistoryData) {
    // EIP-1559 style estimation
    const baseFeeHex = feeHistoryData.baseFeePerGas[feeHistoryData.baseFeePerGas.length - 1];
    baseFeeGwei = parseInt(baseFeeHex, 16) / 1e9;

    const rewards = feeHistoryData.reward.map(r => parseInt(r[0], 16) / 1e9);
    // rewards correspond to [p10, p25, p50, p75, p90] priority fees
    safeGwei = Math.round((baseFeeGwei + (rewards[0] || 0)) * 100) / 100;
    standardGwei = Math.round((baseFeeGwei + (rewards[2] || 0)) * 100) / 100;
    fastGwei = Math.round((baseFeeGwei + (rewards[4] || 0)) * 100) / 100;
  } else {
    // Legacy estimation: just use gasPrice with multipliers
    baseFeeGwei = Math.round(gasPriceGwei * 100) / 100;
    safeGwei = Math.round(gasPriceGwei * 0.9 * 100) / 100;
    standardGwei = Math.round(gasPriceGwei * 100) / 100;
    fastGwei = Math.round(gasPriceGwei * 1.1 * 100) / 100;
  }

  // Calculate USD costs
  const calcCost = (gwei, gasUnits) => {
    if (!nativePrice) return null;
    const ethCost = (gwei * gasUnits) / 1e9;
    return ethCost * nativePrice;
  };

  const txCost = gwei => calcCost(gwei, 21000);    // Simple ETH transfer
  const swapCost = gwei => calcCost(gwei, 150000);  // Approx swap

  return {
    chain,
    nativePrice,
    gasPriceGwei: Math.round(gasPriceGwei * 100) / 100,
    baseFeeGwei,
    safeGwei,
    standardGwei,
    fastGwei,
    txCost,
    swapCost,
  };
}

// ─── Format helpers ─────────────────────────────────────────────────────

function formatCost(cost) {
  if (cost == null) return '*N/A*';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(2)}`;
  return `$${cost.toFixed(2)}`;
}

// ─── Command ────────────────────────────────────────────────────────────

module.exports = {
  name: 'gas',
  description: 'Cek gas fee ETH/BSC/Polygon/dll. Contoh: !gas, !gas bsc, !gas polygon',
  async execute(message, args) {
    const chainKey = args[0] ? (CHAIN_ALIASES[args[0].toLowerCase()] || 'eth') : 'eth';

    if (!GAS_CHAINS[chainKey]) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('❌ Chain Tidak Dikenal')
          .setDescription('Chain tersedia: `eth`, `bsc`, `polygon`, `arbitrum`, `optimism`, `base`, `celo`')],
      });
    }

    const msg = await message.reply({ content: '⛽ **Mengambil data gas...**', fetchReply: true });

    try {
      const data = await estimateGas(chainKey);

      const embed = new EmbedBuilder()
        .setColor(data.chain.color)
        .setTitle(`${data.chain.emoji} Gas Tracker — ${data.chain.name}`)
        .setURL(data.chain.explorer)
        .setDescription(`Gas fees real-time via RPC estimator\n━━━━━━━━━━━━━━━━━━━━`)

        .addFields(
          {
            name: '🟢 Safe (< 30 min)',
            value: `\`${data.safeGwei.toFixed(1)}\` Gwei`,
            inline: true,
          },
          {
            name: '🟡 Standard (< 5 min)',
            value: `\`${data.standardGwei.toFixed(1)}\` Gwei`,
            inline: true,
          },
          {
            name: '🔴 Fast (< 1 min)',
            value: `\`${data.fastGwei.toFixed(1)}\` Gwei`,
            inline: true,
          }
        );

      // Estimated cost breakdown
      let costText = '';
      if (data.nativePrice) {
        costText +=
          `**Transfer** (21k gas): ${formatCost(data.txCost(data.safeGwei))} — ${formatCost(data.txCost(data.standardGwei))} — ${formatCost(data.txCost(data.fastGwei))}\n` +
          `**Swap** (~150k gas): ${formatCost(data.swapCost(data.safeGwei))} — ${formatCost(data.swapCost(data.standardGwei))} — ${formatCost(data.swapCost(data.fastGwei))}`;
      } else {
        costText = '*Harga token tidak tersedia untuk estimasi USD*';
      }

      embed.addFields({
        name: `💵 Estimasi Biaya (Safe — Standard — Fast)`,
        value: costText,
      });

      // Additional info row
      let info = `⛽ Base Fee: \`${data.baseFeeGwei.toFixed(1)}\` Gwei`;
      info += `  •  💰 Harga ${data.chain.symbol}: ${data.nativePrice ? `$${data.nativePrice.toFixed(2)}` : '*N/A*'}`;
      info += `\n🔗 [${data.chain.name} Gas Tracker](${data.chain.explorer})`;

      embed.addFields({ name: '📊 Info Lain', value: info });

      embed
        .setFooter({ text: `Chain: ${data.chain.name} • Estimasi berdasarkan RPC` })
        .setTimestamp();

      const footerText = `💡 Coba: !gas bsc • !gas polygon • !gas arbitrum`;

      await msg.edit({
        content: footerText,
        embeds: [embed],
      });
    } catch (err) {
      console.error('❌ Error !gas:', err.message);
      await msg.edit({
        content: '',
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('❌ Gagal Ambil Data Gas')
          .setDescription(`Error: \`${err.message}\`\nCoba chain lain atau ulangi nanti.`)],
      }).catch(() => {});
    }
  },
};
