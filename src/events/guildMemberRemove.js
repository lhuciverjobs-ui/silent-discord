const { EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client, { guildConfig }) {
    const settings = guildConfig.getSettings(member.guild.id);
    const channelId = settings?.goodbyeChannelId;
    if (!channelId) return;

    let channel = member.guild.channels.cache.get(channelId);
    if (!channel) {
      channel = await member.guild.channels.fetch(channelId).catch(() => null);
    }
    if (!channel || typeof channel.send !== 'function') return;

    const goodbyeEmbed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('Sampai Jumpa!')
      .setDescription(`${member.user.tag} telah meninggalkan server.
Semoga kamu kembali lagi suatu hari nanti.`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: 'Semoga harimu menyenangkan!' })
      .setTimestamp();

    channel.send({ embeds: [goodbyeEmbed] });
  }
};
