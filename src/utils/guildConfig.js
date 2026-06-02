const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'guild-settings.json');

function loadConfig() {
  try {
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify({}, null, 2));
      return {};
    }
    const fileData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(fileData || '{}');
  } catch (error) {
    console.error('Gagal memuat konfigurasi guild:', error);
    return {};
  }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Gagal menyimpan konfigurasi guild:', error);
  }
}

const config = loadConfig();

module.exports = {
  getSettings(guildId) {
    return config[guildId] || {};
  },

  setSetting(guildId, key, value) {
    if (!config[guildId]) {
      config[guildId] = {};
    }
    config[guildId][key] = value;
    saveConfig(config);
  },

  deleteSetting(guildId, key) {
    if (config[guildId] && Object.prototype.hasOwnProperty.call(config[guildId], key)) {
      delete config[guildId][key];
      saveConfig(config);
    }
  },

  // ─── Seller management ─────────────────────────────────────

  getSellers(guildId) {
    return config[guildId]?.sellers || [];
  },

  addSeller(guildId, userId, addedBy, notes = '') {
    if (!config[guildId]) config[guildId] = {};
    if (!config[guildId].sellers) config[guildId].sellers = [];
    // Avoid duplicates
    config[guildId].sellers = config[guildId].sellers.filter(s => s.userId !== userId);
    config[guildId].sellers.push({ userId, addedBy, notes, addedAt: Date.now() });
    saveConfig(config);
  },

  removeSeller(guildId, userId) {
    if (!config[guildId]?.sellers) return false;
    const before = config[guildId].sellers.length;
    config[guildId].sellers = config[guildId].sellers.filter(s => s.userId !== userId);
    if (config[guildId].sellers.length !== before) {
      saveConfig(config);
      return true;
    }
    return false;
  },

  // ─── Seller role ─────────────────────────────────────────

  getSellerRoleId(guildId) {
    return config[guildId]?.sellerRoleId || null;
  },

  setSellerRoleId(guildId, roleId) {
    if (!config[guildId]) config[guildId] = {};
    config[guildId].sellerRoleId = roleId;
    saveConfig(config);
  },

  clearSellerRoleId(guildId) {
    if (config[guildId]) {
      delete config[guildId].sellerRoleId;
      saveConfig(config);
    }
  },

  // ─── Jam image ──────────────────────────────────────────

  getJamImage(guildId) {
    return config[guildId]?.jamImage || null;
  },

  setJamImage(guildId, url) {
    if (!config[guildId]) config[guildId] = {};
    config[guildId].jamImage = url;
    saveConfig(config);
  },

  clearJamImage(guildId) {
    if (config[guildId]) {
      delete config[guildId].jamImage;
      saveConfig(config);
    }
  }
};
