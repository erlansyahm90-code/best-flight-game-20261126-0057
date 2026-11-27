// Toy Plane — bedroom.js — DUNIA BAB 1 "KAMAR ANAK"
// Kamar tidur anak raksasa dari sudut pandang pesawat mainan: meja belajar
// (landasan pulang-pergi), kasur raksasa, balok huruf, rel kereta mainan,
// lemari dan rak buku. Satu sumber tabrakan = bedroomHeight(x, z), kotak
// AABB sama seperti dunia rumah (terrain.js).
import * as THREE from 'three';

// Meja belajar = "runway" Bab 1: lepas landas & mendarat di sini.
export const DESK = { x: -285, z: 0, halfLen: 55, halfWid: 20, headingDeg: 270, height: 26 };
const WALL_TOP = 120;

// ---- Kotak tabrakan AABB: {x0, x1, z0, z1, top} ----
const BOXES = [
  // Dinding luar kamar (top 120)
  { x0: -372, x1: -360, z0: -202, z1: 202, top: WALL_TOP },   // barat
  { x0: 300, x1: 312, z0: -202, z1: 202, top: WALL_TOP },     // timur
  { x0: -372, x1: 312, z0: -202, z1: -190, top: WALL_TOP },   // utara
  { x0: -372, x1: 312, z0: 190, z1: 202, top: WALL_TOP },     // selatan
  // Karpet kamar
  { x0: -260, x1: 60, z0: -90, z1: 90, top: 1.2 },
  // Meja belajar (RUNWAY Bab 1) + properti di sudut-sudutnya (jalur tengah bersih)
  { x0: -340, x1: -230, z0: -20, z1: 20, top: DESK.height },
  { x0: -328, x1: -316, z0: -16, z1: -6, top: 33 },           // tumpukan buku di meja
  { x0: -334, x1: -326, z0: 10, z1: 18, top: 34 },            // gelas pensil (ujung barat — jalur pendaratan bersih)
  { x0: -322, x1: -316, z0: -18, z1: -12, top: 42 },          // kaki lampu meja
  // Kursi belajar (selatan meja)
  { x0: -294, x1: -276, z0: 26, z1: 44, top: 23 },
  { x0: -294, x1: -276, z0: 40, z1: 44, top: 46 },
  // Kasur raksasa (utara-timur): rangka, kasur, bantal, selimut
  { x0: 60, x1: 280, z0: -190, z1: -70, top: 16 },
  { x0: 66, x1: 274, z0: -184, z1: -76, top: 24 },
  { x0: 70, x1: 120, z0: -180, z1: -128, top: 31 },
  { x0: 70, x1: 120, z0: -122, z1: -80, top: 31 },
  { x0: 150, x1: 274, z0: -184, z1: -76, top: 27 },
  // Lemari pakaian (dinding selatan, timur)
  { x0: 180, x1: 290, z0: 168, z1: 196, top: 95 },
  // Rak buku (dinding timur)
  { x0: 272, x1: 298, z0: -40, z1: 60, top: 90 },
  // Balok huruf raksasa (satu lapis top 20-22, satu tumpukan dua lapis top 42)
  { x0: 14, x1: 36, z0: 14, z1: 36, top: 21 },
  { x0: 64, x1: 86, z0: 40, z1: 62, top: 20 },
  { x0: 38, x1: 58, z0: -38, z1: -18, top: 22 },
  { x0: 112, x1: 134, z0: 88, z1: 110, top: 21 },
  { x0: 84, x1: 104, z0: -62, z1: -42, top: 20 },
  { x0: 140, x1: 162, z0: 10, z1: 32, top: 42 },
  // Kereta mainan di rel selatan + kotak mainan
  { x0: 76, x1: 94, z0: 120, z1: 134, top: 11 },
  { x0: -78, x1: -42, z0: 138, z1: 168, top: 18 },
];

export function bedroomHeight(x, z) {
  let h = 0;
  for (const b of BOXES) {
    if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1 && b.top > h) h = b.top;
  }
  return h;
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

const WOOD = 0xa9743a, WOOD_DARK = 0x8a5a2a, WALL = 0xd8ecff, WALL_K = 0xfdeec9;
const CREAM = 0xfff3d6, RED = 0xc93b2e, TEAL = 0x2e8f86, ORANGE = 0xf08c1e;

export function buildBedroomWorld(scene) {
  const g = new THREE.Group();
  g.name = 'KidsBedroom';

  // --- Lantai kayu + plafon + balok ---
  box(g, 672, 2, 404, WOOD, -30, -1, 0);
  for (let i = 0; i < 15; i++) box(g, 672, 0.3, 1.6, WOOD_DARK, -30, 0.05, -182 + i * 26);
  box(g, 672, 2, 404, 0xf9ecca, -30, 111, 0);
  for (let i = 0; i < 6; i++) box(g, 4, 3, 404, WOOD_DARK, -320 + i * 120, 109, 0);
  // Karpet kamar: biru muda berbintang (kotak krem sebagai bintang sederhana)
  box(g, 324, 1.0, 184, 0x7fb2e0, -100, 0.5, 0);
  box(g, 320, 1.2, 180, 0x5b93d6, -100, 0.6, 0);
  for (const [sx, sz] of [[-200, -50], [-120, 40], [-40, -60], [10, 55], [-180, 65]]) {
    box(g, 9, 1.35, 9, 0xffe9a0, sx, 0.65, sz, { ry: 0.6 });
  }

  buildWallsBedroom(g);
  buildDeskArea(g);
  buildBed(g);
  buildPlayCorner(g);
  scene.add(g);
  return g;
}

function buildWallsBedroom(g) {
  const H = 110, T = 12, cy = H / 2;
  box(g, T, H, 404, WALL, -366, cy, 0);
  box(g, 684, H, T, WALL, -30, cy, -196);
  box(g, T, H, 404, WALL, 306, cy, 0);
  box(g, 684, H, T, WALL_K, -30, cy, 196);
  // Jendela kamar di dinding utara: kusen putih + kaca biru terang + gorden
  const FM = 0xffffff;
  box(g, 104, 58, 1.5, 0xbfe6ff, 10, 68, -189.5);
  box(g, 108, 4, 2, FM, 10, 96, -189);
  box(g, 108, 4, 2, FM, 10, 40, -189);
  box(g, 4, 58, 2, FM, -42, 68, -189);
  box(g, 4, 58, 2, FM, 62, 68, -189);
  box(g, 2.4, 58, 2, FM, 10, 68, -189);
  box(g, 14, 60, 3, ORANGE, -52, 68, -188);
  box(g, 14, 60, 3, ORANGE, 72, 68, -188);
  // Pintu kamar (tertutup) di dinding selatan + poster pesawat di dinding barat
  box(g, 62, 88, 2, 0x9c6a34, -25, 44, 189.5);
  box(g, 54, 80, 2.4, 0xb57e42, -25, 40, 189);
  cyl(g, 2, 2, 2, 0xffd23f, 2, 42, 187.5, 8);
  box(g, 2, 46, 60, 0x3f6fb5, -359.5, 62, -60);
  box(g, 2, 34, 46, 0xf2b134, -358.5, 62, -60);
  // Lemari pakaian + rak buku timur
  box(g, 110, 95, 28, 0x8a5a2a, 235, 47.5, 182);
  box(g, 2, 70, 20, 0x6e4525, 181, 40, 182);
  box(g, 2, 70, 20, 0x6e4525, 289, 40, 182);
  box(g, 26, 90, 100, 0x7a4a22, 285, 45, 10);
  const bookCols = [0xc93b2e, 0x2e8f86, 0xf2b134, 0x3f6fb5, 0x7a4fa3, 0x58a05c, 0xe2703a];
  for (let shelf = 0; shelf < 3; shelf++) {
    const yBase = 8 + shelf * 28;
    box(g, 2, 2, 92, 0x5d3a1a, 271, yBase, 10);
    for (let i = 0; i < 8; i++) {
      const h = 14 + ((i * 5 + shelf * 3) % 6);
      box(g, 7, h, 8.5, bookCols[(i + shelf) % bookCols.length], 274, yBase + 2 + h / 2, -30 + i * 11.5);
    }
  }
}

function buildDeskArea(g) {
  // --- Meja belajar (RUNWAY Bab 1): papan + kaki + garis landas ---
  box(g, 114, 4, 44, 0x9c6a34, DESK.x, DESK.height - 2, 0);
  box(g, 118, 1.2, 48, 0xb57e42, DESK.x, DESK.height - 0.2, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(g, 5, DESK.height - 4, 5, WOOD_DARK, DESK.x + sx * 50, (DESK.height - 4) / 2, sz * 17);
  }
  for (let dx = -44; dx <= 44; dx += 16) box(g, 9, 0.3, 2, 0xffffff, DESK.x + dx, DESK.height + 0.55, 0);
  // Tumpukan buku + gelas pensil + lampu meja (sudut meja, jalur tengah bersih)
  box(g, 12, 4, 10, RED, -322, DESK.height + 2, -11);
  box(g, 11, 3, 9, TEAL, -322, DESK.height + 5.5, -11);
  cyl(g, 4, 3.4, 8, 0xf2b134, -330, DESK.height + 4, 14, 10);
  cyl(g, 0.5, 0.5, 7, 0xe23b2e, -332, DESK.height + 10, 13, 6);
  cyl(g, 0.5, 0.5, 6, 0x3f6fb5, -328, DESK.height + 9.5, 15, 6);
  cyl(g, 3, 3.6, 2, 0x444444, -319, DESK.height + 1, -15, 10);
  cyl(g, 0.8, 0.8, 15, 0x444444, -319, DESK.height + 8, -15, 6);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(7, 7, 12, 1, true),
    new THREE.MeshLambertMaterial({ color: 0x58a05c, side: THREE.DoubleSide }));
  shade.position.set(-319, DESK.height + 17, -15); g.add(shade);
  // Kursi belajar
  box(g, 18, 2.5, 18, 0x7a4a22, -285, 22, 35);
  box(g, 18, 24, 2.5, 0x7a4a22, -285, 34, 42);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(g, 2.4, 21, 2.4, WOOD_DARK, -285 + sx * 7, 10.5, 35 + sz * 7);
  }
  // Globe kecil di lantai samping meja
  cyl(g, 1, 1.4, 10, 0x6e4525, -215, 5, 30, 8);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(8, 12, 10),
    new THREE.MeshLambertMaterial({ color: 0x3f8fd6, flatShading: true }));
  globe.position.set(-215, 15, 30); globe.rotation.z = 0.4; g.add(globe);
}

function buildBed(g) {
  // --- Kasur raksasa: rangka kayu, kasur putih, bantal, selimut biru ---
  box(g, 220, 16, 120, 0x8a5a2a, 170, 8, -130);
  box(g, 208, 8, 108, 0xf7f3e8, 170, 20, -130);
  box(g, 50, 7, 52, 0xffffff, 95, 27.5, -154);
  box(g, 50, 7, 40, 0xffffff, 95, 27.5, -101);
  box(g, 124, 3, 108, 0x3f6fb5, 212, 25.5, -130);
  box(g, 124, 6, 14, 0x5b93d6, 212, 24, -82);
  // Kepala tempat tidur + boneka beruang duduk di bantal
  box(g, 10, 44, 120, 0x7a4a22, 62, 22, -130);
  const bearMat = new THREE.MeshLambertMaterial({ color: 0xb0894f, flatShading: true });
  const bear = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), bearMat);
  bear.position.set(86, 35, -156); bear.scale.y = 1.15; g.add(bear);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(2.1, 8, 6), bearMat);
    ear.position.set(86 + s * 4.4, 41.8, -156); g.add(ear);
  }
}

function buildPlayCorner(g) {
  // --- Balok huruf raksasa: kubus warna + panel huruf krem di atasnya ---
  const blocks = [
    [25, 25, 21, RED], [75, 51, 20, TEAL], [48, -28, 22, 0xf2b134],
    [123, 99, 21, 0x3f6fb5], [94, -52, 20, 0x7a4fa3],
  ];
  for (const [bx, bz, bh, col] of blocks) {
    box(g, 22, bh, 22, col, bx, bh / 2, bz, { ry: (bx % 7) * 0.06 });
    box(g, 12, 1.2, 12, CREAM, bx, bh + 0.6, bz, { ry: (bx % 7) * 0.06 });
  }
  // Tumpukan dua balok
  box(g, 22, 21, 22, 0x58a05c, 151, 10.5, 21);
  box(g, 22, 21, 22, ORANGE, 151, 31.5, 21, { ry: 0.35 });
  box(g, 12, 1.2, 12, CREAM, 151, 42.6, 21, { ry: 0.35 });

  // --- Rel kereta mainan: lingkaran rel gelap + bantalan + kereta ---
  const rail = new THREE.Mesh(new THREE.RingGeometry(52, 66, 40),
    new THREE.MeshLambertMaterial({ color: 0x4a4a55 }));
  rail.rotation.x = -Math.PI / 2;
  rail.position.set(30, 0.75, 140);
  g.add(rail);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(52, 40),
    new THREE.MeshLambertMaterial({ color: 0x6abe6a }));
  inner.rotation.x = -Math.PI / 2;
  inner.position.set(30, 0.7, 140);
  g.add(inner);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    box(g, 16, 0.8, 3.4, 0x8a6a38, 30 + Math.cos(a) * 59, 0.5, 140 + Math.sin(a) * 59, { ry: -a });
  }
  // Lokomotif + dua gerbong di sisi timur rel
  box(g, 18, 8, 9, RED, 85, 5.5, 127);
  box(g, 7, 6, 8, 0x2b2f36, 78, 12, 127);
  cyl(g, 2.6, 2.6, 5, 0x2b2f36, 90, 12, 127, 8);
  box(g, 13, 6, 8, TEAL, 85, 4.5, 148, { ry: 0.5 });
  box(g, 13, 6, 8, 0xf2b134, 72, 4.5, 160, { ry: 0.9 });

  // --- Kotak mainan + bola-bola ---
  box(g, 36, 18, 30, 0xe2703a, -60, 9, 153);
  box(g, 38, 2.5, 32, 0xc95f1e, -60, 19, 153);
  for (const [bx, bz, bc] of [[-68, 146, RED], [-54, 158, 0xf2b134], [-60, 140, TEAL]]) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(5, 10, 8),
      new THREE.MeshLambertMaterial({ color: bc, flatShading: true }));
    ball.position.set(bx, 22, bz); g.add(ball);
  }
  const ball2 = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0x7a4fa3, flatShading: true }));
  ball2.position.set(-25, 6, 120); g.add(ball2);
}

// ---------- Definisi dunia untuk worlds.js (Bab 1) ----------
export const WORLD = {
  id: 1,
  ceiling: 104,
  heightAt: bedroomHeight,
  build: buildBedroomWorld,
  runway: DESK,
  landingZones: [
    { name: 'meja-belajar', x0: -340, x1: -230, z0: -20, z1: 20, top: DESK.height },
  ],
};
