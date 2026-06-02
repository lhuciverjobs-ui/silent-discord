const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'testgoodbye',
  description: 'Coba tampilan goodbye embed di channel ini.',
  async execute(message) {
    const goodbyeEmbed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('Preview Goodbye')
      .setDescription(`Ini adalah contoh pesan goodbye saat seseorang meninggalkan server.`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '🚪 Sampai Jumpa', value: 'Semoga kembali lagi kapan-kapan.' },
        { name: '💌 Pesan untuk yang pergi', value: 'Terima kasih sudah ikut berkontribusi di komunitas ini.' }
      )
      .setFooter({ text: 'Contoh goodbye embed' })
      .setTimestamp();

    await message.channel.send({ embeds: [goodbyeEmbed] });
  }
};
