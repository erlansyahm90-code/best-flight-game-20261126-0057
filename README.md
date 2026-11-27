# Toy Plane — Pesawat Mainan di Dalam Rumah

[![make.fun](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/c/best-flight-game-20261126-0057/)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/erlansyahm90-code/best-flight-game-20261126-0057/rank.svg)](https://make.fun/c/best-flight-game-20261126-0057/)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/erlansyahm90-code/best-flight-game-20261126-0057/reward.svg)](https://make.fun/c/best-flight-game-20261126-0057/)

Game terbang 3D bercerita: kamu adalah **pesawat mainan** di dunia raksasa —
dibuat untuk kompetisi
[Make the best flight game](https://make.fun/c/best-flight-game-20261126-0057/) di make.fun.
Resubmit Rev8 menggantikan v1 "Archipelago Air" dengan konsep baru tiga bab.

## Cara main

Buka `game/index.html` lewat server statis apa pun (mis. `node serve.ts`, lalu
http://localhost:8080). Game berjalan offline penuh — tanpa network request.

- **W/S** — throttle naik/turun
- **A/D** — belok dengan banking
- **↑/↓** — pitch naik/turun
- **V** — ganti kamera chase/kokpit
- **R** — lanjut dari checkpoint terakhir (atau ulangi bab)
- **1/2/3** — pilih bab, **0** — terbang bebas, **Enter** — mulai bab terpilih

Di HP tersedia tombol sentuh di layar.

## Tiga bab cerita

Setiap bab: lepas landas, kumpulkan **5 ring checkpoint** (+100 per ring;
ring yang sudah lewat berubah hijau permanen; crash = lanjut dari ring
terakhir, skor tidak hilang), lalu finis khas bab (+200). Skor penuh 700.

1. **Bab 1 — Kamar Anak** 🧸 Belajar terbang: kelilingi kasur raksasa,
   balok huruf, dan rel kereta mainan, lalu pulang **mendarat di meja belajar**.
2. **Bab 2 — Kabur dari Rumah** 🪟 Melintasi ruang keluarga & dapur raksasa,
   keluar lewat **jendela dinding selatan**, dan mendarat di **istana pasir**
   di halaman.
3. **Bab 3 — Taman Bermain Anak** 🎠 **Slalom di celah dua set ayunan**,
   lewat menara perosotan, dan mendarat di **putaran (merry-go-round) yang berputar**.

Plus mode **Terbang Bebas** menjelajahi rumah raksasa tanpa ring.

Ring selalu duduk persis di garis cerita alami lintasan (lurus → lengkung
mulus → lurus, seperti manik di tali) — variasi rute datang dari ruang dan
dunianya, bukan dari ring yang digeser. Bahan bakar berkurang selama terbang,
kerusakan naik saat benturan, dan kecepatan terlalu rendah membuat pesawat
stall lalu jatuh. HUD menampilkan kecepatan, heading/kompas, ketinggian,
bahan bakar, kerusakan, skor, dan timer.

## Struktur

- `game/index.html`, `game/style.css` — halaman, menu pilih bab, selingan cerita, HUD
- `game/plane.js` — model pesawat mainan + ring checkpoint
- `game/chapters.js` — data tiga bab: cerita, spawn, posisi ring, aturan finis
- `game/worlds.js` — registri/dispatcher tiga dunia (tabrakan, zona pendaratan, langit-langit)
- `game/bedroom.js` — dunia Bab 1: kamar anak (meja belajar, kasur raksasa, balok huruf, rel kereta)
- `game/terrain.js` — dunia Bab 2: interior rumah raksasa + halaman & istana pasir
- `game/playground.js` — dunia Bab 3: taman bermain (ayunan slalom, perosotan, putaran berputar)
- `game/physics.js` — terbang, lift/stall, tabrakan, bahan bakar, kerusakan, nilai landing
- `game/hud.js` — instrumen + banner akhir
- `game/missions.js` — mesin misi generik: ring, checkpoint respawn, finis per bab
- `game/main.js` — loop, alur bab & cerita, input keyboard/sentuh, kamera
- `game/vendor/three/` — Three.js (MIT) yang di-vendor
- `main.ts` — program penyerahan (menulis `/output/dossier.json`)
- `screenshots/` — 4 screenshot asli dari game yang berjalan

## Lisensi

MIT — lihat `LICENSE`.
