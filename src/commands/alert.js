const { EmbedBuilder } = require('discord.js');
const coinData = require('../utils/coinData');
const alertStore = require('../utils/alertStore');

module.exports = {
  name: 'alert',
  description: 'Set alert harga crypto. Contoh: !alert btc above 100000',
  async execute(message, args) {
    if (args.length < 3) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#F1C40F')
          .setTitle('🔔 Cara Pakai !alert')
          .setDescription('Gunakan: `!alert <coin> <above|below> <harga>`\nContoh: `!alert btc above 100000`\n`!alert eth below 2000`')
          .setTimestamp()]
      });
    }

    const coinQuery = args[0].toLowerCase().trim();
    const condition = args[1].toLowerCase();
    const priceStr = args[2].replace(/,/g, '');

    if (condition !== 'above' && condition !== 'below') {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('❌ Condition Salah')
          .setDescription('Pake `above` atau `below` aja.\nContoh: `!alert btc above 100000`')
          .setTimestamp()]
      });
    }

    const targetPrice = parseFloat(priceStr);
    if (isNaN(targetPrice) || targetPrice <= 0) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('❌ Harga Gak Valid')
          .setDescription('Masukin angka harga yang bener.')
          .setTimestamp()]
      });
    }

    await coinData.ensureCoinList();
    const results = coinData.searchCoin(coinQuery);

    if (results.length === 0) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('❌ Coin Tidak Ditemukan')
          .setDescription(`Coin "${coinQuery}" gak ketemu.`)
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
          .setDescription(`Query "${coinQuery}" nemu beberapa coin. Coba lebih spesifik:\n\n${list}`)
          .setTimestamp()]
      });
    }

    const coin = results[0];
    const label = condition === 'above' ? 'naik di atas' : 'turun di bawah';

    const alertId = alertStore.addAlert(
      message.author.id,
      message.channel.id,
      coin.id,
      coin.symbol,
      coin.name,
      condition,
      targetPrice
    );

    const embed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle('🔔 Alert Created!')
      .setDescription(`Gue bakal notify lo kalau **${coin.name} (${coin.symbol.toUpperCase()})** ${label} **${coinData.formatPrice(targetPrice)}**`)
      .addFields(
        { name: '🪙 Coin', value: `${coin.name} (${coin.symbol.toUpperCase()})`, inline: true },
        { name: '📊 Condition', value: condition === 'above' ? '📈 Above' : '📉 Below', inline: true },
        { name: '🎯 Target Price', value: coinData.formatPrice(targetPrice), inline: true },
        { name: '🆔 Alert ID', value: `\`${alertId}\``, inline: false }
      )
      .setFooter({ text: 'Gunain !alerts buat liat daftar alert lo' })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
};
