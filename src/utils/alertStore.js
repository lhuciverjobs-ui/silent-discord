const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'alerts.json');

let alerts = {};

function load() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      alerts = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8') || '{}');
    } else {
      alerts = {};
      save();
    }
  } catch {
    alerts = {};
    save();
  }
}

function save() {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(alerts, null, 2));
  } catch { /* ignore */ }
}

load();

module.exports = {
  addAlert(userId, channelId, coinId, coinSymbol, coinName, condition, targetPrice) {
    if (!alerts[userId]) alerts[userId] = [];
    const id = `${userId}-${Date.now()}`;
    alerts[userId].push({
      id,
      channelId,
      coinId,
      coinSymbol: coinSymbol.toUpperCase(),
      coinName,
      condition,     // 'above' | 'below'
      targetPrice,
      createdAt: Date.now(),
      triggered: false,
    });
    save();
    return id;
  },

  removeAlert(userId, alertId) {
    if (!alerts[userId]) return false;
    const idx = alerts[userId].findIndex(a => a.id === alertId);
    if (idx === -1) return false;
    alerts[userId].splice(idx, 1);
    if (alerts[userId].length === 0) delete alerts[userId];
    save();
    return true;
  },

  getUserAlerts(userId) {
    return alerts[userId] || [];
  },

  getAllActiveAlerts() {
    const result = [];
    for (const userId of Object.keys(alerts)) {
      for (const alert of alerts[userId]) {
        if (!alert.triggered) result.push({ userId, ...alert });
      }
    }
    return result;
  },

  markTriggered(userId, alertId) {
    if (!alerts[userId]) return;
    const alert = alerts[userId].find(a => a.id === alertId);
    if (alert) {
      alert.triggered = true;
      save();
    }
  },

  deleteTriggeredAlerts() {
    for (const userId of Object.keys(alerts)) {
      alerts[userId] = alerts[userId].filter(a => !a.triggered);
      if (alerts[userId].length === 0) delete alerts[userId];
    }
    save();
  },
};
