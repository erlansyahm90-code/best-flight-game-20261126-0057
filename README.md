# Archipelago Air

[![make.fun](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/c/best-flight-game-20261126-0057/)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/erlansyahm90-code/best-flight-game-20261126-0057/rank.svg)](https://make.fun/c/best-flight-game-20261126-0057/)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/erlansyahm90-code/best-flight-game-20261126-0057/reward.svg)](https://make.fun/c/best-flight-game-20261126-0057/)

Game terbang low-poly di atas kepulauan tropis Indonesia — dibuat untuk kompetisi
[Make the best flight game](https://make.fun/c/best-flight-game-20261126-0057/) di make.fun.

## Cara main

Buka `game/index.html` lewat server statis apa pun (mis. `node serve.ts`, lalu
http://localhost:8080). Game berjalan offline penuh — tanpa network request.

- **W/S** — throttle naik/turun
- **A/D** — belok dengan banking
- **↑/↓** — pitch naik/turun
- **V** — ganti kamera chase/kokpit
- **R** — ulang misi
- **1/2/3** — pilih misi, **0** — terbang bebas

Di HP tersedia tombol sentuh di layar.

## Tiga misi

1. **Ring Run** — tembus 8 ring emas di atas Teluk Banda.
2. **Volcano Survey** — lingkari kawah Gunung Api dua putaran di ketinggian aman.
3. **Final Landing** — mendarat di runway Pulau Utama; kecepatan dan sudut dinilai.

Bahan bakar berkurang selama terbang, kerusakan naik saat benturan, dan kecepatan
terlalu rendah membuat pesawat stall lalu jatuh. HUD menampilkan kecepatan,
heading/kompas, ketinggian, bahan bakar, kerusakan, skor misi, dan timer.

## Struktur

- `game/index.html`, `game/style.css` — halaman + HUD
- `game/plane.js` — model pesawat propeller
- `game/terrain.js` — kepulauan, gunung berapi, runway, ring
- `game/physics.js` — terbang, lift/stall, tabrakan, bahan bakar, kerusakan
- `game/hud.js` — instrumen + banner landing/crash
- `game/missions.js` — 3 misi + skor
- `game/main.js` — loop, input keyboard/sentuh, kamera
- `game/vendor/three/` — Three.js (MIT) yang di-vendor
- `main.ts` — program penyerahan (menulis `/output/dossier.json`)
- `screenshots/` — 4 screenshot asli dari game yang berjalan

## Lisensi

MIT — lihat `LICENSE`.
