// Toy Plane — terrain.js — DUNIA BAB 2 "KABUR DARI RUMAH"
// Interior rumah raksasa dari sudut pandang pesawat mainan: ruang keluarga
// + dapur + halaman dengan bak pasir istana pasir.
// Satu sumber kebenaran tabrakan = terrainHeight(x, z): tinggi permukaan
// teratas di kolom itu (lantai 0, karpet 1.2, meja makan 26, dinding 120,
// ambang jendela 18 — pesawat terbang MELINTASI ambang lewat bukaan jendela).
// Posisi ring checkpoint Bab 2 ada di chapters.js (doktrin Rev7).
import * as THREE from 'three';

// Meja makan = "runway": lepas landas & mendarat di sini (dipakai physics.js)
export const RUNWAY = { x: -285, z: 0, halfLen: 55, halfWid: 20, headingDeg: 270, height: 26 };
export const CEILING_Y = 104; // plafon lunak — pesawat tidak bisa menembus langit-langit
export const WALL_TOP = 120;
// Target survei Misi 2: lampu gantung di atas karpet
export const SURVEY = { x: -180, z: 0, y: 86, minDist: 45, maxDist: 125, minAlt: 55 };
// Jendela keluar di DINDING SELATAN dapur (tegak lurus sumbu ambang pintu —
// sesudah masuk dapur pemain WAJIB belok ±90° ke selatan untuk mencapainya):
// bukaan x 118..182 pada bidang z = 196, ambang y 18, atas y 100.
export const WINDOW = { cx: 150, z: 196, halfWid: 32, sillY: 18, topY: 100 };
// Bak pasir FINIS di halaman selatan: permukaan pasir top 3; zona mendarat
// (land) adalah bagian pasir TANPA istana; istana pasir di sudut timur.
export const SANDBOX = {
  x0: 120, x1: 210, z0: 310, z1: 380, top: 3,
  land: { x0: 126, x1: 168, z0: 316, z1: 374 },
  castle: { x: 190, z: 360 },
};

// ---- Kotak tabrakan AABB: {x0, x1, z0, z1, top} ----
const BOXES = [
  // Dinding luar (top 120)
  { x0: -372, x1: -360, z0: -202, z1: 202, top: WALL_TOP },   // barat
  { x0: 300, x1: 312, z0: -202, z1: 202, top: WALL_TOP },     // timur (utuh — jendela pindah)
  { x0: -372, x1: 312, z0: -202, z1: -190, top: WALL_TOP },   // utara
  // Dinding selatan dengan JENDELA di sisi dapur (bukaan x 118..182, ambang y 18)
  { x0: -372, x1: 118, z0: 190, z1: 202, top: WALL_TOP },     // selatan (barat jendela)
  { x0: 182, x1: 312, z0: 190, z1: 202, top: WALL_TOP },      // selatan (timur jendela)
  { x0: 118, x1: 182, z0: 190, z1: 202, top: 18 },            // ambang jendela selatan
  // Dinding pembagi + ambang pintu lebar (gap z -38..38, terbuka sampai y 95)
  { x0: -15, x1: -5, z0: -202, z1: -38, top: WALL_TOP },
  { x0: -15, x1: -5, z0: 38, z1: 202, top: WALL_TOP },
  // Lantai & karpet
  { x0: -300, x1: -40, z0: -120, z1: 120, top: 1.2 },         // karpet ruang keluarga
  { x0: -28, x1: 8, z0: -26, z1: 26, top: 1.1 },              // keset merah di ambang pintu
  // Meja makan (RUNWAY) + kursi
  { x0: -340, x1: -230, z0: -20, z1: 20, top: RUNWAY.height },
  { x0: -314, x1: -296, z0: 24, z1: 42, top: 23 },            // kursi duduk
  { x0: -314, x1: -296, z0: -42, z1: -24, top: 23 },
  { x0: -267, x1: -249, z0: 24, z1: 42, top: 23 },
  { x0: -267, x1: -249, z0: -42, z1: -24, top: 23 },
  { x0: -314, x1: -296, z0: 38, z1: 42, top: 46 },             // sandaran kursi
  { x0: -314, x1: -296, z0: -42, z1: -38, top: 46 },
  { x0: -267, x1: -249, z0: 38, z1: 42, top: 46 },
  { x0: -267, x1: -249, z0: -42, z1: -38, top: 46 },
  // Sofa (utara) — dudukan, sandaran, lengan
  { x0: -245, x1: -145, z0: -188, z1: -138, top: 20 },
  { x0: -245, x1: -145, z0: -188, z1: -170, top: 38 },
  { x0: -245, x1: -232, z0: -170, z1: -138, top: 30 },
  { x0: -158, x1: -145, z0: -170, z1: -138, top: 30 },
  // Meja kopi di atas karpet
  { x0: -218, x1: -168, z0: -62, z1: -22, top: 14 },
  // Rak buku di dinding barat
  { x0: -358, x1: -332, z0: -45, z1: 95, top: 96 },
  // Tanaman pot raksasa (perkiraan kotak dari pot + daun)
  { x0: -62, x1: -22, z0: -162, z1: -122, top: 62 },
  // Lampu lantai di samping sofa
  { x0: -118, x1: -110, z0: -158, z1: -150, top: 58 },
  // Buku-buku raksasa tergeletak di lantai
  { x0: -142, x1: -96, z0: 38, z1: 86, top: 7 },               // buku merah
  { x0: -96, x1: -52, z0: -98, z1: -58, top: 6 },              // buku biru
  { x0: 168, x1: 214, z0: -64, z1: -22, top: 7 },              // buku hijau (dapur)
  // Kardus
  { x0: -72, x1: -34, z0: 88, z1: 126, top: 23 },
  // Dapur: counter sepanjang dinding utara + kulkas + pulau dapur
  { x0: 15, x1: 245, z0: -190, z1: -152, top: 30 },
  { x0: 248, x1: 296, z0: -188, z1: -142, top: 80 },
  { x0: 88, x1: 152, z0: 38, z1: 86, top: 28 },
  // Halaman selatan: bak pasir + istana pasir + pagar + batang pohon
  { x0: 120, x1: 210, z0: 310, z1: 380, top: 3 },             // permukaan pasir
  { x0: 174, x1: 206, z0: 342, z1: 378, top: 15 },            // istana pasir (rintangan)
  { x0: -160, x1: 460, z0: 640, z1: 648, top: 9 },            // pagar selatan
  { x0: -160, x1: -152, z0: 202, z1: 648, top: 9 },           // pagar barat
  { x0: 452, x1: 460, z0: 202, z1: 648, top: 9 },             // pagar timur
  { x0: 36, x1: 44, z0: 326, z1: 334, top: 26 },              // batang pohon halaman
  { x0: 306, x1: 314, z0: 326, z1: 334, top: 26 },
  { x0: 76, x1: 84, z0: 536, z1: 544, top: 26 },
  { x0: 296, x1: 304, z0: 556, z1: 564, top: 26 },
];

export function terrainHeight(x, z) {
  let h = 0;
  for (const b of BOXES) {
    if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1 && b.top > h) h = b.top;
  }
  return h;
}

export function isOverLand(x, z) {
  return terrainHeight(x, z) > 1.5;
}

// ---------- Pembangunan mesh ----------
function box(group, w, h, d, color, cx, cy, cz, opts = {}) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color, flatShading: !!opts.flat, emissive: opts.emissive || 0x000000 }),
  );
  m.position.set(cx, cy, cz);
  if (opts.ry) m.rotation.y = opts.ry;
  group.add(m);
  return m;
}
function cyl(group, rt, rb, h, color, cx, cy, cz, seg = 12) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(rt, rb, h, seg),
    new THREE.MeshLambertMaterial({ color, flatShading: true }),
  );
  m.position.set(cx, cy, cz);
  group.add(m);
  return m;
}

const WOOD = 0xa9743a, WOOD_DARK = 0x8a5a2a, WALL = 0xf6dfae, WALL_K = 0xf3d49b;
const CREAM = 0xfff3d6, RED = 0xc93b2e, TEAL = 0x2e8f86, ORANGE = 0xf08c1e;

export function buildTerrain(scene) {
  const g = new THREE.Group();
  g.name = 'HouseInterior';

  // --- Lantai kayu (dengan garis papan) ---
  box(g, 672, 2, 404, WOOD, -30, -1, 0);
  for (let i = 0; i < 15; i++) {
    box(g, 672, 0.3, 1.6, WOOD_DARK, -30, 0.05, -182 + i * 26);
  }
  // Plafon krem + balok kayu
  box(g, 672, 2, 404, 0xf9ecca, -30, 111, 0);
  for (let i = 0; i < 6; i++) box(g, 4, 3, 404, WOOD_DARK, -320 + i * 120, 109, 0);

  // --- Karpet ruang keluarga: krem di bawah, merah di atas ---
  box(g, 264, 1.0, 244, 0xe8dcc0, -170, 0.5, 0);
  box(g, 244, 1.2, 224, 0xc93b2e, -170, 0.6, 0);
  box(g, 120, 1.35, 100, 0xe8dcc0, -170, 0.65, 0);
  // Keset merah di ambang pintu (seperti referensi)
  box(g, 36, 1.1, 52, RED, -10, 0.55, 0);
  box(g, 28, 1.2, 44, CREAM, -10, 0.6, 0);

  buildWalls(g);
  buildLivingRoom(g);
  buildKitchen(g);
  buildGarden(g);
  scene.add(g);
  return g;
}

function buildWalls(g) {
  const H = 110, T = 12, cy = H / 2;
  // Barat & utara utuh; timur utuh (jendela sudah pindah ke selatan dapur)
  box(g, T, H, 404, WALL, -366, cy, 0);
  box(g, 684, H, T, WALL, -30, cy, -196);
  box(g, T, H, 404, WALL_K, 306, cy, 0);
  // Selatan: dua segmen dinding + bawah ambang + atas jendela (bukaan x 118..182, y 18..100)
  box(g, 490, H, T, WALL, -127, cy, 196);
  box(g, 130, H, T, WALL_K, 247, cy, 196);
  box(g, 64, 18, T, WALL_K, 150, 9, 196);
  box(g, 64, 10, T, WALL_K, 150, 105, 196);
  // Dinding pembagi (ambang pintu lebar z -38..38, terbuka penuh ke atas)
  box(g, 10, H, 152, WALL, -10, cy, -114);
  box(g, 10, H, 152, WALL, -10, cy, 114);
  box(g, 10, 15, 76, WALL, -10, 102.5, 0); // kusen atas pintu (visual, y 95..110)
  // Kusen jendela putih + palang silang di dinding selatan (bidang z=196)
  const FM = 0xffffff;
  box(g, 68, 4, 3, FM, 150, 19, 195);
  box(g, 68, 4, 3, FM, 150, 99, 195);
  box(g, 4, 82, 3, FM, 119, 59, 195);
  box(g, 4, 82, 3, FM, 181, 59, 195);
  box(g, 2.4, 82, 3, FM, 150, 59, 195);
  box(g, 64, 2.4, 3, FM, 150, 59, 195);
  // Gorden oranye-merah di sisi dalam dapur, kedua sisi jendela
  box(g, 13, 84, 4, 0xe2543e, 110, 58, 192);
  box(g, 13, 84, 4, 0xe2543e, 190, 58, 192);
  // Hiasan dinding ruang keluarga: lukisan + jam
  box(g, 44, 30, 1.5, TEAL, -150, 58, 189);
  box(g, 36, 22, 1.8, ORANGE, -150, 58, 189);
  box(g, 30, 38, 1.5, 0x7a4fa3, -70, 60, 189);
  cyl(g, 11, 11, 1.6, 0xffffff, -255, 66, 189, 20).rotation.x = Math.PI / 2;
}

function buildLivingRoom(g) {
  // --- Meja makan (RUNWAY): papan kayu + 4 kaki ---
  box(g, 114, 4, 44, 0x9c6a34, RUNWAY.x, RUNWAY.height - 2, 0);
  box(g, 118, 1.2, 48, 0xb57e42, RUNWAY.x, RUNWAY.height - 0.2, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(g, 5, RUNWAY.height - 4, 5, WOOD_DARK, RUNWAY.x + sx * 50, (RUNWAY.height - 4) / 2, sz * 17);
  }
  // Garis tengah landasan di atas meja (putih) — penanda arah lepas landas
  for (let dx = -44; dx <= 44; dx += 16) box(g, 9, 0.3, 2, 0xffffff, RUNWAY.x + dx, RUNWAY.height + 0.55, 0);
  // Piring & gelas raksasa di ujung meja (jangan ditabrak!)
  cyl(g, 9, 7, 1.6, 0xffffff, -248, RUNWAY.height + 0.8, 12, 16);
  cyl(g, 3.2, 2.6, 7, 0x9fd8ff, -240, RUNWAY.height + 3.5, -11, 10);

  // --- Kursi makan (4): dudukan + sandaran + kaki ---
  const chairAt = (cx, cz, flip) => {
    box(g, 18, 2.5, 18, 0x7a4a22, cx, 22, cz);
    box(g, 18, 24, 2.5, 0x7a4a22, cx, 34, cz + flip * 8);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      box(g, 2.4, 21, 2.4, WOOD_DARK, cx + sx * 7, 10.5, cz + sz * 7);
    }
  };
  chairAt(-305, 33, 1); chairAt(-305, -33, -1); chairAt(-258, 33, 1); chairAt(-258, -33, -1);

  // --- Sofa oranye: alas, sandaran, lengan, bantal ---
  box(g, 100, 14, 50, ORANGE, -195, 7, -163);
  box(g, 100, 38, 18, 0xd97a16, -195, 19, -179);
  box(g, 13, 30, 50, 0xd97a16, -238.5, 15, -163);
  box(g, 13, 30, 50, 0xd97a16, -151.5, 15, -163);
  box(g, 44, 6, 40, 0xffa63e, -219, 17, -160);
  box(g, 44, 6, 40, 0xffa63e, -171, 17, -160);
  box(g, 16, 16, 6, TEAL, -228, 24, -168).rotation.x = 0.2;
  box(g, 16, 16, 6, RED, -162, 24, -168).rotation.x = 0.2;

  // --- Meja kopi + buku + cangkir di atasnya ---
  box(g, 50, 3, 40, 0x8a5a2a, -193, 12.5, -42);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(g, 3, 11, 3, WOOD_DARK, -193 + sx * 21, 5.5, -42 + sz * 15);
  }
  box(g, 20, 3, 15, TEAL, -200, 15.5, -45, { ry: 0.3 });
  cyl(g, 3.4, 2.8, 4.5, 0xffffff, -178, 16, -36, 10);

  // --- Rak buku + buku warna-warni ---
  box(g, 26, 96, 140, 0x7a4a22, -345, 48, 25);
  const bookCols = [0xc93b2e, 0x2e8f86, 0xf2b134, 0x3f6fb5, 0x7a4fa3, 0x58a05c, 0xe2703a];
  for (let shelf = 0; shelf < 4; shelf++) {
    const yBase = 6 + shelf * 24;
    box(g, 2, 2, 132, 0x5d3a1a, -331, yBase, 25);
    for (let i = 0; i < 11; i++) {
      const h = 13 + ((i * 7 + shelf * 3) % 6);
      box(g, 7, h, 8.5, bookCols[(i + shelf * 2) % bookCols.length], -334, yBase + 2 + h / 2, -32 + i * 11.5);
    }
  }

  // --- Tanaman pot raksasa ---
  cyl(g, 15, 11, 18, 0xb5502e, -42, 9, -142, 14);
  cyl(g, 2.2, 3, 22, 0x6b4423, -42, 28, -142, 8);
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2f9e44, flatShading: true });
  for (const [lx, ly, lz, r] of [[-42, 52, -142, 24], [-58, 44, -134, 17], [-26, 45, -150, 16], [-42, 62, -138, 15]]) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), leafMat);
    s.position.set(lx, ly, lz); s.scale.y = 0.8; g.add(s);
  }

  // --- Lampu lantai + lampu gantung (target Misi 2) ---
  cyl(g, 6, 7, 1.5, 0x444444, -114, 0.75, -154, 10);
  cyl(g, 0.9, 0.9, 48, 0x444444, -114, 25, -154, 6);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(11, 12, 12, 1, true),
    new THREE.MeshLambertMaterial({ color: 0xf2b134, side: THREE.DoubleSide }));
  shade.position.set(-114, 53, -154); g.add(shade);
  cyl(g, 0.7, 0.7, 22, 0x555555, SURVEY.x, 99, SURVEY.z, 6);
  const shade2 = new THREE.Mesh(new THREE.ConeGeometry(15, 13, 14, 1, true),
    new THREE.MeshLambertMaterial({ color: 0xe2703a, side: THREE.DoubleSide }));
  shade2.position.set(SURVEY.x, 90, SURVEY.z); g.add(shade2);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(4.5, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
  bulb.position.set(SURVEY.x, 84, SURVEY.z); g.add(bulb);

  // --- Buku raksasa tergeletak (merah & biru) + kardus ---
  lyingBook(g, -119, 62, 46, 7, 48, RED, 0.12);
  lyingBook(g, -74, -78, 44, 6, 40, 0x3f6fb5, -0.18);
  box(g, 38, 23, 38, 0xbb8a52, -53, 11.5, 107);                    // kardus
  box(g, 40, 2, 12, 0xa1763f, -53, 24, 92, { ry: 0.5 });          // tutup kardus terbuka
  box(g, 40, 2, 12, 0xa1763f, -53, 24, 122, { ry: -0.4 });
}

function lyingBook(g, cx, cz, w, h, d, color, ry) {
  box(g, w, h * 0.45, d, 0xf5efdd, cx, h * 0.55, cz, { ry });       // halaman kertas
  box(g, w + 2, h * 0.4, d + 2, color, cx, h * 0.2, cz, { ry });    // sampul bawah
  box(g, w + 2, h * 0.25, d + 2, color, cx, h * 0.9, cz, { ry });   // sampul atas
}

function buildKitchen(g) {
  // Counter + kabinet bawah (dinding utara) + kabinet gantung
  box(g, 230, 30, 38, 0x2e8f86, 130, 15, -171);
  box(g, 234, 2.5, 42, 0xe8dcc0, 130, 31, -171);
  box(g, 200, 28, 22, 0x7a4a22, 120, 71, -179);
  // Kompor + panci + wastafel (visual di atas counter)
  box(g, 34, 1.2, 26, 0x2b2f36, 60, 32.8, -171);
  cyl(g, 8, 7, 6, 0x888888, 60, 35, -171, 12);
  box(g, 40, 1.2, 24, 0xb9c4c9, 170, 32.6, -171);
  // Kulkas putih besar + magnet warna
  box(g, 48, 80, 46, 0xf2f2f2, 272, 40, -165);
  box(g, 48, 2, 46, 0xcccccc, 272, 56, -165);
  box(g, 5, 5, 1, RED, 258, 62, -141.5); box(g, 5, 5, 1, TEAL, 268, 52, -141.5);
  box(g, 5, 5, 1, ORANGE, 282, 66, -141.5);
  // Pulau dapur + bangku + mangkuk buah
  box(g, 64, 26, 48, 0xa9743a, 120, 13, 62);
  box(g, 68, 2.5, 52, 0xe8dcc0, 120, 27, 62);
  cyl(g, 9, 5, 4, 0xc93b2e, 120, 30, 62, 12);
  for (const [fx, fz, fc] of [[116, 58, 0xf2b134], [124, 60, 0x58a05c], [120, 67, 0xe2703a]]) {
    const fr = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 6), new THREE.MeshLambertMaterial({ color: fc }));
    fr.position.set(fx, 33, fz); g.add(fr);
  }
  box(g, 14, 16, 14, 0x7a4a22, 78, 8, 100);
  box(g, 14, 16, 14, 0x7a4a22, 162, 8, 100);
  // Buku hijau tergeletak di lantai dapur
  lyingBook(g, 191, -43, 46, 7, 42, 0x58a05c, 0.22);
  // Tanaman kecil di ambang jendela selatan (di dalam dapur)
  cyl(g, 5, 4, 6, 0xb5502e, 128, 21, 193, 8);
  const s = new THREE.Mesh(new THREE.SphereGeometry(8, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0x2f9e44, flatShading: true }));
  s.position.set(128, 29, 193); g.add(s);
}

function buildGarden(g) {
  // Halaman SELATAN di luar jendela: rumput, pagar kayu, jalan setapak,
  // pohon, dan BAK PASIR finis dengan istana pasir — hadiah visual + tujuan akhir.
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(820, 520),
    new THREE.MeshLambertMaterial({ color: 0x58a05c }));
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(150, -0.2, 440);
  g.add(grass);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1100, 460),
    new THREE.MeshBasicMaterial({ color: 0xbfe6ff }));
  sky.rotation.y = Math.PI; // menghadap kembali ke rumah (-Z)
  sky.position.set(150, 180, 706);
  g.add(sky);
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(34, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff3a0 }));
  sunDisc.rotation.y = Math.PI;
  sunDisc.position.set(430, 260, 700);
  g.add(sunDisc);
  // Pagar kayu sekeliling halaman (selatan z=644, barat x=-156, timur x=456)
  const FENCE = 0xb0894f;
  box(g, 620, 9, 2, FENCE, 150, 4.5, 644);
  box(g, 2, 9, 442, FENCE, -156, 4.5, 423);
  box(g, 2, 9, 442, FENCE, 456, 4.5, 423);
  for (let fx = -150; fx <= 455; fx += 55) box(g, 3, 11, 3, 0x8a6a38, fx, 5.5, 644);
  for (let fz = 215; fz <= 640; fz += 55) {
    box(g, 3, 11, 3, 0x8a6a38, -156, 5.5, fz);
    box(g, 3, 11, 3, 0x8a6a38, 456, 5.5, fz);
  }
  // Jalan setapak krem dari bawah jendela menuju bak pasir
  box(g, 26, 0.3, 118, 0xe8dcc0, 152, 0.15, 257);
  // Pohon halaman (batang bertabrakan top 26, tajuk visual di atasnya)
  for (const [tx, tz, th] of [[40, 330, 52], [310, 330, 60], [80, 540, 46], [300, 560, 56]]) {
    cyl(g, 3, 4.5, th * 0.5, 0x7a5230, tx, th * 0.25, tz, 7);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(th * 0.34, th * 0.8, 8),
      new THREE.MeshLambertMaterial({ color: 0x2f8f3a, flatShading: true }));
    cone.position.set(tx, th * 0.5 + th * 0.38, tz);
    g.add(cone);
  }
  buildSandbox(g);
}

function buildSandbox(g) {
  // Bak pasir anak: rangka kayu, permukaan pasir (top y=3), istana pasir
  // dengan bendera di sudut timur, ember + sekop sebagai properti.
  const SAND = 0xf2d492, SAND_D = 0xe3c078, FRAME = 0x9c6a34;
  box(g, 84, 3, 64, SAND, 165, 1.5, 345);                        // permukaan pasir
  box(g, 94, 5, 6, FRAME, 165, 2.5, 307);                        // rangka utara
  box(g, 94, 5, 6, FRAME, 165, 2.5, 383);                        // rangka selatan
  box(g, 6, 5, 70, FRAME, 117, 2.5, 345);                        // rangka barat
  box(g, 6, 5, 70, FRAME, 213, 2.5, 345);                        // rangka timur
  // Istana pasir: alas + dua menara beratap kerucut + menara tengah + bendera
  box(g, 26, 7, 22, SAND_D, 190, 6.5, 360);
  cyl(g, 4.5, 5.5, 13, SAND_D, 180, 9.5, 350, 10);
  cyl(g, 4.5, 5.5, 13, SAND_D, 200, 9.5, 370, 10);
  const roofMat = new THREE.MeshLambertMaterial({ color: 0xd9ae62, flatShading: true });
  for (const [rx, rz] of [[180, 350], [200, 370]]) {
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.5, 6, 10), roofMat);
    roof.position.set(rx, 19, rz); g.add(roof);
  }
  box(g, 9, 12, 9, SAND_D, 190, 9, 360);
  cyl(g, 0.5, 0.5, 11, 0x8a5a2a, 190, 20, 360, 6);               // tiang bendera
  box(g, 8, 4.5, 0.4, RED, 194.2, 23.5, 360);                    // bendera merah
  // Ember terbalik + sekop di atas pasir (zona mendarat tetap bersih)
  cyl(g, 3.2, 4.2, 4.5, TEAL, 138, 5.2, 330, 10);
  box(g, 1.2, 1.2, 9, 0xe2703a, 146, 3.8, 356, { ry: 0.6 });     // gagang sekop
  box(g, 4, 1, 5, 0xf2b134, 150, 3.6, 360, { ry: 0.6 });         // mata sekop
}

// ---------- Definisi dunia untuk worlds.js (Bab 2) ----------
// Zona pendaratan sah: meja makan (nama 'meja') dan bagian bak pasir tanpa
// istana (nama 'pasir', sama dengan SANDBOX.land) — physics mendaftarkan
// sentuhan lembut di zona ini sebagai `landed`, bukan tabrakan.
export const WORLD = {
  id: 2,
  ceiling: CEILING_Y,
  heightAt: terrainHeight,
  build: buildTerrain,
  runway: RUNWAY,
  landingZones: [
    { name: 'meja', x0: -340, x1: -230, z0: -20, z1: 20, top: RUNWAY.height },
    { name: 'pasir', x0: SANDBOX.land.x0, x1: SANDBOX.land.x1, z0: SANDBOX.land.z0, z1: SANDBOX.land.z1, top: SANDBOX.top },
  ],
};
