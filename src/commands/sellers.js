const { EmbedBuilder } = require('discord.js');
const guildConfig = require('../utils/guildConfig');

module.exports = {
  name: 'sellers',
  description: 'Lihat daftar seller terpercaya.',
  async execute(message) {
    const sellers = guildConfig.getSellers(message.guild.id);

    if (!sellers.length) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#9B59B6')
          .setTitle('📋 Daftar Seller')
          .setDescription('Belum ada seller terdaftar. Admin bisa nambah pake `!addseller @user`.')]
      });
    }

    const list = sellers.map((s, i) => {
      const notes = s.notes ? ` — *${s.notes}*` : '';
      const addedBy = s.addedBy ? `\n└ Ditambahkan <t:${Math.floor(s.addedAt / 1000)}:R>` : '';
      return `**${i + 1}.** <@${s.userId}>${notes}${addedBy}`;
    });

    return message.reply({
      embeds: [new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle('📋 Daftar Seller Terpercaya')
        .setDescription(list.join('\n'))
        .setFooter({ text: `Total ${sellers.length} seller` })
        .setTimestamp()]
    });
  }
};
