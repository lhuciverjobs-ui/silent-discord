const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'setgoodbye',
  description: 'Atur channel goodbye otomatis untuk server ini.',
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(message, args, { guildConfig }) {
    const arg = args[0];
    let channel = message.mentions.channels.first();

    if (!channel && arg) {
      const id = arg.replace(/[<#>]/g, '');
      channel = message.guild.channels.cache.get(id);
    }

    if (!channel && arg) {
      const name = arg.replace(/^#/, '').toLowerCase();
      channel = message.guild.channels.cache.find(
        c => c.name?.toLowerCase() === name && typeof c.send === 'function'
      );
    }

    if (!channel) {
      channel = message.channel;
    }

    if (!channel || typeof channel.send !== 'function') {
      const errorEmbed = new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('Channel Tidak Valid')
        .setDescription('Tag channel text atau gunakan ID/nama channel yang valid.')
        .setTimestamp();
      return message.reply({ embeds: [errorEmbed] });
    }

    guildConfig.setSetting(message.guild.id, 'goodbyeChannelId', channel.id);

    const successEmbed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('Channel Goodbye Disimpan')
      .setDescription(`Pesan perpisahan akan dikirim di channel ${channel}.`)
      .setTimestamp();

    await message.reply({ embeds: [successEmbed] });
  }
};
