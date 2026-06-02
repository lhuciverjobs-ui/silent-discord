const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const guildConfig = require('../utils/guildConfig');

module.exports = {
  name: 'delseller',
  description: 'Hapus seller dari daftar terpercaya.',
  permissions: [PermissionFlagsBits.ManageMessages],
  async execute(message, args) {
    let userId;

    const target = message.mentions.members.first();
    if (target) {
      userId = target.id;
    } else if (args[0]) {
      // Try as user ID
      userId = args[0].replace(/[<@!>]/g, '');
    }

    if (!userId) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('Target Tidak Ditemukan')
          .setDescription('Mention user atau kasih ID user yang mau dihapus. Contoh: `!delseller @user`')]
      });
    }

    const removed = guildConfig.removeSeller(message.guild.id, userId);
    if (!removed) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('Tidak Ditemukan')
          .setDescription('User tersebut tidak ada di daftar seller.')]
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('🗑️ Seller Dihapus')
      .setDescription(`<@${userId}> berhasil dihapus dari daftar seller terpercaya.`)
      .setTimestamp();

    // Auto-remove seller role if configured
    const roleId = guildConfig.getSellerRoleId(message.guild.id);
    if (roleId) {
      const member = message.guild.members.cache.get(userId);
      const role = message.guild.roles.cache.get(roleId);
      if (member && role && role.editable) {
        try {
          await member.roles.remove(role);
          embed.addFields({ name: '🎭 Role', value: `Role **${role.name}** dicopot.`, inline: true });
        } catch (e) {
          console.error(`Gagal copot role dari ${userId}:`, e.message);
        }
      }
    }

    return message.reply({ embeds: [embed] });
  }
};
