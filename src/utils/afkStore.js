/**
 * afkStore.js — JSON-file AFK storage
 */
const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'afk-store.json');

function readStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return {};
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeStore(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  setAFK(userId, reason) {
    const store = readStore();
    store[userId] = {
      reason: reason || 'Lagi AFK',
      since: Date.now(),
    };
    writeStore(store);
    return store[userId];
  },

  removeAFK(userId) {
    const store = readStore();
    const data = store[userId];
    if (data) {
      delete store[userId];
      writeStore(store);
      return data;
    }
    return null;
  },

  getAFK(userId) {
    const store = readStore();
    return store[userId] || null;
  },

  isAFK(userId) {
    const store = readStore();
    return !!store[userId];
  },

  getAllAFK() {
    return readStore();
  },

  /** Format duration from timestamp to human readable */
  formatDuration(since) {
    const diff = Date.now() - since;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds} detik`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} menit ${seconds % 60} detik`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} jam ${mins % 60} menit`;
    const days = Math.floor(hrs / 24);
    return `${days} hari ${hrs % 24} jam`;
  },
};
