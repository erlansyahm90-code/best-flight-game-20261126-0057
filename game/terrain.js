// Archipelago Air — terrain.js
// Kepulauan tropis Indonesia: fungsi ketinggian deterministik + mesh low-poly,
// gunung berapi berkawah, runway di pulau utama, palem, sawah terasering, awan.
import * as THREE from 'three';

// ---- Data pulau (x, z, radius, tinggi) ----
export const ISLANDS = [
  { x: 0, z: 0, r: 620, h: 62 },        // Pulau Utama — runway di sini
  { x: 1250, z: -850, r: 520, h: 265 }, // Gunung Api — kawah di puncak
  { x: -1150, z: -700, r: 420, h: 95 }, // Pulau Barat
  { x: -900, z: 950, r: 380, h: 70 },   // Pulau Selatan-Barat
  { x: 1050, z: 1050, r: 340, h: 55 },  // Pulau Selatan-Timur
  { x: 300, z: -1400, r: 260, h: 48 },  // Pulau Utara kecil
  { x: -1500, z: 250, r: 220, h: 40 },  // Pulau Barat kecil
  { x: 1650, z: 150, r: 240, h: 44 },   // Pulau Timur kecil
];

export const VOLCANO = { x: 1250, z: -850, craterR: 95, peakH: 265 };
export const RUNWAY = { x: -30, z: 0, halfLen: 290, halfWid: 26, headingDeg: 90, height: 9 };
export const WORLD_HALF = 2100; // batas dunia yang digambar

function smoothstep(a, b, t) {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

// Ketinggian terrain di (x, z). Dipakai mesh DAN fisika tabrakan — satu sumber kebenaran.
export function terrainHeight(x, z) {
  let h = -6; // dasar laut
  for (const isl of ISLANDS) {
    const dx = x - isl.x;
    const dz = z - isl.z;
    const d = Math.sqrt(dx * dx + dz * dz) / isl.r;
    if (d < 1.25) {
      const bump = Math.max(0, 1 - d * d);
      h += isl.h * bump * bump;
    }
  }
  // Kawah gunung: cekungan di puncak
  const vdx = x - VOLCANO.x;
  const vdz = z - VOLCANO.z;
  const vd = Math.sqrt(vdx * vdx + vdz * vdz);
  if (vd < VOLCANO.craterR) {
    h -= 55 * smoothstep(VOLCANO.craterR, 20, vd);
  }
  // Ratakan area runway di pulau utama
  const rx = Math.abs(x - RUNWAY.x);
  const rz = Math.abs(z - RUNWAY.z);
  if (rx < RUNWAY.halfLen + 120 && rz < RUNWAY.halfWid + 120) {
    const fx = smoothstep(RUNWAY.halfLen + 120, RUNWAY.halfLen, rx);
    const fz = smoothstep(RUNWAY.halfWid + 120, RUNWAY.halfWid, rz);
    const f = Math.max(fx, fz);
    h = h * (1 - f) + RUNWAY.height * f;
  }
  // Koridor pendekatan dari barat: dataran landai menuju runway supaya
  // pendekatan landing yang agak curam tetap sampai ke landasan, bukan bukit.
  const ax0 = -820, ax1 = -RUNWAY.halfLen, azHalf = 85;
  if (x > ax0 - 120 && x < ax1 + 120 && Math.abs(z) < azHalf + 120) {
    const fx = Math.min(smoothstep(ax0 - 120, ax0, x), smoothstep(ax1 + 120, ax1, x));
    const fz = smoothstep(azHalf + 120, azHalf, Math.abs(z));
    // Hanya ratakan daratan — jangan bangun jembatan di atas laut.
    const f = Math.min(fx, fz) * smoothstep(1, 6, h);
    h = h * (1 - f) + RUNWAY.height * f;
  }
  return h;
}

export function isOverLand(x, z) {
  return terrainHeight(x, z) > 1.5;
}

function colorForHeight(h, out) {
  if (h < 1.5) { out.setRGB(0.85, 0.78, 0.55); }        // pasir pantai
  else if (h < 14) { out.setRGB(0.25, 0.62, 0.28); }   // rumput rendah
  else if (h < 70) { out.setRGB(0.16, 0.48, 0.22); }   // hutan hijau
  else if (h < 150) { out.setRGB(0.35, 0.32, 0.25); }  // batu
  else if (h < 230) { out.setRGB(0.28, 0.24, 0.22); }  // batu gelap
  else { out.setRGB(0.45, 0.38, 0.36); }               // puncak vulkanik
  // Variasi kecil deterministik supaya low-poly terasa hidup
  const v = 0.92 + 0.16 * Math.abs(Math.sin(h * 12.9898) * 0.5);
  out.multiplyScalar(v);
  return out;
}

export function buildTerrain(scene) {
  const group = new THREE.Group();
  group.name = 'ArchipelagoTerrain';

  // --- Daratan low-poly ---
  const SEG = 180;
  const SIZE = WORLD_HALF * 2;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = terrainHeight(x, z);
    pos.setY(i, h);
    colorForHeight(h, c);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  land.name = 'Islands';
  group.add(land);

  // --- Laut ---
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(SIZE * 1.6, SIZE * 1.6),
    new THREE.MeshLambertMaterial({ color: 0x1d7f9e, transparent: true, opacity: 0.94 }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = 0;
  sea.name = 'Sea';
  group.add(sea);

  // --- Runway: aspal gelap + garis tengah + angka 09 ---
  const runway = new THREE.Group();
  runway.name = 'Runway';
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(RUNWAY.halfLen * 2, 1.2, RUNWAY.halfWid * 2),
    new THREE.MeshLambertMaterial({ color: 0x2b2f36 }),
  );
  strip.position.set(RUNWAY.x, RUNWAY.height + 0.4, RUNWAY.z);
  runway.add(strip);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let dx = -220; dx <= 220; dx += 44) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(22, 0.3, 2.2), lineMat);
    dash.position.set(RUNWAY.x + dx, RUNWAY.height + 1.1, RUNWAY.z);
    runway.add(dash);
  }
  // Threshold putih di kedua ujung
  for (const s of [-1, 1]) {
    const th = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, RUNWAY.halfWid * 2 - 6), lineMat);
    th.position.set(RUNWAY.x + s * (RUNWAY.halfLen - 12), RUNWAY.height + 1.1, RUNWAY.z);
    runway.add(th);
  }
  group.add(runway);

  // --- Kawah: lava pijar di dasar kawah ---
  const lava = new THREE.Mesh(
    new THREE.CircleGeometry(VOLCANO.craterR * 0.55, 24),
    new THREE.MeshBasicMaterial({ color: 0xff5a1e }),
  );
  lava.rotation.x = -Math.PI / 2;
  lava.position.set(VOLCANO.x, VOLCANO.peakH - 52, VOLCANO.z);
  lava.name = 'CraterLava';
  group.add(lava);

  // --- Asap tipis di atas kawah ---
  const smokeMat = new THREE.MeshLambertMaterial({ color: 0xd8d8d8, transparent: true, opacity: 0.75 });
  for (let i = 0; i < 5; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(16 + i * 5, 8, 6), smokeMat);
    puff.position.set(VOLCANO.x + (i - 2) * 8, VOLCANO.peakH + 18 + i * 14, VOLCANO.z + (i % 2) * 10 - 5);
    puff.scale.y = 0.7;
    group.add(puff);
  }

  buildPalms(group);
  buildTerraces(group);
  buildClouds(group);
  scene.add(group);
  return group;
}

function buildPalms(group) {
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x7a5230 });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x1f8a3c, flatShading: true });
  // Posisi palem deterministik di sekitar pantai pulau utama & pulau barat
  const spots = [];
  for (let i = 0; i < 46; i++) {
    const a = (i * 2.39996) % (Math.PI * 2); // sudut golden-angle
    const isl = ISLANDS[i % 3 === 0 ? 2 : 0];
    const rr = isl.r * (0.55 + 0.3 * ((i * 37) % 10) / 10);
    const x = isl.x + Math.cos(a) * rr;
    const z = isl.z + Math.sin(a) * rr;
    if (Math.abs(x) < RUNWAY.halfLen + 60 && Math.abs(z) < RUNWAY.halfWid + 60) continue;
    if (terrainHeight(x, z) < 3 || terrainHeight(x, z) > 40) continue;
    spots.push([x, z]);
  }
  for (const [x, z] of spots) {
    const palm = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 9, 5), trunkMat);
    trunk.position.y = 4.5;
    palm.add(trunk);
    for (let k = 0; k < 5; k++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.6, 7, 4), leafMat);
      const la = (k / 5) * Math.PI * 2;
      leaf.position.set(Math.cos(la) * 2.4, 9.4, Math.sin(la) * 2.4);
      leaf.rotation.z = Math.cos(la) * 1.1;
      leaf.rotation.x = -Math.sin(la) * 1.1;
      palm.add(leaf);
    }
    palm.position.set(x, terrainHeight(x, z), z);
    palm.rotation.y = (x * 0.7 + z * 0.3) % Math.PI;
    group.add(palm);
  }
}

function buildTerraces(group) {
  // Sawah terasering: anak tangga hijau di lereng pulau utama
  const mat = new THREE.MeshLambertMaterial({ color: 0x4da53a, flatShading: true });
  const waterMat = new THREE.MeshLambertMaterial({ color: 0x7fd4e8 });
  for (let i = 0; i < 6; i++) {
    const w = 90 - i * 10;
    const step = new THREE.Mesh(new THREE.BoxGeometry(w, 3, 26), i % 2 ? waterMat : mat);
    step.position.set(-330 + i * 8, 14 + i * 5.5, 260 - i * 4);
    group.add(step);
  }
}

function buildClouds(group) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
  const spots = [
    [600, 260, -600], [-700, 300, 400], [1500, 280, 600], [-1400, 240, -1100],
    [200, 320, 1400], [900, 250, -1500], [-300, 290, -1200], [1700, 300, -300],
  ];
  for (const [x, y, z] of spots) {
    const cloud = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(18 + i * 6, 8, 6), mat);
      puff.position.set(i * 22 - 30, (i % 2) * 5, (i % 3) * 8 - 8);
      puff.scale.y = 0.55;
      cloud.add(puff);
    }
    cloud.position.set(x, y, z);
    group.add(cloud);
  }
}

// Posisi ring Misi 1 — busur di atas Teluk Banda antara pulau utama & gunung
export function ringRunPositions() {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const x = 180 + t * 880;
    const z = -180 - t * 520 + Math.sin(t * Math.PI) * 120;
    const y = 95 + Math.sin(t * Math.PI * 2) * 45 + i * 4;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}
