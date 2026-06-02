const { EmbedBuilder } = require('discord.js');
const Tesseract = require('tesseract.js');

module.exports = {
  name: 'ocr',
  description: 'Baca teks dari gambar. Reply ke gambar atau kirim attachment + !ocr',
  async execute(message, args) {
    // Cari attachment: dari message langsung atau reply
    let attachment = message.attachments.first();

    if (!attachment && message.reference) {
      try {
        const replied = await message.fetchReference();
        attachment = replied.attachments.first();
      } catch (_) { /* reply mungkin udh dihapus */ }
    }

    if (!attachment) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#F1C40F')
          .setTitle('❓ Cara Pakai !ocr')
          .setDescription(
            'Kirim gambar dengan caption `!ocr`\n'
            + 'Atau reply gambar dengan `!ocr`\n\n'
            + '**Contoh:**\n'
            + '`!ocr` + upload gambar\n'
            + '`!ocr` + reply ke gambar'
          )],
      });
    }

    // Cek format gambar
    const imgExt = attachment.contentType || '';
    if (!imgExt.startsWith('image/')) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('❌ Bukan Gambar')
          .setDescription('File yg dilampirkan bukan gambar.')],
      });
    }

    // Max 8MB
    if (attachment.size > 8_000_000) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('❌ Gambar Kegedean')
          .setDescription('Max 8MB bro.')],
      });
    }

    await message.channel.sendTyping();

    try {
      const { data } = await Tesseract.recognize(attachment.url, 'eng+ind', {
        logger: () => {}, // silent
      });

      const text = data.text.trim();
      const confidence = Math.round(data.confidence);

      if (!text) {
        return message.reply({
          embeds: [new EmbedBuilder()
            .setColor('#F1C40F')
            .setTitle('🔍 Gak Ada Teks')
            .setDescription('Gak nemu teks di gambar itu. Coba gambar yg lebih jelas.')],
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('📄 Hasil OCR')
        .setDescription(`\`\`\`\n${text.slice(0, 3800)}\n\`\`\``)
        .setFooter({ text: `Confidence: ${confidence}%  •  Tesseract.js` })
        .setTimestamp();

      if (text.length > 3800) {
        embed.addFields({ name: '⚠️ Teks Kepotong', value: `Sisa ${text.length - 3800} karakter gak tampil.`, inline: false });
      }

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('OCR error:', err);
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('❌ OCR Gagal')
          .setDescription(`Gagal baca teks: ${err.message}`)],
      });
    }
  },
};
