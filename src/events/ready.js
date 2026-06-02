const { EmbedBuilder } = require('discord.js');
const alertStore = require('../utils/alertStore');
const coinData = require('../utils/coinData');

const CHECK_INTERVAL_MS = 1000 * 60; // 1 menit

async function checkAlerts(client) {
  try {
    const activeAlerts = alertStore.getAllActiveAlerts();
    if (!activeAlerts.length) return;

    // Group by coin ID biar fetch sekali
    const grouped = {};
    for (const alert of activeAlerts) {
      if (!grouped[alert.coinId]) grouped[alert.coinId] = [];
      grouped[alert.coinId].push(alert);
    }

    const coinIds = Object.keys(grouped);
    const priceData = await coinData.fetchPrice(coinIds);

    for (const coinId of coinIds) {
      const data = priceData[coinId];
      if (!data || data.usd == null) continue;
      const currentPrice = data.usd;

      for (const alert of grouped[coinId]) {
        let triggered = false;

        if (alert.condition === 'above' && currentPrice >= alert.targetPrice) triggered = true;
        if (alert.condition === 'below' && currentPrice <= alert.targetPrice) triggered = true;

        if (triggered) {
          alertStore.markTriggered(alert.userId, alert.id);

          const emoji = alert.condition === 'above' ? '📈' : '📉';
          const label = alert.condition === 'above' ? 'naik di atas' : 'turun di bawah';

          const dmEmbed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle('🚨 Price Alert Triggered!')
            .setDescription(`**${alert.coinName} (${alert.coinSymbol})** ${label} target lo!`)
            .addFields(
              { name: '🎯 Target', value: coinData.formatPrice(alert.targetPrice), inline: true },
              { name: '💰 Harga Sekarang', value: coinData.formatPrice(currentPrice), inline: true },
              { name: '📊 Selisih', value: `${emoji} ${((currentPrice - alert.targetPrice) / alert.targetPrice * 100).toFixed(2)}%`, inline: true },
            )
            .setURL(`https://www.coingecko.com/en/coins/${coinId}`)
            .setFooter({ text: 'Alert otomatis oleh Community Bot' })
            .setTimestamp();

          try {
            const user = await client.users.fetch(alert.userId);
            await user.send({ embeds: [dmEmbed] });
          } catch {
            // User DM tertutup atau user not found — skip
          }
        }
      }
    }
  } catch (err) {
    console.error('Alert checker error:', err.message);
  }
}

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    console.log(`✅ Bot berjalan sebagai ${client.user.tag}`);
    client.user.setActivity('Crypto Market 🪙', { type: 'Watching' });

    // Init coin list
    coinData.ensureCoinList();

    // Alert checker — tiap 1 menit
    checkAlerts(client);
    setInterval(() => checkAlerts(client), CHECK_INTERVAL_MS);
  }
};
