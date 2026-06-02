const { EmbedBuilder } = require('discord.js');
const alertStore = require('../utils/alertStore');
const coinData = require('../utils/coinData');

module.exports = {
  name: 'alerts',
  description: 'Lihat & hapus alert harga crypto lu. !alerts, !alerts remove <id>',
  async execute(message, args) {
    const userAlerts = alertStore.getUserAlerts(message.author.id);

    // !alerts remove <id>
    if (args[0] === 'remove' && args[1]) {
      const removed = alertStore.removeAlert(message.author.id, args[1]);
      if (removed) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('✅ Alert Dihapus')
            .setDescription(`Alert \`${args[1]}\` udah dihapus.`)
            .setTimestamp()]
        });
      }
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('❌ Gagal Hapus')
          .setDescription(`Alert \`${args[1]}\` gak ketemu. Cek ID pake \`!alerts\`.`)
          .setTimestamp()]
      });
    }

    // Tampilkan daftar alert
    if (!userAlerts.length) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle('🔔 Alert Crypto')
          .setDescription('Lo belum punya alert apa-apa.\nBikin alert: `!alert btc above 100000`')
          .setTimestamp()]
      });
    }

    const activeAlerts = userAlerts.filter(a => !a.triggered);
    const triggeredAlerts = userAlerts.filter(a => a.triggered);

    const embed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle(`🔔 Alert Crypto (${message.author.username})`)
      .setDescription(`Total: **${userAlerts.length}** alert (${activeAlerts.length} aktif, ${triggeredAlerts.length} terpicu)`);

    if (activeAlerts.length) {
      const list = activeAlerts.map((a, i) =>
        `**${i + 1}.** ${a.coinName} (\`${a.coinSymbol}\`) → ${a.condition === 'above' ? '📈 Above' : '📉 Below'} ${coinData.formatPrice(a.targetPrice)}\n└ ID: \`${a.id}\``
      ).join('\n');
      embed.addFields({ name: '🟢 Aktif', value: list, inline: false });
    }

    if (triggeredAlerts.length) {
      const list = triggeredAlerts.map(a =>
        `~~${a.coinName} (\`${a.coinSymbol}\`) → ${a.condition === 'above' ? '📈 Above' : '📉 Below'} ${coinData.formatPrice(a.targetPrice)}~~`
      ).join('\n');
      embed.addFields({ name: '🔴 Terpicu (akan otomatis dihapus)', value: list, inline: false });
    }

    embed
      .setFooter({ text: 'Hapus alert: !alerts remove <id>' })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }
};
