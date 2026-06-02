const { EmbedBuilder } = require('discord.js');
const afkStore = require('../utils/afkStore');

module.exports = {
  name: 'afk',
  description: 'Set status AFK. Otomatis balik pas lo chat. Contoh: !afk, !afk mandi dulu',
  async execute(message, args) {
    // Auto-remove existing AFK first if any
    const existing = afkStore.removeAFK(message.author.id);
    if (existing) {
      // They already had AFK, but they're setting a new one
      // Just continue with new AFK
    }

    const reason = args.length ? args.join(' ') : 'Lagi AFK';
    afkStore.setAFK(message.author.id, reason);

    // Try to DM the user a confirmation
    let dmNote = '';
    try {
      await message.author.send({
        embeds: [new EmbedBuilder()
          .setColor('#6366F1')
          .setTitle('💤 AFK Diaktifkan')
          .setDescription(`**Alasan:** ${reason}\n\nAFK akan otomatis nonaktif saat kamu ngirim chat.`)
          .setTimestamp()],
      });
      dmNote = ' 📬 Cek DM';
    } catch { /* DM closed */ }

    // Pick a random sleepy emoji
    const emojis = ['💤', '😴', '🛌', '🌙', '💫'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    const embed = new EmbedBuilder()
      .setColor('#6366F1')
      .setAuthor({
        name: `${message.member?.displayName || message.author.username} sedang AFK`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }))
      .setDescription(
        `${emoji} **Alasan:** ${reason}\n\n`
        + `🕐 Sejak: <t:${Math.floor(Date.now() / 1000)}:R>\n\n`
        + `*AFK otomatis hilang saat kamu ngirim pesan.*`
      )
      .setFooter({ text: `!back buat manual remove • ${message.author.tag}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
