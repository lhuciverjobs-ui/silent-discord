const assert = require('node:assert');
const { test } = require('node:test');
const { ChannelType } = require('discord.js');

const guildMemberAdd = require('../src/events/guildMemberAdd');
const guildMemberRemove = require('../src/events/guildMemberRemove');
const setwelcome = require('../src/commands/setwelcome');
const setgoodbye = require('../src/commands/setgoodbye');

test('welcome event sends embed to configured channel', async () => {
  const sent = [];
  const channel = {
    type: ChannelType.GuildText,
    send: async (payload) => sent.push(payload)
  };

  const member = {
    user: {
      tag: 'User#0001',
      displayAvatarURL: () => 'https://example.com/avatar.png'
    },
    guild: {
      id: 'guild1',
      name: 'Test Server',
      channels: {
        cache: {
          get: (id) => (id === 'ch-welcome' ? channel : null)
        }
      }
    }
  };

  const guildConfig = {
    getSettings: () => ({ welcomeChannelId: 'ch-welcome' })
  };

  await guildMemberAdd.execute(member, null, { guildConfig, WELCOME_CHANNEL_ID: 'ch-welcome' });

  assert.strictEqual(sent.length, 1);
  assert.strictEqual(sent[0].embeds[0].data.title, 'Selamat Datang!');
  assert.strictEqual(sent[0].embeds[0].data.footer.text, 'Selamat bergabung!');
});

test('goodbye event sends embed to configured channel', async () => {
  const sent = [];
  const channel = {
    type: ChannelType.GuildText,
    send: async (payload) => sent.push(payload)
  };

  const member = {
    user: {
      tag: 'User#0001',
      displayAvatarURL: () => 'https://example.com/avatar.png'
    },
    guild: {
      id: 'guild1',
      channels: {
        cache: {
          get: (id) => (id === 'ch-goodbye' ? channel : null)
        }
      }
    }
  };

  const guildConfig = {
    getSettings: () => ({ goodbyeChannelId: 'ch-goodbye' })
  };

  await guildMemberRemove.execute(member, null, { guildConfig });

  assert.strictEqual(sent.length, 1);
  assert.strictEqual(sent[0].embeds[0].data.title, 'Sampai Jumpa!');
  assert.ok(sent[0].embeds[0].data.description.includes('telah meninggalkan server'));
});

test('setwelcome command stores welcome channel id', async () => {
  let saved = null;
  const channel = { type: ChannelType.GuildText, id: 'ch-123', toString: () => '<#ch-123>' };
  const guildConfig = { setSetting: (guildId, key, value) => { saved = { guildId, key, value }; } };
  const message = {
    mentions: { channels: { first: () => channel } },
    guild: { id: 'guild1', channels: { cache: new Map() } },
    channel: { id: 'ch-001' },
    reply: async () => {}
  };

  await setwelcome.execute(message, [], { guildConfig });

  assert.deepStrictEqual(saved, { guildId: 'guild1', key: 'welcomeChannelId', value: 'ch-123' });
});

test('setgoodbye command stores goodbye channel id', async () => {
  let saved = null;
  const channel = { type: ChannelType.GuildText, id: 'ch-456', toString: () => '<#ch-456>' };
  const guildConfig = { setSetting: (guildId, key, value) => { saved = { guildId, key, value }; } };
  const message = {
    mentions: { channels: { first: () => channel } },
    guild: { id: 'guild1', channels: { cache: new Map() } },
    channel: { id: 'ch-002' },
    reply: async () => {}
  };

  await setgoodbye.execute(message, [], { guildConfig });

  assert.deepStrictEqual(saved, { guildId: 'guild1', key: 'goodbyeChannelId', value: 'ch-456' });
});
