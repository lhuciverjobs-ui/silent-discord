const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const STATUS_EMOJIS = {
  online: '🟢',
  idle: '🟡',
  dnd: '🔴',
  offline: '⚪',
  invisible: '⚪'
};

const BADGE_NAMES = {
  ActiveDeveloper: '👨‍💻 Active Developer',
  BugHunterLevel1: '🐛 Bug Hunter Lv.1',
  BugHunterLevel2: '🐛 Bug Hunter Lv.2',
  CertifiedModerator: '👮 Moderator',
  HypeSquadOnlineHouse1: '🏠 HypeSquad Bravery',
  HypeSquadOnlineHouse2: '🏠 HypeSquad Brilliance',
  HypeSquadOnlineHouse3: '🏠 HypeSquad Balance',
  HypeSquadEvents: '🎪 HypeSquad Events',
  Partner: '🤝 Partner',
  PremiumEarlySupporter: '⭐ Early Supporter',
  Staff: '👑 Staff',
  VerifiedBotDeveloper: '🤖 Verified Bot Dev',
  VerifiedDeveloper: '✅ Verified Developer'
};

const KEY_PERMISSIONS = [
  { flag: PermissionFlagsBits.Administrator, label: 'Admin' },
  { flag: PermissionFlagsBits.ManageGuild, label: 'Manage Server' },
  { flag: PermissionFlagsBits.ManageChannels, label: 'Manage Channels' },
  { flag: PermissionFlagsBits.ManageRoles, label: 'Manage Roles' },
  { flag: PermissionFlagsBits.ManageMessages, label: 'Manage Messages' },
  { flag: PermissionFlagsBits.KickMembers, label: 'Kick' },
  { flag: PermissionFlagsBits.BanMembers, label: 'Ban' },
  { flag: PermissionFlagsBits.MentionEveryone, label: 'Mention Everyone' },
  { flag: PermissionFlagsBits.ModerateMembers, label: 'Timeout' }
];

// ─── Helpers ────────────────────────────────────────────────────

function getBadgeText(user) {
  try {
    const flags = user.flags?.toArray() || [];
    if (!flags.length) return '*Tidak ada badge publik*';
    return flags.map(f => BADGE_NAMES[f] || f).join(' ');
  } catch {
    return '*Tidak ada badge publik*';
  }
}

function getStatus(presence) {
  const status = presence?.status || 'offline';
  const emoji = STATUS_EMOJIS[status] || '⚪';
  const label = { online: 'Online', idle: 'Idle', dnd: 'Jangan Ganggu', offline: 'Offline', invisible: 'Offline' };
  return `${emoji} ${label[status] || 'Offline'}`;
}

function getActivity(presence) {
  if (!presence) return '*Tidak ada aktivitas*';
  const activities = presence.activities?.filter(a => a.type !== 4) || [];
  const custom = presence.activities?.find(a => a.type === 4);

  const parts = [];
  if (custom?.state) parts.push(`*“${custom.state.replace(/\*|_|`|~/g, '').substring(0, 60)}”*`);

  if (activities.length) {
    const a = activities[0];
    const icons = { 0: '🎮', 1: '📺', 2: '🎵', 3: '👀', 5: '🏆' };
    const labels = { 0: 'Main', 1: 'Streaming', 2: 'Dengerin', 3: 'Nonton', 4: 'Kompetisi' };
    parts.push(`${icons[a.type] || '🎮'} **${a.name}**`);
    if (a.details) parts[parts.length - 1] += ` — ${a.details.substring(0, 40)}`;
  }

  return parts.length ? parts.join('\n') : '*Tidak ada aktivitas*';
}

function getBoost(member) {
  if (!member.premiumSince) return '❌ Tidak boosting';
  const ts = Math.floor(member.premiumSince.getTime() / 1000);
  return `💎 Sejak <t:${ts}:D>`;
}

function getJoinPosition(guild, memberId) {
  try {
    const sorted = guild.members.cache
      .filter(m => !m.user.bot)
      .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0))
      .map(m => m.id);
    const pos = sorted.indexOf(memberId);
    return pos !== -1 ? `#${(pos + 1).toLocaleString()}` : '?';
  } catch {
    return '?';
  }
}

function getTimeout(member) {
  if (!member.communicationDisabledUntil) return '✅ Aman';
  const remaining = member.communicationDisabledUntil - Date.now();
  if (remaining <= 0) return '✅ Aman';
  const ts = Math.floor(member.communicationDisabledUntil.getTime() / 1000);
  return `⛔ Berakhir <t:${ts}:R>`;
}

function getPermissions(member) {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return '👑 **Administrator** — akses penuh';
  }
  const perms = [];
  for (const { flag, label } of KEY_PERMISSIONS) {
    if (member.permissions.has(flag)) perms.push(`\`${label}\``);
  }
  return perms.length ? perms.join(' ') : '*Tidak ada izin khusus*';
}

function getVoice(member) {
  const vc = member.voice.channel;
  if (!vc) return '🔇 Tidak di voice';
  return `🔊 **${vc.name}**`;
}

function getRoles(roles) {
  const roleList = roles
    .filter(r => r.id !== r.guild.id)
    .sort((a, b) => b.position - a.position)
    .map(r => r.toString());
  return roleList;
}

// ─── FULL embed (self-check) ────────────────────────────────────

function buildFullEmbed(user, member, presence, roleColor, avatarURL, bannerURL, roles, message) {
  const created = Math.floor(user.createdTimestamp / 1000);
  const joined = member.joinedAt ? Math.floor(member.joinedTimestamp / 1000) : null;

  return new EmbedBuilder()
    .setColor(roleColor)
    .setAuthor({ name: user.tag, iconURL: avatarURL })
    .setTitle(member.displayName)
    .setThumbnail(avatarURL)
    .addFields(
      { name: '🆔 ID', value: `\`${user.id}\``, inline: true },
      { name: '🤖 Bot', value: user.bot ? '✅ Ya' : '❌ Bukan', inline: true },
      { name: '🎨 Warna', value: `\`${roleColor}\``, inline: true },

      { name: '📡 Status', value: getStatus(presence), inline: true },
      { name: '🎮 Aktivitas', value: getActivity(presence), inline: true },
      { name: '🔊 Voice', value: getVoice(member), inline: true },

      { name: '💪 Boost', value: getBoost(member), inline: true },
      { name: '🔢 Join Ke-', value: getJoinPosition(message.guild, member.id), inline: true },
      { name: '⛔ Timeout', value: getTimeout(member), inline: true },

      { name: '📅 Akun Dibuat', value: `<t:${created}:D>`, inline: true },
      { name: '📍 Bergabung', value: joined ? `<t:${joined}:D>` : '*Tidak diketahui*', inline: true },
      { name: '\u200b', value: '\u200b', inline: true },

      { name: '🔑 Izin Kunci', value: getPermissions(member), inline: false },
      { name: '🎖️ Badges', value: getBadgeText(user), inline: false },
      { name: `👥 Roles (${roles.length})`, value: roles.length
        ? roles.join(' ').substring(0, 1024)
        : '*Tidak ada role selain @everyone*', inline: false }
    )
    .setFooter({ text: `Diminta ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
    .setTimestamp();
}

// ─── LIMITED embed (cek orang lain) ────────────────────────────

function buildLimitedEmbed(user, member, presence, roleColor, avatarURL, bannerURL, roles, message) {
  const created = Math.floor(user.createdTimestamp / 1000);
  const joined = member.joinedAt ? Math.floor(member.joinedTimestamp / 1000) : null;

  return new EmbedBuilder()
    .setColor(roleColor)
    .setAuthor({ name: user.tag, iconURL: avatarURL })
    .setTitle(member.displayName)
    .setThumbnail(avatarURL)
    .addFields(
      { name: '🆔 ID', value: `\`${user.id}\``, inline: true },
      { name: '🤖 Bot', value: user.bot ? '✅ Ya' : '❌ Bukan', inline: true },
      { name: '🎨 Warna', value: `\`${roleColor}\``, inline: true },

      { name: '📡 Status', value: getStatus(presence), inline: true },
      { name: '🎮 Aktivitas', value: getActivity(presence), inline: true },
      { name: '🔊 Voice', value: getVoice(member), inline: true },

      { name: '📅 Akun Dibuat', value: `<t:${created}:D>`, inline: true },
      { name: '📍 Bergabung', value: joined ? `<t:${joined}:D>` : '*Tidak diketahui*', inline: true },
      { name: '\u200b', value: '\u200b', inline: true },

      { name: `👥 Roles (${roles.length})`, value: roles.length
        ? roles.join(' ').substring(0, 1024)
        : '*Tidak ada role selain @everyone*', inline: false },

      { name: '🎖️ Badges', value: getBadgeText(user), inline: false }
    )
    .setFooter({ text: `Diminta ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
    .setTimestamp();
}

// ─── Command ────────────────────────────────────────────────────

module.exports = {
  name: 'userinfo',
  description: 'Tampilkan profil pengguna dengan tampilan embed.',
  async execute(message, args) {
    const target = message.mentions.users.first() || message.author;
    const isSelf = target.id === message.author.id;

    const member = (message.guild.members.cache.get(target.id)
      || await message.guild.members.fetch(target.id).catch(() => null));

    if (!member) return message.reply('❌ User tidak ditemukan di server ini.');

    const user = await target.fetch(true).catch(() => target);
    const presence = member.presence || null;

    const roleColor = member.displayHexColor !== '#000000' ? member.displayHexColor : '#2B2D31';
    const avatarURL = user.displayAvatarURL({ dynamic: true, size: 512 });
    const bannerURL = user.bannerURL({ size: 600 });

    const roles = member.roles.cache
      .filter(r => r.id !== message.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => r.toString());

    let embed;
    if (isSelf) {
      embed = buildFullEmbed(user, member, presence, roleColor, avatarURL, bannerURL, roles, message);
    } else {
      embed = buildLimitedEmbed(user, member, presence, roleColor, avatarURL, bannerURL, roles, message);
    }

    if (bannerURL) {
      embed.setImage(bannerURL);
    }

    await message.channel.send({ embeds: [embed] });
  }
};
