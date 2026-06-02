const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const guildConfig = require('../utils/guildConfig');

module.exports = {
  name: 'setjam',
  description: 'Set gambar untuk keyword "jam".',
  permissions: [PermissionFlagsBits.ManageMessages],
  async execute(message, args) {
    if (!args[0]) {
      // Show current jam image
      const current = guildConfig.getJamImage(message.guild.id);
      if (current) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('🕐 Gambar Jam Saat Ini')
            .setImage(current)
            .setTimestamp()]
        });
      }
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('Belum Ada Gambar')
          .setDescription('Gambar jam belum di-set. Gunakan `!setjam <url>` untuk set gambar.')
          .setTimestamp()]
      });
    }

    const url = args[0];
    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('URL Tidak Valid')
          .setDescription('Kasih URL gambar yang valid (mulai dengan http:// atau https://).')]
      });
    }

    guildConfig.setJamImage(message.guild.id, url);

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('🕐 Gambar Jam Diupdate')
        .setDescription('Sekarang kalo ada yang ketik "jam", bot bakal kirim gambar ini:')
        .setImage(url)
        .setTimestamp()]
    });
  }
};
