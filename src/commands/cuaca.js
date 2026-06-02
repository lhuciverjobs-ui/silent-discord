const { EmbedBuilder } = require('discord.js');

const WTTR_URL = 'https://wttr.in';

// ─── Weather condition → emoji mapping ─────────────────────────────────

const WEATHER_EMOJIS = {
  sunny: '☀️',
  clear: '🌙',
  cloudy: '☁️',
  overcast: '☁️',
  partly: '⛅',
  fog: '🌫️',
  mist: '🌫️',
  rain: '🌧️',
  drizzle: '🌦️',
  light: '🌦️',
  heavy: '🌧️',
  thunder: '⛈️',
  snow: '❄️',
  sleet: '🌨️',
  hail: '🌨️',
  wind: '💨',
  hot: '🔥',
  default: '🌤️',
};

function getWeatherEmoji(desc) {
  if (!desc) return WEATHER_EMOJIS.default;
  const d = desc.toLowerCase();
  for (const [key, emoji] of Object.entries(WEATHER_EMOJIS)) {
    if (d.includes(key)) return emoji;
  }
  return WEATHER_EMOJIS.default;
}

function getUVLevel(index) {
  const i = parseInt(index) || 0;
  if (i <= 2) return '🟢 Rendah';
  if (i <= 5) return '🟡 Sedang';
  if (i <= 7) return '🟠 Tinggi';
  if (i <= 10) return '🔴 Sangat Tinggi';
  return '🟣 Ekstrem';
}

// ─── Weather API ────────────────────────────────────────────────────────

async function getWeather(city) {
  const url = `${WTTR_URL}/${encodeURIComponent(city)}?format=j1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  if (!data?.current_condition?.length) {
    throw new Error('Kota tidak ditemukan.');
  }

  const current = data.current_condition[0];
  const area = data.nearest_area?.[0] || {};
  const weather = data.weather?.[0] || {};
  const astronomy = weather.astronomy?.[0] || {};

  return {
    city: area.areaName?.[0]?.value || city,
    region: area.region?.[0]?.value || '',
    country: area.country?.[0]?.value || '',
    temp: current.temp_C,
    feelsLike: current.FeelsLikeC,
    condition: current.weatherDesc?.[0]?.value || 'Tidak diketahui',
    humidity: current.humidity,
    windSpeed: current.windspeedKmph,
    windDir: current.winddir16Point,
    visibility: current.visibility,
    uvIndex: current.uvIndex,
    pressure: current.pressure,
    cloudCover: current.cloudcover,
    sunrise: astronomy.sunrise || 'N/A',
    sunset: astronomy.sunset || 'N/A',
    moonPhase: astronomy.moon_phase || 'N/A',
    emoji: getWeatherEmoji(current.weatherDesc?.[0]?.value),
  };
}

// ─── Format helpers ─────────────────────────────────────────────────────

function windDescription(speed) {
  const s = parseInt(speed) || 0;
  if (s < 5) return 'Tenang';
  if (s < 20) return 'Sedang';
  if (s < 40) return 'Kencang';
  if (s < 60) return 'Kuat';
  return 'Badai';
}

// ─── Command ────────────────────────────────────────────────────────────

module.exports = {
  name: 'cuaca',
  description: 'Cek cuaca kota. Contoh: !cuaca jakarta, !cuaca surabaya, !cuaca new york',
  async execute(message, args) {
    if (!args.length) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor('#F1C40F')
          .setTitle('🌤️ Cara Pakai !cuaca')
          .setDescription(
            'Cek kondisi cuaca terkini.\n\n'
            + '**Format:** `!cuaca <nama_kota>`\n\n'
            + '**Contoh:**\n'
            + '`!cuaca jakarta`\n'
            + '`!cuaca surabaya`\n'
            + '`!cuaca new york`\n'
            + '`!cuaca tokyo`\n'
            + '`!cuaca london`'
          )
          .setTimestamp()],
      });
    }

    const city = args.join(' ');
    const msg = await message.reply({ content: `🌤️ **Mengecek cuaca ${city}...**`, fetchReply: true });

    try {
      const w = await getWeather(city);

      const tempColor = parseInt(w.temp) > 35 ? 0xEF4444
        : parseInt(w.temp) > 28 ? 0xF97316
        : parseInt(w.temp) > 20 ? 0x10B981
        : parseInt(w.temp) > 10 ? 0x3B82F6
        : 0x8B5CF6;

      const embed = new EmbedBuilder()
        .setColor(tempColor)
        .setTitle(`${w.emoji} Cuaca — ${w.city}${w.region ? ', ' + w.region : ''}`)
        .setDescription(w.country ? `📍 ${w.country}` : null)
        .addFields(
          {
            name: '🌡️ Suhu',
            value: `**${w.temp}°C** *(terasa ${w.feelsLike}°C)*`,
            inline: true,
          },
          {
            name: '☁️ Kondisi',
            value: `${w.emoji} ${w.condition}`,
            inline: true,
          },
          {
            name: '💧 Kelembaban',
            value: `${w.humidity}%`,
            inline: true,
          },
          {
            name: '🌬️ Angin',
            value: `${w.windSpeed} km/j (${w.windDir}) — ${windDescription(w.windSpeed)}`,
            inline: true,
          },
          {
            name: '👁️ Visibilitas',
            value: `${w.visibility} km`,
            inline: true,
          },
          {
            name: '☀️ UV Index',
            value: `${w.uvIndex} — ${getUVLevel(w.uvIndex)}`,
            inline: true,
          }
        );

      // Second row
      embed.addFields(
        {
          name: '☁️ Tutupan Awan',
          value: `${w.cloudCover}%`,
          inline: true,
        },
        {
          name: '🔽 Tekanan',
          value: `${w.pressure} hPa`,
          inline: true,
        },
        {
          name: '🌙 Fase Bulan',
          value: w.moonPhase,
          inline: true,
        }
      );

      // Sunrise/Sunset row
      embed.addFields({
        name: '🌅 Waktu Matahari',
        value: `Terbit: **${w.sunrise}**  •  Terbenam: **${w.sunset}**`,
      });

      embed
        .setFooter({ text: `Data: wttr.in • ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB` })
        .setTimestamp();

      await msg.edit({ content: '', embeds: [embed] });
    } catch (err) {
      console.error('❌ Error !cuaca:', err.message);
      await msg.edit({
        content: '',
        embeds: [new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('❌ Gagal Cek Cuaca')
          .setDescription(`Tidak bisa dapet data cuaca untuk \`${city}\`.\nError: \`${err.message}\`\nCoba kota lain atau pastikan nama kota benar.`)],
      }).catch(() => {});
    }
  },
};
