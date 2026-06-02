# Community Discord Bot Template

Template bot Discord berbasis Node.js yang fokus ke komunitas dengan tampilan embed modern dan fitur yang mudah dikustom.

## Fitur

- Sistem perintah prefix fleksibel
- Embed announcement khusus komunitas
- Poll interaktif dengan emoji
- Info server bergaya embed
- Sambutan welcome otomatis

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Salin `.env.example` menjadi `.env` dan isi token bot:
   ```env
   BOT_TOKEN=your_discord_bot_token
   PREFIX=!
   WELCOME_CHANNEL_ID=123456789012345678
   ```
3. Jalankan bot:
   ```bash
   npm start
   ```

> Catatan: fitur auto-restart (`nodemon`) telah dihapus. Jika ingin menambahkan kembali, jalankan `npm install --save-dev nodemon` dan gunakan `npm run dev`.

## Perintah

- `!announce <judul> | <pesan>`: mengirim pengumuman bergaya embed
- `!poll <pertanyaan> | <opsi1> | <opsi2> ...`: membuat jajak pendapat
- `!serverinfo`: menampilkan informasi server
- `!userinfo [@user]`: menampilkan profil pengguna dengan embed yang unik
- `!testwelcome`: preview welcome embed di channel saat ini
- `!testgoodbye`: preview goodbye embed di channel saat ini
- `!kick @user [alasan]`: kick anggota dari server (butuh izin Kick Members)
- `!ban @user [alasan]`: ban anggota dari server (fitur opsional)
- `!setwelcome [#channel]`: atur channel welcome otomatis untuk server ini
- `!setgoodbye [#channel]`: atur channel goodbye otomatis untuk server ini

> Kustomisasi `src/index.js`, `src/events`, dan `src/commands` sesuai kebutuhan komunitas Anda.
