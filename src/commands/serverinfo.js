const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'serverinfo',
  description: 'Tampilkan info server komunitas dengan embed menarik.',
  async execute(message) {
    const { guild } = message;
    const serverEmbed = new EmbedBuilder()
      .setColor('#1ABC9C')
      .setTitle(`Informasi Server: ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: 'ID Server', value: guild.id, inline: true },
        { name: 'Region', value: guild.preferredLocale || 'Tidak tersedia', inline: true },
        { name: 'Member', value: `${guild.memberCount}`, inline: true },
        { name: 'Channel', value: `${guild.channels.cache.size}`, inline: true },
        { name: 'Role', value: `${guild.roles.cache.size}`, inline: true }
      )
      .setFooter({ text: 'Community Bot' })
      .setTimestamp();

    await message.channel.send({ embeds: [serverEmbed] });
  }
};
