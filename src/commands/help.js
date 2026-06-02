const { EmbedBuilder } = require('discord.js');

const CATEGORIES = {
  crypto: {
    emoji: '💰',
    name: 'Crypto',
    color: '#F1C40F',
    desc: 'Cek harga, alert, wallet, kalkulator & konversi otomatis',
    items: [
      { cmd: '!price btc', ex: 'Harga 1 BTC dalam USD' },
      { cmd: '!price 1 wld to idr', ex: '1 WLD ke Rupiah' },
      { cmd: '!price btc 10 idr', ex: '10 BTC dalam Rupiah' },
      { cmd: '!price 0.5 eth usd', ex: '0.5 ETH ke USD' },
      { cmd: '!cek 0x...', ex: 'Cek wallet (ETH/BSC/Polygon/dll)' },
      { cmd: '!cek 0x... celo', ex: 'Cek wallet paksa chain' },
      { cmd: '!cek <sol_addr> sol', ex: 'Cek wallet Solana' },
      { cmd: '!gas', ex: 'Gas fee Ethereum terkini' },
      { cmd: '!gas bsc', ex: 'Gas fee BNB Chain' },
      { cmd: '!gas polygon', ex: 'Gas fee Polygon' },
      { cmd: '!chart btc', ex: 'Chart BTC 7 hari' },
      { cmd: '!chart eth 1d', ex: 'Chart ETH 24 jam' },
      { cmd: '!chart sol 30d', ex: 'Chart SOL 30 hari' },
      { cmd: '!alert btc above 100000', ex: 'Alert kalo BTC di atas $100rb' },
      { cmd: '!alerts', ex: 'Lihat semua alert lo' },
      { cmd: '!alerts remove <id>', ex: 'Hapus alert' },
    ],
    auto: [
      '**🔢 Kalkulator** — tinggal ketik: `2+2`, `sqrt(144)`, `(10+5)*3`',
      '**💱 Konversi** — tinggal ketik: `100 usd to idr`, `btc to idr`, `eth * 2 usd`',
    ],
  },
  komunitas: {
    emoji: '👥',
    name: 'Komunitas',
    color: '#3498DB',
    desc: 'Info server, profil, polling, pengumuman',
    items: [
      { cmd: '!userinfo', ex: 'Info profil lo (lengkap)' },
      { cmd: '!userinfo @teman', ex: 'Info profil teman (terbatas)' },
      { cmd: '!serverinfo', ex: 'Detail server ini' },
      { cmd: '!announce Judul | Pesan', ex: 'Buat pengumuman embed' },
      { cmd: '!poll Makan apa? | Nasi | Mie | Roti', ex: 'Buat polling' },
      { cmd: '!sellers', ex: 'Lihat seller terpercaya' },
      { cmd: '!cuaca jakarta', ex: 'Cek cuaca kota' },
      { cmd: '!afk', ex: 'Set status AFK (alasan opsional)' },
      { cmd: '!afk mandi dulu', ex: 'AFK dengan alasan' },
      { cmd: '!back', ex: 'Hapus status AFK manual' },
      { cmd: '!ocr (reply/upload)', ex: 'Baca teks dari gambar (ENG+IND)' },
    ],
    auto: [
      '**🕐 Jam** — tinggal ketik `jam` ↓ liat gambar waktu',
      '**📋 Seller** — tinggal ketik `seller` ↓ liat + tag seller',
      '**🔍 Cari Seller** — ketik kata aja, misal \`vmos\` ↓ auto cocok notes seller',
      '**💤 AFK** — auto-detect: mention yg AFK • auto-remove pas chat',
    ],
  },
  moderasi: {
    emoji: '🛡️',
    name: 'Moderasi',
    color: '#E74C3C',
    desc: 'Kick & ban anggota server',
    items: [
      { cmd: '!kick @user', ex: 'Kick anggota' },
      { cmd: '!kick @user alasan', ex: 'Kick + kasih alasan' },
      { cmd: '!ban @user', ex: 'Ban anggota' },
      { cmd: '!ban @user alasan', ex: 'Ban + kasih alasan' },
    ],
  },
  admin: {
    emoji: '⚙️',
    name: 'Admin',
    color: '#9B59B6',
    desc: 'Pengaturan server & fitur',
    items: [
      { cmd: '!addseller @user', ex: 'Tambah seller terpercaya' },
      { cmd: '!addseller @user fast respon', ex: 'Tambah + catatan' },
      { cmd: '!delseller @user', ex: 'Hapus seller' },
      { cmd: '!setwelcome', ex: 'Set channel welcome (saat ini)' },
      { cmd: '!setwelcome #general', ex: 'Set channel welcome tertentu' },
      { cmd: '!setgoodbye', ex: 'Set channel goodbye' },
      { cmd: '!testwelcome', ex: 'Preview welcome embed' },
      { cmd: '!testgoodbye', ex: 'Preview goodbye embed' },
      { cmd: '!setjam <url>', ex: 'Ganti gambar keyword "jam"' },
      { cmd: '!setsellerrole @role', ex: 'Auto-assign role ke seller baru' },
      { cmd: '!setsellerrole remove', ex: 'Hapus pengaturan role seller' },
    ],
  },
};

module.exports = {
  name: 'help',
  description: 'Tampilkan menu bantuan.',
  async execute(message, args, { PREFIX }) {
    const P = PREFIX;
    const categoryArg = args[0]?.toLowerCase();

    // ─── Category specific ────────────────────────────
    if (categoryArg && CATEGORIES[categoryArg]) {
      const cat = CATEGORIES[categoryArg];
      const embed = new EmbedBuilder()
        .setColor(cat.color)
        .setTitle(`${cat.emoji}  ${cat.name}`)
        .setDescription(`\`\`\`${cat.desc}\`\`\``)
        .addFields(
          { name: '\u200b', value: '**Perintah:**', inline: false },
          ...cat.items.map(i => ({
            name: `\`${P}${i.cmd.replace(/^!/, '')}\``,
            value: `↳ ${i.ex}`,
            inline: false,
          }))
        );

      if (cat.auto?.length) {
        embed.addFields(
          { name: '\u200b', value: '**Fitur Otomatis (tanpa prefix):**', inline: false },
          ...cat.auto.map(a => ({ name: '\u200b', value: a, inline: false }))
        );
      }

      embed
        .setFooter({ text: `Ketik ${P}help untuk menu utama` })
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    }

    // ─── Main menu ────────────────────────────────────
    const main = new EmbedBuilder()
      .setColor('#2C3E50')
      .setTitle('📘  Menu Bantuan')
      .setDescription(
        'Pilih kategori di bawah atau ketik **`!help <kategori>`**\n'
        + 'Contoh: `!help crypto` — liat perintah crypto lengkap\n'
      )
      .setTimestamp();

    for (const cat of Object.values(CATEGORIES)) {
      const cmdList = cat.items
        .map(i => `\`${i.cmd}\``)
        .join('\n');
      main.addFields({
        name: `${cat.emoji}  ${cat.name}`,
        value: `${cmdList}\n-# ${cat.desc}`,
        inline: false,
      });
    }

    main.addFields({
      name: '🤖  Smart Features (tanpa prefix !)',
      value:
        'Fitur ini jalan otomatis tanpa perlu tanda seru:\n'
        + '• **🧮 Kalkulator** — `2+2` `sqrt(144)` `(10+5)*3`\n'
        + '• **💱 Konversi** — `100 usd to idr` `btc to idr` `5 btc to usd`\n'
        + '• **🕐 Jam** — ketik `jam` ↓ lihat gambar waktu\n'
        +         '• **📋 Seller** — ketik `seller` ↓ lihat + tag seller\n'
        + '• **🔍 Cari Seller** — ketik kata aja, misal \`vmos\` ↓ auto cocok notes seller\n'
        + '• **🔍 Cek Wallet** — pake `!cek` (pake prefix !)',
      inline: false,
    });

    const total = Object.values(CATEGORIES).reduce((a, c) => a + c.items.length, 0);
    main.setFooter({ text: `${total}+ perintah · XiozyCX` });

    return message.channel.send({ embeds: [main] });
  }
};
