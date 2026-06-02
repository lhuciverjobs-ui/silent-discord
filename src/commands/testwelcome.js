const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'testwelcome',
  description: 'Coba tampilan welcome embed di channel ini.',
  async execute(message) {
    const welcomeEmbed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle('Preview Welcome')
      .setDescription(`Halo ${message.author}, ini adalah contoh pesan welcome untuk server **${message.guild.name}**.`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '👋 Ayo Berkenalan', value: 'Perkenalkan diri dan lanjutkan obrolan dengan hangat.' },
        { name: '📌 Tips Komunitas', value: 'Jangan lupa baca aturan dan ikuti channel yang ada.' }
      )
      .setFooter({ text: 'Contoh welcome embed' })
      .setTimestamp();

    await message.channel.send({ embeds: [welcomeEmbed] });
  }
};
