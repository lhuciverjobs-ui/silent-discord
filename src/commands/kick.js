const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'kick',
  description: 'Kick anggota dari server dengan embed yang rapi.',
  permissions: [PermissionFlagsBits.KickMembers],
  async execute(message, args) {
    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const reason = args.slice(1).join(' ') || 'Tidak ada alasan spesifik';

    if (!target) {
      return message.reply({ embeds: [new EmbedBuilder().setColor('#E74C3C').setTitle('Target Tidak Ditemukan').setDescription('Mention user atau gunakan ID member yang valid.')] });
    }
    if (!target.kickable) {
      return message.reply({ embeds: [new EmbedBuilder().setColor('#E74C3C').setTitle('Tidak Bisa Kick').setDescription('Bot tidak memiliki izin atau target memiliki hak lebih tinggi.')] });
    }

    const kickEmbed = new EmbedBuilder()
      .setColor('#F39C12')
      .setTitle('Member Dikeluarkan')
      .setDescription(`${target.user.tag} telah dikick dari server.`)
      .addFields(
        { name: 'Alasan', value: reason, inline: false },
        { name: 'Oleh', value: message.author.tag, inline: true },
        { name: 'Waktu', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setFooter({ text: 'Moderasi komunitas' });

    await target.kick(reason);
    await message.channel.send({ embeds: [kickEmbed] });
  }
};
