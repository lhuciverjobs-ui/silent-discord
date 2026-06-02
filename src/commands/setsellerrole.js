const { EmbedBuilder } = require('discord.js');
const guildConfig = require('../utils/guildConfig');

module.exports = {
  name: 'setsellerrole',
  description: 'Set role yang otomatis dikasih ke seller baru. Contoh: !setsellerrole @Seller',
  permissions: 'ManageRoles',
  async execute(message, args) {
    // Handle remove
    if (args[0]?.toLowerCase() === 'remove' || args[0]?.toLowerCase() === 'hapus') {
      guildConfig.clearSellerRoleId(message.guild.id);
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#F1C40F')
          .setTitle('🗑️ Role Seller Dihapus')
          .setDescription('Bot gak bakal ngasih role otomatis lagi pas add seller.')
          .setTimestamp()],
      });
    }

    let role;

    // Try role mention
    if (message.mentions.roles.size) {
      role = message.mentions.roles.first();
    } else if (args.length) {
      // Try role name or ID
      const nameOrId = args.join(' ').toLowerCase();
      role = message.guild.roles.cache.find(r =>
        r.name.toLowerCase() === nameOrId || r.id === args[0]
      );
    }

    if (!role) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#F1C40F')
          .setTitle('❓ Cara Pakai !setsellerrole')
          .setDescription(
            '**Format:** `!setsellerrole @role`\n'
            + '**Contoh:** `!setsellerrole @Seller`\n\n'
            + 'Ketik `!setsellerrole remove` buat hapus pengaturan role.'
          )],
      });
    }

    // Check if bot can manage this role
    if (!role.editable) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('❌ Role Tidak Bisa Diassign')
          .setDescription(`Bot gak punya izin buat ngasih role **${role.name}**.\nPastikan role bot berada di atas role ini di server settings.`)],
      });
    }

    guildConfig.setSellerRoleId(message.guild.id, role.id);

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#10B981')
        .setTitle('✅ Role Seller Diset')
        .setDescription(`Seller baru bakal otomatis dapet role **${role.name}**.`)
        .setTimestamp()],
    });
  },
};
