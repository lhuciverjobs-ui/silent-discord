const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const guildConfig = require('../utils/guildConfig');

module.exports = {
  name: 'addseller',
  description: 'Tambah seller terpercaya ke daftar.',
  permissions: [PermissionFlagsBits.ManageMessages],
  async execute(message, args) {
    const target = message.mentions.members.first();
    if (!target) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('Target Tidak Ditemukan')
          .setDescription('Mention user yang mau ditambah sebagai seller. Contoh: `!addseller @user`')]
      });
    }

    const notes = args.slice(1).join(' ') || '';
    guildConfig.addSeller(message.guild.id, target.id, message.author.id, notes);

    const embed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle('✅ Seller Ditambahkan')
      .setDescription(`${target} berhasil ditambahkan ke daftar seller terpercaya.`)
      .addFields(
        { name: 'Ditambahkan Oleh', value: message.author.tag, inline: true },
        { name: 'Catatan', value: notes || '—', inline: true },
      )
      .setTimestamp();

    // Auto-assign seller role if configured
    const roleId = guildConfig.getSellerRoleId(message.guild.id);
    if (roleId) {
      const role = message.guild.roles.cache.get(roleId);
      if (role && role.editable) {
        try {
          await target.roles.add(role);
          embed.addFields({ name: '🎭 Role', value: `Dapet role **${role.name}**`, inline: true });
        } catch (e) {
          console.error(`Gagal assign role ke ${target.id}:`, e.message);
        }
      }
    }

    return message.reply({ embeds: [embed] });
  }
};
