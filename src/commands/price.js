const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const coinData = require('../utils/coinData');

// ─── Rich check ────────────────────────────────────────────
function getRichLabel(totalIdr) {
  const base = 'AYAH KANDUNG! BOS! MY BINI! 🗿';
  if (totalIdr >= 10_000_000_000) return '🤑 RAJA BERKAH! ' + base;
  if (totalIdr >= 1_000_000_000) return '👑 ' + base;
  if (totalIdr >= 100_000_000) return '💰 ' + base;
  if (totalIdr >= 50_000_000) return '💎 ' + base;
  if (totalIdr >= 1_000_000) return base;
  return null;
}

module.exports = {
  name: 'price',
  description: 'Cek harga crypto. Contoh: !price btc, !price 1 wld to idr, !price eth 10',
  async execute(message, args) {
    if (!args.length) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#F1C40F')
          .setTitle('📊 Cara Pakai !price')
          .setDescription('Gunakan: `!price <coin> [jumlah] [matauang]` atau `!price <jumlah> <coin> [to] <matauang>`\n'
            + 'Contoh:\n'
            + '`!price btc` — 1 BTC dalam USD\n'
            + '`!price eth 5` — 5 ETH dalam USD\n'
            + '`!price sol idr` — 1 SOL dalam IDR\n'
            + '`!price btc 10 idr` — 10 BTC dalam Rupiah\n'
            + '`!price 1 wld to idr` — 1 WLD ke IDR\n'
            + '`!price 5 btc to usd` — 5 BTC ke USD')
          .setTimestamp()]
      });
    }

    await coinData.ensureCoinList();

    // ─── Universal arg parser ──────────────────────────────────

    // Helper: is a string a pure number (not "1inch" etc)?
    function isPureNum(s) {
      const clean = s.replace(/,/g, '');
      const n = parseFloat(clean);
      return !isNaN(n) && isFinite(n) && String(n) === clean;
    }

    // Step 1 — strip noise tokens
    const noise = new Set(['to', 'ke', 'dalam', '=']);
    const clean = args.filter(a => !noise.has(a.toLowerCase()));

    // Step 2 — extract currency (must be a fiat code)
    let qty = 1;
    let currency = 'usd';
    let currencyIdx = -1;

    for (let i = 0; i < clean.length; i++) {
      if (coinData.isFiatCurrency(clean[i])) {
        currency = clean[i].toLowerCase();
        currencyIdx = i;
        break;
      }
    }
    if (currencyIdx >= 0) clean.splice(currencyIdx, 1);

    // Step 3 — extract quantity (any pure number)
    let qtyIdx = -1;
    for (let i = 0; i < clean.length; i++) {
      if (isPureNum(clean[i])) {
        const n = parseFloat(clean[i].replace(/,/g, ''));
        if (n > 0 && n < 1e12) {
          qty = n;
          qtyIdx = i;
          break;
        }
      }
    }
    if (qtyIdx >= 0) clean.splice(qtyIdx, 1);

    // Step 4 — everything left is the coin name
    const query = clean.join(' ').toLowerCase().trim();
    if (!query) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#F1C40F')
          .setTitle('❌ Nama Coin Tidak Ditemukan')
          .setDescription('Kasih nama coin yang valid. Contoh: `!price btc`')
          .setTimestamp()]
      });
    }

    const results = coinData.searchCoin(query);

    if (results.length === 0) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('❌ Coin Tidak Ditemukan')
          .setDescription(`Coin "${query}" gak ketemu di database CoinGecko.`)
          .setTimestamp()]
      });
    }

    if (results.length > 1) {
      const list = results.slice(0, 5).map((c, i) =>
        `**${i + 1}.** \`${c.symbol.toUpperCase()}\` — ${c.name}`
      ).join('\n');
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#F1C40F')
          .setTitle('🔍 Banyak Hasil')
          .setDescription(`Query "${query}" nemu beberapa coin. Coba lebih spesifik:\n\n${list}`)
          .setTimestamp()]
      });
    }

    const coin = results[0];

    try {
      const priceData = await coinData.fetchPrice([coin.id], currency);

      if (!priceData[coin.id]) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('❌ Data Harga Tidak Tersedia')
            .setDescription(`Coin **${coin.name}** (${coin.symbol.toUpperCase()}) gak punya data harga.`)
            .setTimestamp()]
        });
      }

      const data = priceData[coin.id];
      const priceCurr = data[currency] || 0;
      const priceUsd = data.usd || 0;
      const change = data.usd_24h_change;
      const volume = data.usd_24h_vol;
      const mcap = data.usd_market_cap;

      // Market detail buat rank + high/low + chart
      let marketDetail = null;
      try {
        marketDetail = await coinData.fetchCoinMarketData(coin.id);
      } catch { /* skip */ }

      const high24 = marketDetail?.market_data?.high_24h?.usd;
      const low24 = marketDetail?.market_data?.low_24h?.usd;
      const rank = marketDetail?.market_cap_rank;
      const totalSupply = marketDetail?.market_data?.total_supply;
      const circSupply = marketDetail?.market_data?.circulating_supply;
      const ath = marketDetail?.market_data?.ath?.usd;
      const athDate = marketDetail?.market_data?.ath_date?.usd;
      const sparkline = marketDetail?.market_data?.sparkline_7d?.price;

      const changeColor = change != null ? (change >= 0 ? '#2ECC71' : '#E74C3C') : '#3498DB';
      const symbol = coin.symbol.toUpperCase();

      const embed = new EmbedBuilder()
        .setColor(changeColor)
        .setAuthor({ name: `${coin.name} (${symbol})` })
        .setURL(`https://www.coingecko.com/en/coins/${coin.id}`);

      // Kalau qty > 1, title = total, ada sub price per coin
      if (qty !== 1) {
        embed.setTitle(`${coinData.formatQuantityTotal(priceCurr, qty, currency)}`);
        embed.addFields(
          { name: '💰 Total', value: coinData.formatQuantityTotal(priceCurr, qty, currency), inline: true },
          { name: '📦 Jumlah', value: `${qty} ${symbol}`, inline: true },
          { name: '💵 Harga Per', value: coinData.formatPrice(priceCurr, currency), inline: true },
        );
        if (currency !== 'usd' && priceUsd) {
          embed.addFields({ name: '💵 Setara USD', value: coinData.formatQuantityTotal(priceUsd, qty, 'usd'), inline: false });
        }
      } else {
        embed.setTitle(coinData.formatPrice(priceCurr, currency));
        if (currency !== 'usd' && priceUsd) {
          embed.addFields({ name: '💵 Harga USD', value: coinData.formatPrice(priceUsd, 'usd'), inline: true });
        }
      }

      embed.addFields(
        { name: '📊 24h Change', value: coinData.formatChange(change), inline: true },
        { name: '💧 Volume 24h', value: volume ? `$${(volume / 1e6).toFixed(2)}M` : 'N/A', inline: true },
        { name: '📦 Market Cap', value: mcap ? `$${(mcap / 1e9).toFixed(2)}B` : 'N/A', inline: true },
      );

      if (high24 || low24) {
        embed.addFields(
          { name: '📈 High 24h', value: coinData.formatPrice(high24), inline: true },
          { name: '📉 Low 24h', value: coinData.formatPrice(low24), inline: true },
          { name: '🏆 Rank', value: rank ? `#${rank}` : 'N/A', inline: true },
        );
      }

      if (ath) {
        const athTs = athDate ? Math.floor(new Date(athDate).getTime() / 1000) : null;
        embed.addFields({
          name: '🥇 All-Time High',
          value: `${coinData.formatPrice(ath)}${athTs ? ` (<t:${athTs}:D>)` : ''}`,
          inline: false,
        });
      }

      if (circSupply) {
        embed.addFields(
          { name: '🔄 Circulating', value: `${(circSupply / 1e6).toFixed(2)}M ${symbol}`, inline: true },
          { name: '📊 Total Supply', value: totalSupply ? `${(totalSupply / 1e6).toFixed(2)}M ${symbol}` : 'N/A', inline: true },
        );
      }

      if (sparkline && sparkline.length > 20) {
        const sampled = sparkline.filter((_, i) => i % Math.ceil(sparkline.length / 60) === 0);
        const chartUrl = `https://quickchart.io/chart?c={type:'line',data:{labels:[${sampled.map((_, i) => i)}],datasets:[{data:[${sampled.join(',')}],borderColor:'${changeColor}',borderWidth:2,fill:false,pointRadius:0}]},options:{scales:{x:{display:false},y:{display:false}},plugins:{legend:{display:false}},layout:{padding:0}}}`;
        embed.setImage(chartUrl);
      }

      embed.setFooter({ text: `Data dari CoinGecko · Mata uang: ${currency.toUpperCase()}`, iconURL: 'https://www.coingecko.com/favicon.ico' });
      embed.setTimestamp();

      const delBtn = new ButtonBuilder()
        .setCustomId('del_price_' + message.author.id)
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(delBtn);
      const sent = await message.channel.send({ embeds: [embed], components: [row] });

      // Collector — only command author can delete
      const filter = (i) => i.customId === 'del_price_' + message.author.id && i.user.id === message.author.id;
      const collector = sent.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 120_000, max: 1 });

      collector.on('collect', async (i) => {
        await i.update({ components: [] }); // disable button
        await sent.delete();
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          // Timeout — remove the button
          try { await sent.edit({ components: [] }); } catch {}
        }
      });

      // ─── Rich check: total value > 1jt IDR? ────────────
      try {
        const totalCurr = priceCurr * qty;
        let totalIdr = 0;
        if (currency === 'idr') {
          totalIdr = totalCurr;
        } else if (priceUsd) {
          const totalUsd = priceUsd * qty;
          const rates = coinData.getFiatRatesCache();
          const idrRate = rates?.idr || 16000;
          totalIdr = totalUsd * idrRate;
        }
        const richLabel = getRichLabel(totalIdr);
        if (richLabel) {
          await message.channel.send(`**${richLabel}** ${message.author}`);
        }
      } catch (_) { /* rich check gagal? skip aja */ }

    } catch (err) {
      console.error('Price command error:', err);
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('⏳ Gagal Ambil Data')
          .setDescription('CoinGecko lagi bermasalah atau kena rate limit. Coba lagi nanti.')
          .setTimestamp()]
      });
    }
  }
};
