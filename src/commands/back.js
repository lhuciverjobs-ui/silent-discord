const { EmbedBuilder } = require('discord.js');
const afkStore = require('../utils/afkStore');

module.exports = {
  name: 'back',
  description: 'Hapus status AFK secara manual. Contoh: !back',
  async execute(message, args) {
    const data = afkStore.removeAFK(message.author.id);

    if (!data) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#F1C40F')
          .setDescription('❓ Lo gak sedang AFK.'),
        ],
      });
    }

    const duration = afkStore.formatDuration(data.since);

    const embed = new EmbedBuilder()
      .setColor('#10B981')
      .setAuthor({
        name: `${message.member?.displayName || message.author.username} kembali!`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }))
      .setDescription(
        `👋 Selamat datang kembali!\n\n`
        + `💤 **Waktu AFK:** ${duration}\n`
        + `📝 **Alasan:** ${data.reason}`
      )
      .setFooter({ text: `AFK selama ${duration}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
