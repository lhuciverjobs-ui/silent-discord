const { EmbedBuilder } = require('discord.js');

const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

module.exports = {
  name: 'poll',
  description: 'Buat poll interaktif dengan beberapa opsi.',
  async execute(message, args) {
    const content = args.join(' ').split('|').map(item => item.trim());
    if (content.length < 3 || content.length > 6) {
      const usageEmbed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setTitle('Format Poll Salah')
        .setDescription('Gunakan: `!poll <pertanyaan> | <opsi1> | <opsi2> ...`\nMaksimal 5 opsi.')
        .setTimestamp();
      return message.reply({ embeds: [usageEmbed] });
    }

    const [question, ...options] = content;
    const pollEmbed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle('📊 Poll Komunitas')
      .setDescription(`**${question}**`)
      .setFooter({ text: `Diposting oleh ${message.author.username}` })
      .setTimestamp();

    options.forEach((option, index) => {
      pollEmbed.addFields({ name: `${numberEmojis[index]} Opsi ${index + 1}`, value: option, inline: false });
    });

    const pollMessage = await message.channel.send({ embeds: [pollEmbed] });
    for (let i = 0; i < options.length; i += 1) {
      await pollMessage.react(numberEmojis[i]);
    }
  }
};
