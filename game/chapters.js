// Toy Plane — chapters.js
// Data tiga bab cerita "PESAWAT MAINAN DI DALAM RUMAH" + terbang bebas.
// DOKTRIN RING (keputusan final user, Rev7): ring duduk PERSIS di garis
// cerita alami lintasan — lurus → lengkung mulus → lurus, seperti manik
// di tali. Ring = +100 poin + checkpoint/respawn. TIDAK ada ring geser
// demi kesulitan, TIDAK ada ring dekat rintangan; variasi rute datang
// dari ruangan/dunianya, bukan dari penempatan ring.
// Bab 2 memakai posisi Rev7 persis (CP3 (70,50,13) di busur lengkungnya).
import * as THREE from 'three';

const v = (x, y, z) => new THREE.Vector3(x, y, z);

export const CHAPTERS = {
  1: {
    id: 1, world: 1,
    label: 'BAB 1',
    title: 'KAMAR ANAK',
    name: 'BAB 1 — KAMAR ANAK',
    story: 'Pagi yang cerah di kamar anak. Kamu adalah pesawat mainan kesayangan — dan hari ini kamu belajar terbang! Lepas landas dari meja belajar, kelilingi kasur raksasa, balok-balok huruf, dan rel kereta mainan, kumpulkan kelima ring, lalu pulang mendarat di meja belajar sebelum pemilikmu bangun.',
    objective: 'Kumpulkan 5 ring keliling kamar, lalu mendarat kembali di meja belajar!',
    spawn: { pos: v(-318, 29.2, 0), heading: 270 },
    initialThrottle: 0.7, initialSpeed: 58,
    rings: [
      v(-195, 38, 0),    // lurus di atas karpet, keluar dari meja belajar
      v(-30, 40, -95),   // belok mulus ke arah kasur
      v(150, 44, -125),  // di atas kasur raksasa (bantal top 31 — aman)
      v(205, 38, 25),    // turun ke tengah kamar
      v(30, 34, 130),    // di atas rel kereta mainan, lalu pulang ke barat
    ],
    finish: {
      type: 'land', zoneName: 'meja-belajar', bonus: 200,
      target: v(-285, 28, 0), respawnTarget: v(-285, 27, 0),
      hint: 'Mendarat di meja belajar →',
      text: 'SELESAI — MENDARAT DI MEJA BELAJAR!',
    },
  },
  2: {
    id: 2, world: 2,
    label: 'BAB 2',
    title: 'KABUR DARI RUMAH',
    name: 'BAB 2 — KABUR DARI RUMAH',
    story: 'Siang harinya pintu kamar terbuka — dan kamu kabur! Terbang melintasi ruang keluarga dan dapur raksasa, menyelinap keluar lewat jendela di dinding selatan, lalu mendarat di istana pasir di halaman. Jangan sampai ketahuan!',
    objective: 'Lepas landas dari meja makan, kumpulkan 5 ring, keluar lewat jendela selatan, mendarat di istana pasir!',
    spawn: { pos: v(-318, 29.2, 0), heading: 270 },
    initialThrottle: 0.7, initialSpeed: 58,
    // Posisi Rev7 persis: CP1–CP2 garis lurus poros meja, CP3 di busur
    // lengkung (pusat (10,140), R=140), CP4 tengah bukaan jendela,
    // CP5 di poros istana pasir. Cek tabrakan penuh di BUILD-NOTES Rev7.
    rings: [
      v(-195, 39, 0),
      v(-10, 47, 0),
      v(70, 50, 13),
      v(150, 59, 196),
      v(165, 30, 290),
    ],
    ringToasts: { 3: 'CHECKPOINT 4/5! +100 — KELUAR JENDELA, MENUJU ISTANA PASIR!' }, // CP4 = tengah bukaan jendela
    finish: {
      type: 'flare',
      zone: { x0: 120, x1: 210, z0: 310, z1: 380, top: 3 },
      landZoneName: 'pasir', bonus: 200,
      target: v(190, 10, 360), respawnTarget: v(165, 5, 345),
      hint: 'Mendarat di istana pasir →',
      text: 'SELESAI — MENDARAT DI ISTANA PASIR!',
    },
  },
  3: {
    id: 3, world: 3,
    label: 'BAB 3',
    title: 'TAMAN BERMAIN ANAK',
    name: 'BAB 3 — TAMAN BERMAIN ANAK',
    story: 'Besoknya kamu dibawa ke taman bermain anak. Ayunan berayun, perosotan menjulang, dan putaran berputar tanpa henti. Slalom di antara dua set ayunan, kumpulkan kelima ring, dan mendaratlah di atas putaran yang berputar — akhir petualangan yang sempurna!',
    objective: 'Slalom lewat celah ayunan, kumpulkan 5 ring, lalu mendarat di putaran yang berputar!',
    spawn: { pos: v(-318, 27.2, 0), heading: 270 },
    initialThrottle: 0.7, initialSpeed: 58,
    rings: [
      v(-195, 32, 55),   // di sumbu ayunan A, barat set A — masuk lurus searah palang
      v(-80, 24, 55),    // celah ayunan A: di bawah palang (32), di antara dudukan
      v(58, 24, -50),    // sapuan lebar menyeberang rumput ke celah ayunan B
      v(180, 36, 120),   // naik di samping menara perosotan (di luar menaranya)
      v(172, 24, 185),   // turun mendekati putaran
    ],
    finish: {
      type: 'flare',
      zone: { x0: 149, x1: 201, z0: 209, z1: 261, top: 9 },
      landZoneName: 'putaran', bonus: 200,
      target: v(175, 12, 235), respawnTarget: v(175, 11, 235),
      hint: 'Mendarat di putaran yang berputar →',
      text: 'SELESAI — MENDARAT DI PUTARAN!',
    },
  },
};

// Terbang bebas: dunia rumah, tanpa ring — jelajahi sesuka hati.
export const FREE_FLIGHT = {
  id: 0, world: 2,
  name: 'TERBANG BEBAS',
  objective: 'Jelajahi rumah raksasa. Jaga bahan bakar!',
  spawn: { pos: v(-255, 42, 105), heading: 270 },
  initialThrottle: 0.7, initialSpeed: 58,
};
