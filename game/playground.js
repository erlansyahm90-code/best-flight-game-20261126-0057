// Toy Plane — playground.js — DUNIA BAB 3 "TAMAN BERMAIN ANAK"
// Taman bermain terbuka: meja piknik (landasan), dua set ayunan untuk
// slalom, perosotan, jungkat-jungkit, kubah panjat, dan PUTARAN
// (merry-go-round) BERPUTAR sebagai tempat mendarat terakhir.
// Tabrakan = playgroundHeight(x, z), kotak AABB seperti dunia lain.
// Putaran berputar hanya visual (grup spin di-tick dari main.js lewat
// worlds.tickWorld) — zona finisnya statis, jadi pendaratan adil.
import * as THREE from 'three';

// Meja piknik = "runway" Bab 3.
export const PICNIC = { x: -285, z: 0, halfLen: 55, halfWid: 20, headingDeg: 270, height: 24 };
// Putaran finis: cakram radius 26 di (175, 235), permukaan top 9.
export const DISC = { x: 175, z: 235, r: 26, top: 9 };

// ---- Kotak tabrakan AABB: {x0, x1, z0, z1, top} ----
const BOXES = [
  // Pagar taman (top 9)
  { x0: -380, x1: 420, z0: 448, z1: 456, top: 9 },
  { x0: -380, x1: 420, z0: -256, z1: -248, top: 9 },
  { x0: -380, x1: -372, z0: -256, z1: 456, top: 9 },
  { x0: 412, x1: 420, z0: -256, z1: 456, top: 9 },
  // Meja piknik (RUNWAY Bab 3) + bangku-bangkunya
  { x0: -340, x1: -230, z0: -20, z1: 20, top: PICNIC.height },
  { x0: -330, x1: -240, z0: 26, z1: 34, top: 14 },
  { x0: -330, x1: -240, z0: -34, z1: -26, top: 14 },
  // Set ayunan A (palang sepanjang X di z 55, tinggi 32): kaki di kedua
  // ujung + dudukan gantung (top 12) — celah terbang di antara dudukan
  // pada y ±24, di bawah palang, persis di garis slalom.
  { x0: -118, x1: -112, z0: 37, z1: 43, top: 32 },
  { x0: -118, x1: -112, z0: 67, z1: 73, top: 32 },
  { x0: -48, x1: -42, z0: 37, z1: 43, top: 32 },
  { x0: -48, x1: -42, z0: 67, z1: 73, top: 32 },
  { x0: -99, x1: -91, z0: 51, z1: 59, top: 12 },
  { x0: -69, x1: -61, z0: 51, z1: 59, top: 12 },
  // Set ayunan B (palang sepanjang X di z -50; kotak diselaraskan ke
  // posisi visual kaki/dudukan dari buildSwingSet(58, -50))
  { x0: 22, x1: 28, z0: -68, z1: -62, top: 32 },
  { x0: 22, x1: 28, z0: -38, z1: -32, top: 32 },
  { x0: 90, x1: 96, z0: -68, z1: -62, top: 32 },
  { x0: 90, x1: 96, z0: -38, z1: -32, top: 32 },
  { x0: 39, x1: 47, z0: -54, z1: -46, top: 12 },
  { x0: 69, x1: 77, z0: -54, z1: -46, top: 12 },
  // Perosotan: menara (top 40) + tangga luncur bertingkat ke selatan
  { x0: 222, x1: 248, z0: 107, z1: 133, top: 40 },
  { x0: 228, x1: 242, z0: 133, z1: 150, top: 30 },
  { x0: 228, x1: 242, z0: 150, z1: 167, top: 20 },
  { x0: 228, x1: 242, z0: 167, z1: 185, top: 10 },
  // Jungkat-jungkit: tumpuan tengah
  { x0: 54, x1: 66, z0: 179, z1: 191, top: 8 },
  // Kubah panjat (utara)
  { x0: -85, x1: -35, z0: -165, z1: -115, top: 20 },
  // Putaran: alas (top 6) + cakram (top 9)
  { x0: 147, x1: 203, z0: 207, z1: 263, top: 6 },
  { x0: 149, x1: 201, z0: 209, z1: 261, top: DISC.top },
  // Batang pohon (top 26)
  { x0: -324, x1: -316, z0: -144, z1: -136, top: 26 },
  { x0: -144, x1: -136, z0: 196, z1: 204, top: 26 },
  { x0: 326, x1: 334, z0: -64, z1: -56, top: 26 },
  { x0: 346, x1: 354, z0: 296, z1: 304, top: 26 },
  { x0: 36, x1: 44, z0: 326, z1: 334, top: 26 },
  { x0: -44, x1: -36, z0: -224, z1: -216, top: 26 },
  // Bangku taman
  { x0: -14, x1: 14, z0: 124, z1: 136, top: 12 },
  { x0: -254, x1: -226, z0: -126, z1: -114, top: 12 },
];

export function playgroundHeight(x, z) {
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
  if (opts.rz) m.rotation.z = opts.rz;
  if (opts.rx) m.rotation.x = opts.rx;
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

const WOOD_DARK = 0x8a5a2a, RED = 0xc93b2e, TEAL = 0x2e8f86, ORANGE = 0xf08c1e;
let spinGroup = null; // grup putaran yang berputar (visual saja)

export function buildPlaygroundWorld(scene) {
  const g = new THREE.Group();
  g.name = 'Playground';
  spinGroup = null;

  // --- Rumput, langit, matahari, awan ---
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(820, 740),
    new THREE.MeshLambertMaterial({ color: 0x58a05c }));
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(20, -0.2, 100);
  g.add(grass);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1300, 520),
    new THREE.MeshBasicMaterial({ color: 0xbfe6ff }));
  sky.rotation.y = Math.PI;
  sky.position.set(20, 190, 470);
  g.add(sky);
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(36, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff3a0 }));
  sunDisc.rotation.y = Math.PI;
  sunDisc.position.set(330, 300, 464);
  g.add(sunDisc);
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // tak berlampu: selalu putih cerah
  for (const [cx, cy, cz, s] of [[-200, 150, 300, 26], [80, 175, 380, 34], [300, 140, 260, 22], [-320, 165, 120, 24]]) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), cloudMat);
    c.position.set(cx, cy, cz); c.scale.y = 0.42; g.add(c);
  }
  // Jalan setapak pasir dari meja piknik ke tengah taman
  box(g, 26, 0.3, 300, 0xe8dcc0, -160, 0.15, 60);
  box(g, 300, 0.3, 24, 0xe8dcc0, 40, 0.15, 208);

  buildFenceAndTrees(g);
  buildPicnic(g);
  buildSwingSet(g, -80, 55, RED);
  buildSwingSet(g, 58, -50, TEAL);
  buildSlide(g);
  buildSeesawAndDome(g);
  buildMerryGoRound(g);
  scene.add(g);
  return g;
}

function buildFenceAndTrees(g) {
  const FENCE = 0xb0894f;
  box(g, 800, 9, 2, FENCE, 20, 4.5, 452);
  box(g, 800, 9, 2, FENCE, 20, 4.5, -252);
  box(g, 2, 9, 704, FENCE, -376, 4.5, 100);
  box(g, 2, 9, 704, FENCE, 416, 4.5, 100);
  for (let fx = -370; fx <= 415; fx += 56) {
    box(g, 3, 11, 3, 0x8a6a38, fx, 5.5, 452);
    box(g, 3, 11, 3, 0x8a6a38, fx, 5.5, -252);
  }
  for (const [tx, tz, th] of [[-320, -140, 54], [-140, 200, 48], [330, -60, 58], [350, 300, 50], [40, 330, 46], [-40, -220, 52]]) {
    cyl(g, 3, 4.5, th * 0.5, 0x7a5230, tx, th * 0.25, tz, 7);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(th * 0.34, th * 0.85, 8),
      new THREE.MeshLambertMaterial({ color: 0x2f8f3a, flatShading: true }));
    cone.position.set(tx, th * 0.5 + th * 0.4, tz);
    g.add(cone);
  }
  // Bangku taman
  for (const [bx, bz] of [[0, 130], [-240, -120]]) {
    box(g, 28, 2.5, 12, 0x9c6a34, bx, 11, bz);
    box(g, 28, 9, 2.5, 0x9c6a34, bx, 7, bz - 5);
    box(g, 3, 10, 10, 0x555555, bx - 11, 5, bz);
    box(g, 3, 10, 10, 0x555555, bx + 11, 5, bz);
  }
}

function buildPicnic(g) {
  // Meja piknik = landasan Bab 3 + garis landas di atasnya
  box(g, 114, 4, 44, 0x9c6a34, PICNIC.x, PICNIC.height - 2, 0);
  box(g, 118, 1.2, 48, 0xb57e42, PICNIC.x, PICNIC.height - 0.2, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(g, 5, PICNIC.height - 4, 5, WOOD_DARK, PICNIC.x + sx * 50, (PICNIC.height - 4) / 2, sz * 17);
  }
  for (let dx = -44; dx <= 44; dx += 16) box(g, 9, 0.3, 2, 0xffffff, PICNIC.x + dx, PICNIC.height + 0.55, 0);
  box(g, 90, 2.5, 8, 0x8a5a2a, PICNIC.x, 13, 30);
  box(g, 90, 2.5, 8, 0x8a5a2a, PICNIC.x, 13, -30);
  // Keranjang piknik + semangka di sudut meja (jalur tengah bersih)
  box(g, 12, 7, 9, 0xbb8a52, -243, PICNIC.height + 3.5, -13);
  const melon = new THREE.Mesh(new THREE.SphereGeometry(4.5, 10, 8),
    new THREE.MeshLambertMaterial({ color: 0x2f9e44, flatShading: true }));
  melon.position.set(-243, PICNIC.height + 4, 12); melon.scale.y = 0.85; g.add(melon);
}

function buildSwingSet(g, cx, cz, color) {
  // Palang sepanjang X (70 unit) di ketinggian 32, rangka A di kedua ujung,
  // dua ayunan menggantung — celah terbang di tengah, di bawah palang.
  const POLE = 0x707880;
  cyl(g, 1.1, 1.1, 70, POLE, cx, 33, cz, 8).rotation.z = Math.PI / 2;
  for (const ex of [cx - 35, cx + 35]) {
    for (const ez of [cz - 15, cz + 15]) {
      const leg = cyl(g, 0.9, 0.9, 34, POLE, ex, 16, ez, 6);
      leg.rotation.x = ez < cz ? 0.42 : -0.42;
    }
    cyl(g, 0.8, 0.8, 33, POLE, ex, 30, cz, 6).rotation.x = Math.PI / 2;
  }
  for (const sx of [cx - 15, cx + 15]) {
    cyl(g, 0.28, 0.28, 20, 0x444444, sx - 3, 21, cz, 5);
    cyl(g, 0.28, 0.28, 20, 0x444444, sx + 3, 21, cz, 5);
    box(g, 9, 1.6, 8, color, sx, 11, cz);
  }
  // Bendera kecil di tengah palang
  cyl(g, 0.4, 0.4, 9, 0x444444, cx, 37, cz, 5);
  box(g, 7, 4, 0.4, ORANGE, cx + 3.8, 39.5, cz);
}

function buildSlide(g) {
  // Menara perosotan + atap + luncuran kuning melengkung (bertingkat visual)
  box(g, 26, 40, 26, 0x3f6fb5, 235, 20, 120);
  box(g, 30, 2.5, 30, 0x2b4f81, 235, 41, 120);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(24, 12, 4),
    new THREE.MeshLambertMaterial({ color: RED, flatShading: true }));
  roof.position.set(235, 48, 120); roof.rotation.y = Math.PI / 4; g.add(roof);
  const ramp = box(g, 13, 1.8, 62, 0xf2b134, 235, 21, 159);
  ramp.rotation.x = 0.62;
  box(g, 1.6, 4, 62, ORANGE, 228.5, 23, 159, { rx: 0.62 });
  box(g, 1.6, 4, 62, ORANGE, 241.5, 23, 159, { rx: 0.62 });
  // Tangga di sisi utara menara
  for (let i = 0; i < 5; i++) box(g, 12, 1.6, 4, 0xcccccc, 235, 6 + i * 8, 103 - i * 1.5);
}

function buildSeesawAndDome(g) {
  // Jungkat-jungkit: tumpuan + papan miring (satu sisi naik)
  cyl(g, 3.4, 4.2, 8, 0x707880, 60, 4, 185, 10);
  const plank = box(g, 44, 1.8, 7, TEAL, 60, 10.5, 185);
  plank.rotation.z = 0.16;
  box(g, 6, 3, 6, RED, 41, 13.5, 185);
  box(g, 6, 3, 6, RED, 79, 6.5, 185);
  // Kubah panjat: setengah bola rangka (visual) di utara
  const dome = new THREE.Mesh(new THREE.SphereGeometry(24, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: ORANGE, flatShading: true, wireframe: true }));
  dome.position.set(-60, 0, -140);
  g.add(dome);
  cyl(g, 22, 24, 2, 0xd9c9a8, -60, 1, -140, 16);
}

function buildMerryGoRound(g) {
  // Alas statis (top 6) + grup berputar: cakram (top 9), tiang tengah,
  // atap kerucut, dan 4 kuda-kudaan — mendarat di cakram yang berputar!
  cyl(g, 28, 29, 6, 0xd9c9a8, DISC.x, 3, DISC.z, 24);
  spinGroup = new THREE.Group();
  spinGroup.position.set(DISC.x, 0, DISC.z);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(DISC.r, DISC.r, 3, 24),
    new THREE.MeshLambertMaterial({ color: RED, flatShading: true }));
  disc.position.y = DISC.top - 1.5;
  spinGroup.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(DISC.r, 0.9, 8, 32),
    new THREE.MeshLambertMaterial({ color: 0xffd23f, emissive: 0x8a6d00 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = DISC.top;
  spinGroup.add(rim);
  cyl(spinGroup, 1.6, 1.6, 17, 0x707880, 0, DISC.top + 8.5, 0, 10);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(17, 8, 12),
    new THREE.MeshLambertMaterial({ color: ORANGE, flatShading: true }));
  roof.position.y = DISC.top + 21;
  spinGroup.add(roof);
  // 4 kuda-kudaan di tiang vertikal
  const horseCols = [0x3f6fb5, 0xf2b134, 0x58a05c, 0x7a4fa3];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const hx = Math.cos(a) * 16, hz = Math.sin(a) * 16;
    cyl(spinGroup, 0.5, 0.5, 12, 0xcccccc, hx, DISC.top + 6, hz, 6);
    const horse = box(spinGroup, 7, 3.4, 2.6, horseCols[i], hx, DISC.top + 7.5, hz, { ry: -a });
    horse.rotation.z = 0.06;
    box(spinGroup, 2.2, 2.6, 2.2, horseCols[i], hx + Math.cos(a) * 3.6, DISC.top + 9.3, hz + Math.sin(a) * 3.6, { ry: -a });
  }
  g.add(spinGroup);
}

// Putaran berputar pelan (visual saja — zona tabrakan/finis statis).
export function tickPlayground(dt) {
  if (spinGroup) spinGroup.rotation.y += dt * 0.45;
}

// ---------- Definisi dunia untuk worlds.js (Bab 3) ----------
export const WORLD = {
  id: 3,
  ceiling: 500,
  heightAt: playgroundHeight,
  build: buildPlaygroundWorld,
  tick: tickPlayground,
  runway: PICNIC,
  landingZones: [
    { name: 'meja-piknik', x0: -340, x1: -230, z0: -20, z1: 20, top: PICNIC.height },
    { name: 'putaran', x0: DISC.x - DISC.r, x1: DISC.x + DISC.r, z0: DISC.z - DISC.r, z1: DISC.z + DISC.r, top: DISC.top },
  ],
};
