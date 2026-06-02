const { EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client, { guildConfig, WELCOME_CHANNEL_ID }) {
    const settings = guildConfig.getSettings(member.guild.id);
    const channelId = settings?.welcomeChannelId || WELCOME_CHANNEL_ID;
    if (!channelId) return;

    let channel = member.guild.channels.cache.get(channelId);
    if (!channel) {
      channel = await member.guild.channels.fetch(channelId).catch(() => null);
    }
    if (!channel || typeof channel.send !== 'function') return;

    const welcomeEmbed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle('Selamat Datang!')
      .setDescription(`Halo ${member.user}, selamat datang di **${member.guild.name}**!\n
Silakan perkenalkan diri di channel yang tersedia dan baca aturan komunitas.`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '👋 Apa yang harus dilakukan', value: '1. Baca aturan\n2. Kenalkan diri\n3. Nikmati suasana komunitas' },
        { name: '💬 Butuh bantuan?', value: 'Mentions: <@&ROLE_ID> (ganti dengan role support di servermu)' }
      )
      .setFooter({ text: 'Selamat bergabung!' })
      .setTimestamp();

    channel.send({ embeds: [welcomeEmbed] });
  }
};
