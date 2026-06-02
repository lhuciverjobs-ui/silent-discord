const { EmbedBuilder } = require('discord.js');
const walletCheck = require('../utils/walletCheck');

module.exports = {
  name: 'cek',
  description: 'Cek wallet address multi-chain. Contoh: !cek 0x..., !cek 0x... eth, !cek <sol_addr> sol',
  async execute(message, args) {
    if (!args.length) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#F1C40F')
          .setTitle('🔍 Cara Pakai !cek')
          .setDescription(
            'Cek saldo wallet di berbagai blockchain.\n\n'
            + '**Format:** `!cek <address> [chain]`\n\n'
            + '**Contoh:**\n'
            + '`!cek 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18` — auto Ethereum\n'
            + '`!cek 0x... celo` — paksa chain Celo\n'
            + '`!cek 0x... bsc` — BNB Smart Chain\n'
            + '`!cek <alamat_solana> sol` — Solana\n'
            + '`!cek <alamat_aptos> apt` — Aptos\n\n'
            + '**Chain tersedia:** eth, bsc, polygon, celo, avax, arbitrum, optimism, base, fantom, sol, apt'
          )
          .setTimestamp()]
      });
    }

    const address = args[0].trim();
    const hintChain = args[1] || null;

    // Defer biar gak timeout kalau lambat
    const msg = await message.reply({ content: '🔄 **Mengecek wallet...**', fetchReply: true });

    try {
      const result = await walletCheck.checkWallet(address, hintChain);

      if (!result.ok) {
        return msg.edit({
          content: '',
          embeds: [new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('❌ Gagal Cek Wallet')
            .setDescription(result.error)
            .setTimestamp()],
        });
      }

      const embed = buildEmbed(result);
      await msg.edit({ content: '', embeds: [embed] });
    } catch (err) {
      console.error('❌ Error !cek:', err.message);
      await msg.edit({
        content: '',
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('❌ Error')
          .setDescription(`Gagal cek wallet: \`${err.message}\`\nCoba lagi nanti atau pake chain beda.`)
          .setTimestamp()],
      }).catch(() => {});
    }
  },
};

function buildEmbed(result) {
  const { chain, address, balance, txCount, lastTxTimestamp, usdValue, tokens, traits, explorerUrl } = result;

  const color = balance.value > 10 ? 0x2ECC71 : balance.value > 0.1 ? 0xF1C40F : 0xE74C3C;
  const emoji = balance.value > 100 ? '🐋' : balance.value > 1 ? '💰' : balance.value > 0 ? '🪙' : '💀';

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} Cek Wallet — ${chain.name}`)
    .setURL(explorerUrl)
    .setDescription(`\`${walletCheck.truncateAddress(address)}\``)
    .addFields(
      {
        name: '💰 Saldo',
        value: `\`${balance.formatted}\` **${chain.symbol}**`,
        inline: true,
      },
      {
        name: '💵 Nilai USD',
        value: usdValue != null
          ? `$${walletCheck.formatNumber(usdValue)}`
          : '*Tidak tersedia*',
        inline: true,
      },
      {
        name: '📊 Transaksi',
        value: txCount != null ? `\`${txCount.toLocaleString('en-US')}\` tx` : '*N/A*',
        inline: true,
      }
    );

  // Last transaction time
  if (lastTxTimestamp) {
    embed.addFields({
      name: '🕐 Transaksi Terakhir',
      value: `<t:${Math.floor(lastTxTimestamp / 1000)}:R>`,
      inline: true,
    });
  } else if (txCount != null && txCount > 0) {
    // Try to get from scan API fallback
    embed.addFields({
      name: '🕐 Transaksi Terakhir',
      value: '*Gunakan API key scan untuk detail waktu*',
      inline: true,
    });
  }

  // Token holdings
  if (tokens.length > 0) {
    const tokenLines = tokens.slice(0, 8).map(t => {
      const bal = t.balance < 0.01 ? t.balance.toExponential(2) : walletCheck.formatNumber(t.balance);
      const usd = t.usdValue != null ? ` ($${walletCheck.formatNumber(t.usdValue)})` : '';
      return `**${t.symbol}**: \`${bal}\`${usd}`;
    });
    if (tokens.length > 8) tokenLines.push(`*...dan ${tokens.length - 8} lainnya*`);
    embed.addFields({
      name: `💎 Token (${tokens.length})`,
      value: tokenLines.join('\n'),
    });
  }

  // Wallet traits
  if (traits.length > 0) {
    embed.addFields({
      name: '🔍 Analisis',
      value: traits.join(' • '),
    });
  }

  // Price info
  if (result.usdPrice != null) {
    embed.addFields({
      name: `💹 Harga ${chain.symbol}`,
      value: `$${result.usdPrice.toFixed(2)}`,
      inline: true,
    });
  }

  // Explorer link
  embed.addFields({
    name: '🔗 Explorer',
    value: `[Lihat di ${chain.name}](${explorerUrl})`,
  });

  embed.setFooter({ text: `Chain: ${chain.name} (${chain.key}) • Data: RPC + CoinGecko` });
  embed.setTimestamp();

  return embed;
}
