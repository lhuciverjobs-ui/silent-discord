/**
 * JamClock — generator gambar jam real-time untuk UTC, WIB, WITA, WIT.
 * Output: PNG buffer siap attach ke Discord.
 */
const { createCanvas } = require('canvas');

const W = 680;
const H = 320;
const RADIUS = 85;
const CENTER_Y = 145;
const LABELS = [
  { name: 'UTC',  offset: 0,  color: '#3498DB', textColor: '#85C1E9' },
  { name: 'WIB',  offset: 7,  color: '#2ECC71', textColor: '#82E0AA' },
  { name: 'WITA', offset: 8,  color: '#F1C40F', textColor: '#F7DC6F' },
  { name: 'WIT',  offset: 9,  color: '#E74C3C', textColor: '#F1948A' },
];

function getPositions() {
  const gap = (W - LABELS.length * RADIUS * 2) / (LABELS.length + 1);
  return LABELS.map((_, i) => gap + i * (RADIUS * 2 + gap) + RADIUS);
}

function drawHand(ctx, cx, cy, angle, length, width, color) {
  const a = (angle - 90) * Math.PI / 180;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + length * Math.cos(a), cy + length * Math.sin(a));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function drawClockFace(ctx, cx, cy, r, h, m, s, accentColor) {
  // Background
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, '#2c2c3a');
  grad.addColorStop(1, '#1a1a2e');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Border glow
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = accentColor + '66'; // 40% opacity
  ctx.lineWidth = 4;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
  ctx.strokeStyle = accentColor + '33';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Hour markers (bold)
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 - 90) * Math.PI / 180;
    const isMain = i % 3 === 0;
    const inner = r * (isMain ? 0.78 : 0.82);
    const outer = r * 0.92;
    ctx.beginPath();
    ctx.moveTo(cx + inner * Math.cos(a), cy + inner * Math.sin(a));
    ctx.lineTo(cx + outer * Math.cos(a), cy + outer * Math.sin(a));
    ctx.strokeStyle = i % 3 === 0 ? accentColor : '#ffffff88';
    ctx.lineWidth = isMain ? 3 : 1.5;
    ctx.stroke();
  }

  // Hour hand
  const ha = (h % 12 * 30 + m * 0.5 - 90) * Math.PI / 180;
  const hl = r * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - hl * 0.15 * Math.cos(ha + Math.PI), cy - hl * 0.15 * Math.sin(ha + Math.PI));
  ctx.lineTo(cx + hl * Math.cos(ha), cy + hl * Math.sin(ha));
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Minute hand
  const ma = (m * 6 + s * 0.1 - 90) * Math.PI / 180;
  const ml = r * 0.68;
  ctx.beginPath();
  ctx.moveTo(cx - ml * 0.1 * Math.cos(ma + Math.PI), cy - ml * 0.1 * Math.sin(ma + Math.PI));
  ctx.lineTo(cx + ml * Math.cos(ma), cy + ml * Math.sin(ma));
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Second hand
  const sa = (s * 6 - 90) * Math.PI / 180;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.15 * Math.cos(sa + Math.PI), cy - r * 0.15 * Math.sin(sa + Math.PI));
  ctx.lineTo(cx + r * 0.78 * Math.cos(sa), cy + r * 0.78 * Math.sin(sa));
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = accentColor;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

function pad(n) { return String(n).padStart(2, '0'); }

function generateClockImage() {
  const now = new Date();
  const positions = getPositions();
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#0f0f1a');
  bgGrad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Decorative line
  ctx.fillStyle = '#ffffff12';
  ctx.fillRect(0, 48, W, 1);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🕐  WAKTU SEKARANG', W / 2, 24);

  // Draw clocks
  for (let i = 0; i < LABELS.length; i++) {
    const { name, offset, color, textColor } = LABELS[i];
    const cx = positions[i];

    const h = (now.getUTCHours() + offset + 24) % 24;
    const m = now.getUTCMinutes();
    const s = now.getUTCSeconds();

    drawClockFace(ctx, cx, CENTER_Y, RADIUS, h, m, s, color);

    // Timezone name
    ctx.fillStyle = textColor;
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, cx, CENTER_Y + RADIUS + 24);

    // Digital time
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText(`${pad(h)}:${pad(m)}:${pad(s)}`, cx, CENTER_Y + RADIUS + 54);

    // Color dot indicator
    ctx.beginPath();
    ctx.arc(cx - 60, CENTER_Y + RADIUS + 24, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // UTC offset text
    ctx.fillStyle = '#ffffff66';
    ctx.font = '11px Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(`UTC${offset >= 0 ? '+' : ''}${offset}`, cx, CENTER_Y + RADIUS + 76);
  }

  // Footer date
  const utcNow = new Date(now.getTime());
  const dateStr = utcNow.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Asia/Jakarta'
  });
  ctx.fillStyle = '#ffffff44';
  ctx.font = '12px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${dateStr}  •  WIB`, W / 2, H - 14);

  return canvas.toBuffer('image/png');
}

module.exports = { generateClockImage };
