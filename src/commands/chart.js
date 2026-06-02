const { EmbedBuilder } = require('discord.js');
const coinData = require('../utils/coinData');

const QUICKCHART = 'https://quickchart.io/chart';
const CG_API = 'https://api.coingecko.com/api/v3';

const PERIODS = {
  '1d':  { days: 1,  label: '24 Jam',  interval: null },
  '7d':  { days: 7,  label: '7 Hari',  interval: null },
  '14d': { days: 14, label: '14 Hari', interval: null },
  '30d': { days: 30, label: '30 Hari', interval: null },
  '90d': { days: 90, label: '90 Hari', interval: null },
  '1y':  { days: 365, label: '1 Tahun', interval: null },
};

const PERIOD_ALIASES = {};
for (const [k, v] of Object.entries(PERIODS)) {
  PERIOD_ALIASES[k] = k;
  PERIOD_ALIASES[k.replace('d', '')] = k;
  PERIOD_ALIASES[k.replace('d', ' hari')] = k;
  PERIOD_ALIASES[k.replace('d', 'h')] = k;
}

// ─── Fetch price history ────────────────────────────────────────────────

async function getPriceHistory(coinId, days) {
  const url = `${CG_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    if (res.status === 429) throw new Error('CoinGecko rate limit. Coba lagi nanti.');
    if (res.status === 404) throw new Error('Data chart tidak tersedia untuk coin ini.');
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Build & fetch QuickChart image ─────────────────────────────────────

function roundPrice(v) {
  if (v >= 1) return Number(v.toFixed(2));
  if (v >= 0.001) return Number(v.toFixed(4));
  return Number(v.toFixed(8));
}

function fmtPrice(v) {
  if (v >= 1) return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 0.001) return '$' + v.toFixed(4);
  return '$' + v.toFixed(8);
}

async function fetchChartImage(prices, colorUp, colorDown, period) {
  const firstPrice = prices[0][1];
  const lastPrice = prices[prices.length - 1][1];
  const isUp = lastPrice >= firstPrice;
  const color = isUp ? colorUp : colorDown;
  const bgColor = isUp ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)';

  // Sample to max ~80 points
  let sampled = prices;
  if (prices.length > 90) {
    const step = Math.ceil(prices.length / 80);
    sampled = prices.filter((_, i) => i % step === 0 || i === prices.length - 1);
  }

  // Labels for X-axis (timestamps)
  const labels = sampled.map(p => {
    const d = new Date(p[0]);
    if (period.days <= 1) return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
    if (period.days <= 7) return d.toLocaleDateString('en', { weekday: 'short', hour: 'numeric' });
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  });

  // Round values to reduce chart URL size
  const values = sampled.map(p => roundPrice(p[1]));

  const chartConfig = {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: color,
        backgroundColor: bgColor,
        fill: true,
        pointRadius: 0,
        pointHitRadius: 10,
        borderWidth: 2.5,
        tension: 0.1,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { color: '#9CA3AF', maxTicksLimit: 12, font: { size: 10 } },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.06)', drawBorder: false },
          ticks: { color: '#9CA3AF', font: { size: 10 }, maxTicksLimit: 8 },
        },
      },
      layout: { padding: { top: 10, bottom: 5, left: 5, right: 10 } },
    },
    backgroundColor: '#1a1a2e',
  };

  const qs = new URLSearchParams({
    c: JSON.stringify(chartConfig),
    width: '600',
    height: '350',
    format: 'png',
    backgroundColor: '#1a1a2e',
    devicePixelRatio: '2',
  });

  const url = `${QUICKCHART}?${qs}`;

  // Fetch the image and return as buffer
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error('Chart API: HTTP ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

// ─── Command ────────────────────────────────────────────────────────────

module.exports = {
  name: 'chart',
  description: 'Tampilkan chart harga crypto. Contoh: !chart btc, !chart eth 7d, !chart sol 30d',
  async execute(message, args) {
    if (!args.length) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#F1C40F')
          .setTitle('📈 Cara Pakai !chart')
          .setDescription(
            'Tampilkan grafik harga crypto.\n\n'
            + '**Format:** `!chart <coin> [periode]`\n\n'
            + '**Contoh:**\n'
            + '`!chart btc` — chart BTC 7 hari\n'
            + '`!chart eth 1d` — chart ETH 24 jam\n'
            + '`!chart sol 30d` — chart SOL 30 hari\n'
            + '`!chart pepe 90d` — chart PEPE 90 hari\n\n'
            + '**Periode:** `1d`, `7d` (default), `14d`, `30d`, `90d`, `1y`'
          )
          .setTimestamp()],
      });
    }

    await coinData.ensureCoinList();

    const coinQuery = args[0].toLowerCase();
    const periodArg = args[1]?.toLowerCase();
    const period = PERIOD_ALIASES[periodArg] ? PERIODS[PERIOD_ALIASES[periodArg]] : PERIODS['7d'];

    // Search for coin
    const coins = coinData.searchCoin(coinQuery);
    if (coins.length === 0) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('❌ Coin Tidak Ditemukan')
          .setDescription(`Coin \`${coinQuery}\` gak ditemukan. Cek ejaan atau coba nama lain.`)],
      });
    }
    const coin = coins[0];

    const msg = await message.reply({ content: `📈 **Mengambil chart ${coin.name}...**`, fetchReply: true });

    try {
      const data = await getPriceHistory(coin.id, period.days);
      if (!data.prices || data.prices.length < 2) {
        throw new Error('Data harga tidak cukup untuk chart.');
      }

      const prices = data.prices;
      const firstPrice = prices[0][1];
      const lastPrice = prices[prices.length - 1][1];
      const change = ((lastPrice - firstPrice) / firstPrice) * 100;
      const high = Math.max(...prices.map(p => p[1]));
      const low = Math.min(...prices.map(p => p[1]));
      const isUp = change >= 0;

      const chartBuffer = await fetchChartImage(prices, '#10B981', '#EF4444', period);
      const color = isUp ? 0x10B981 : 0xEF4444;

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`📈 ${coin.name} (${coin.symbol.toUpperCase()})`)
        .setDescription(`${period.label} • ${fmtPrice(lastPrice)}`)
        .setImage('attachment://chart.png')
        .addFields(
          {
            name: isUp ? '📈 Change' : '📉 Change',
            value: `${isUp ? '+' : ''}${change.toFixed(2)}%`,
            inline: true,
          },
          {
            name: '📊 High',
            value: fmtPrice(high),
            inline: true,
          },
          {
            name: '📊 Low',
            value: fmtPrice(low),
            inline: true,
          },
          {
            name: '🕐 Range',
            value: period.label,
            inline: true,
          },
          {
            name: '💰 Harga Awal',
            value: fmtPrice(firstPrice),
            inline: true,
          },
          {
            name: '💰 Harga Akhir',
            value: fmtPrice(lastPrice),
            inline: true,
          }
        )
        .setFooter({ text: `Data: CoinGecko • Chart: QuickChart` })
        .setTimestamp();

      await msg.edit({ content: '', embeds: [embed], files: [{ attachment: chartBuffer, name: 'chart.png' }] });
    } catch (err) {
      console.error('❌ Error !chart:', err.message);
      await msg.edit({
        content: '',
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('❌ Gagal Ambil Chart')
          .setDescription(`Error: \`${err.message}\`\nCoba coin lain atau periode berbeda.`)],
      }).catch(() => {});
    }
  },
};
