const { EmbedBuilder } = require('discord.js');
const { isMathExpression, evaluate, formatNumber } = require('../utils/mathEval');
const {
  isKnownSymbol, isFiatCurrency, convert, parseAmountExpr, formatPrice, FIAT_CODES,
} = require('../utils/coinData');
const afkStore = require('../utils/afkStore');

const SEPARATORS = new Set(['to', 'ke', 'dalam', 'in', '=', '?', 'menjadi', 'convert', 'konversi', 'jadi']);

module.exports = {
  name: 'messageCreate',
  async execute(message, client, { PREFIX, guildConfig }) {
    if (message.author.bot || !message.guild) return;

    // --- AFK auto-detect ---

    // 1. Check if MENTIONED users are AFK
    const mentionedAFK = [];
    for (const user of message.mentions.users.values()) {
      if (user.id === message.author.id) continue; // skip self-mention
      const afkData = afkStore.getAFK(user.id);
      if (afkData) {
        mentionedAFK.push({ user, data: afkData });
      }
    }
    if (mentionedAFK.length) {
      // Reply embed showing who's AFK
      const desc = mentionedAFK.map(({ user, data }) => {
        const since = `<t:${Math.floor(data.since / 1000)}:R>`;
        return `<@${user.id}> — ${data.reason} (${since})`;
      }).join('\n');

      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#6366F1')
          .setTitle('💤 Lagi AFK')
          .setDescription(desc)
          .setTimestamp()],
      });
    }

    // 2. Check if SENDER is AFK → auto-remove
    const senderAFK = afkStore.getAFK(message.author.id);
    if (senderAFK) {
      afkStore.removeAFK(message.author.id);
      const duration = afkStore.formatDuration(senderAFK.since);

      // Reply to the message that triggered the return
      message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#10B981')
          .setAuthor({
            name: `${message.member?.displayName || message.author.username} kembali!`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          })
          .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }))
          .setDescription(
            `👋 Selamat datang kembali!\n\n`
            + `💤 **Waktu AFK:** ${duration}\n`
            + `📝 **Alasan:** ${senderAFK.reason}`
          )
          .setFooter({ text: `AFK otomatis nonaktif` })
          .setTimestamp()],
      }).catch(() => {});
    }

    // --- Non-prefix smart features ---
    if (!message.content.startsWith(PREFIX)) {
      const content = message.content.trim();
      if (content.length <= 300) {
        // Try conversion first (currency codes detected)
        const conv = parseConversion(content);
        if (conv) {
          const { amountExpr, from, to, multiplier } = conv;
          let amount = parseAmountExpr(amountExpr);
          if (amount != null) {
            amount *= multiplier;
            try {
              const result = await convert({ amount, from, to });
              return message.reply({ embeds: [formatConversion(result, conv)] });
            } catch (err) {
              return message.reply(`❌ **Error:** ${err.message}`);
            }
          }
          // Amount not parsed — fall through to keyword triggers
        }

        // Keyword: "jam" — tampilkan gambar jam
        if (/\bjam\b/i.test(content)) {
          // Default image — kalo mau ganti pake !setjam
          const DEFAULT_JAM_URL = 'https://h.top4top.io/p_3804jc5ny1.png';
          const jamUrl = guildConfig.getJamImage(message.guild.id) || DEFAULT_JAM_URL;
          return message.reply({
            embeds: [new EmbedBuilder()
              .setColor('#3498DB')
              .setTitle('🕐 Waktu Sekarang')
              .setImage(jamUrl)
              .setTimestamp()]
          });
        }

        // Keyword: "seller" — tampilkan daftar seller + tag
        // Bisa pake filter: "seller vmos" → tampilin seller dengan notes "vmos"
        const sellerMatch = content.match(/\bseller\b(?:\s+(\S+))?/i);
        if (sellerMatch) {
          const filterWord = sellerMatch[1]?.toLowerCase();
          const sellers = guildConfig.getSellers(message.guild.id);

          if (!sellers.length) {
            return message.reply({
              embeds: [new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle('📋 Daftar Seller')
                .setDescription('Belum ada seller terdaftar.')]
            });
          }

          let displayed = sellers;
          let title = '📋 Seller Terpercaya';
          let footer = `Total ${sellers.length} seller`;

          if (filterWord) {
            displayed = sellers.filter(s =>
              s.notes?.toLowerCase().includes(filterWord)
            );
            if (!displayed.length) {
              return message.reply({
                embeds: [new EmbedBuilder()
                  .setColor('#F1C40F')
                  .setTitle('🔍 Seller Tidak Ditemukan')
                  .setDescription(`Gak ada seller dengan kata kunci \`${filterWord}\`.\nKetik \`seller\` aja buat liat semua.`)
                  .setTimestamp()],
              });
            }
            title = `🔍 Seller — ${filterWord}`;
            footer = `${displayed.length} seller cocok`;
          }

          const list = displayed.map((s, i) => {
            const notes = s.notes ? ` — ${s.notes}` : '';
            return `**${i + 1}.** <@${s.userId}>${notes}`;
          });

          return message.reply({
            embeds: [new EmbedBuilder()
              .setColor('#9B59B6')
              .setTitle(title)
              .setDescription(list.join('\n'))
              .setFooter({ text: footer })
              .setTimestamp()],
          });
        }

        // Auto-detect: kalo ada yg ngetik kata yg cocok sama notes seller
        const trimmed = content.trim().toLowerCase();
        if (trimmed.length >= 2 && trimmed.length <= 30 && /^[a-z0-9]+$/.test(trimmed)) {
          const sellers = guildConfig.getSellers(message.guild.id);
          const matched = sellers.filter(s => s.notes?.toLowerCase().includes(trimmed));
          if (matched.length > 0) {
            const list = matched.map((s, i) => {
              const notes = s.notes ? ` — ${s.notes}` : '';
              return `**${i + 1}.** <@${s.userId}>${notes}`;
            });
            return message.reply({
              embeds: [new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle(`🔍 Seller — ${trimmed}`)
                .setDescription(list.join('\n'))
                .setFooter({ text: `${matched.length} seller cocok • Ketik "seller" buat lihat semua` })
                .setTimestamp()],
            });
          }
        }

        // Fallback to pure math
        if (isMathExpression(content)) {
          const result = evaluate(content);
          if (result.ok) {
            return message.reply(`\`\`\`\n= ${formatNumber(result.value)}\n\`\`\``);
          }
        }
      }
      return;
    }

    // --- Prefix commands ---

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (!command) return;

    if (command.permissions && !message.member.permissions.has(command.permissions)) {
      const denyEmbed = new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('Akses Ditolak')
        .setDescription('Kamu tidak memiliki izin untuk menjalankan perintah ini.')
        .setTimestamp();
      return message.reply({ embeds: [denyEmbed] });
    }

    try {
      await command.execute(message, args, { PREFIX, guildConfig });
    } catch (error) {
      console.error(error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('Terjadi Kesalahan')
        .setDescription('Maaf, ada yang tidak beres saat memproses perintah.')
        .setTimestamp();
      await message.reply({ embeds: [errorEmbed] });
    }
  }
};

// ─── Conversion parser ──────────────────────────────────────

function parseConversion(content) {
  const tokens = content.split(/\s+/);
  if (tokens.length < 2 || tokens.length > 12) return null;

  // Find currency/crypto code positions (skip separators)
  const found = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i].toLowerCase();
    if (SEPARATORS.has(tok)) continue;
    if (isFiatCurrency(tok) || isKnownSymbol(tok)) {
      found.push({ idx: i, code: tok });
    }
  }
  if (found.length < 2) return null;

  // Use first and last currency codes
  const from = found[0];
  const to = found[found.length - 1];
  if (from.idx === to.idx) return null;

  // Validate tokens between — only separators, currency codes, * N, or bare numbers allowed
  let multiplier = 1;
  for (let i = from.idx + 1; i < to.idx; i++) {
    const tok = tokens[i].toLowerCase();
    if (SEPARATORS.has(tok)) continue;
    // Intermediate currency codes are allowed (chain: usd to btc to eur → usd→eur)
    if (isFiatCurrency(tok) || isKnownSymbol(tok)) continue;
    // * N or x N → quantity multiplier
    if ((tok === '*' || tok === 'x') && i + 1 < to.idx) {
      const n = parseFloat(tokens[i + 1]);
      if (!isNaN(n) && n > 0) { multiplier = n; i++; continue; }
    }
    // Bare number → quantity multiplier
    const n = parseFloat(tok);
    if (!isNaN(n) && n > 0) { multiplier = n; continue; }
    return null; // unknown token → not a conversion
  }

  return {
    amountExpr: tokens.slice(0, from.idx).join(' '),
    from: from.code,
    to: to.code,
    multiplier,
  };
}

// ─── Conversion embed ───────────────────────────────────────

function formatConversion(result, conv) {
  const isCryptoToFiat = !FIAT_CODES.has(conv.from.toLowerCase());
  const name = isCryptoToFiat ? conv.from.toUpperCase() : conv.from.toUpperCase();
  const target = conv.to.toUpperCase();
  const amt = conv.amountExpr ? conv.amountExpr : '1';
  const mult = conv.multiplier > 1 ? ` × ${conv.multiplier}` : '';

  return new EmbedBuilder()
    .setColor('#00D26A')
    .setTitle('💱 Konversi Mata Uang')
    .setDescription(`**${amt}${mult} ${name} → ${target}**`)
    .addFields(
      { name: 'Hasil', value: `**${result.label}**`, inline: false },
      { name: 'Rate', value: `1 ${name} = ${formatPrice(result.rate, conv.to)}`, inline: true },
      { name: 'Total', value: `${amt}${mult} ${name} = ${formatPrice(result.result, conv.to)}`, inline: true },
    )
    .setTimestamp();
}
