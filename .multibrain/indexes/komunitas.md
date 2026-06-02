# Komunitas Bucket

## Commands
- `userinfo.js` — 15+ field profile embed. Self-check (full details) vs others (limited)
- `serverinfo.js` — Server details embed
- `cuaca.js` — Weather embed via wttr.in (free, no API key). Shows temp, feels-like, condition emoji, humidity, wind, visibility, UV, sunrise/sunset
- `sellers.js` / `addseller.js` / `delseller.js` — Trusted seller list CRUD via `guildConfig.js`
- `ocr.js` — OCR via Tesseract.js (eng+ind), reply/upload image, confidence score

## Key Decisions
- wttr.in for weather (free, no API key, no rate limits)
- Guild config stored in `src/guild-settings.json`
- Seller list per-guild with optional notes
- Tesseract.js v5 — pure JS, offline, free. First run download ~10MB (eng+ind). Slower but zero deps.
- OCR silent logger — no console spam; confidence shown in embed footer

## Files
- `src/commands/userinfo.js`
- `src/commands/serverinfo.js`
- `src/commands/cuaca.js`
- `src/commands/sellers.js`
- `src/commands/addseller.js`
- `src/commands/delseller.js`
- `src/commands/ocr.js`
