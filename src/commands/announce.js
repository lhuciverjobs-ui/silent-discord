const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'announce',
  description: 'Kirim pengumuman embed khusus komunitas.',
  permissions: ['ManageGuild'],
  async execute(message, args) {
    const content = args.join(' ').split('|').map(item => item.trim());
    if (content.length < 2) {
      const usageEmbed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setTitle('Format Perintah Salah')
        .setDescription('Gunakan: `!announce <judul> | <pesan>`')
        .setTimestamp();
      return message.reply({ embeds: [usageEmbed] });
    }

    const [title, description] = content;
    const announceEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(title)
      .setDescription(description)
      .setFooter({ text: `Pengumuman dari ${message.author.tag}` })
      .setTimestamp();

    await message.channel.send({ embeds: [announceEmbed] });
    await message.react('✅');
  }
};
