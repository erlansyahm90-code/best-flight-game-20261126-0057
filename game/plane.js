// Toy Plane — plane.js
// Model pesawat mainan yang dirakit prosedural dari primitif Three.js:
// badan silinder gemuk, hidung bola, kanopi kaca besar, sayap lebar
// berujung kuning, sirip ekor merah, knalpot kembar, lampu navigasi,
// dan tiga roda kecil. Karena ini JET mainan, tidak ada baling-baling
// sungguhan — tetapi kontrak lama dipertahankan: pemanggil menerima
// { group, propeller, propDisc }; grup propeller hanya titik putar
// kosong di hidung dan cakramnya dirender tak terlihat di dalam badan.
import * as THREE from 'three';

// Palet material untuk satu pesawat (Lambert, flat shading gaya mainan).
function toyPalette() {
  return {
    red: new THREE.MeshLambertMaterial({ color: 0xe23b2e, flatShading: true }),
    white: new THREE.MeshLambertMaterial({ color: 0xf7f3e8, flatShading: true }),
    dark: new THREE.MeshLambertMaterial({ color: 0x2b2f36 }),
    glass: new THREE.MeshLambertMaterial({ color: 0x8fd8ff }),
    yellow: new THREE.MeshLambertMaterial({ color: 0xffd23f, flatShading: true }),
  };
}

// Buat satu mesh dari geometri + material, tempatkan, pasang ke induk.
function attach(parent, geometry, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

export function buildPlane() {
  const paint = toyPalette();
  const craft = new THREE.Group();
  craft.name = 'ToyPlane';

  // Badan utama: silinder diputar 90° supaya sumbunya sejajar arah
  // terbang (hidung ke +Z), ujung depan lebih gemuk daripada ekor.
  const body = attach(craft, new THREE.CylinderGeometry(0.95, 0.7, 5.6, 12), paint.red, 0, 0, 0.2);
  body.rotation.x = Math.PI / 2;
  // Hidung bola putih yang sedikit diperas vertikal.
  const nose = attach(craft, new THREE.SphereGeometry(0.95, 12, 10), paint.white, 0, 0, 3.0);
  nose.scale.set(1, 0.92, 1.1);
  // Tutup hidung gelap — sisa dudukan baling-baling dari versi prop.
  const noseCap = attach(craft, new THREE.CylinderGeometry(0.34, 0.4, 0.5, 10), paint.dark, 0, 0, 4.0);
  noseCap.rotation.x = Math.PI / 2;

  // Kanopi: bola kaca diperas memanjang, duduk di atas badan depan.
  const canopy = attach(craft, new THREE.SphereGeometry(0.8, 12, 10), paint.glass, 0, 0.8, 1.2);
  canopy.scale.set(1, 0.8, 1.6);

  // Sayap utama putih melintang, penutup ujung kuning di kedua sisi.
  attach(craft, new THREE.BoxGeometry(12.5, 0.3, 2.6), paint.white, 0, -0.05, 0.6);
  for (const side of [1, -1]) {
    attach(craft, new THREE.BoxGeometry(1.2, 0.32, 2.6), paint.yellow, side * 5.65, -0.05, 0.6);
  }

  // Ekor: stabilizer horizontal putih + sirip vertikal merah besar.
  attach(craft, new THREE.BoxGeometry(4.6, 0.24, 1.6), paint.white, 0, 0.3, -2.7);
  attach(craft, new THREE.BoxGeometry(0.24, 2.4, 1.9), paint.red, 0, 1.1, -2.7);

  // Sepasang knalpot jet di buritan, satu di tiap sisi sumbu badan.
  for (const side of [1, -1]) {
    const jet = attach(craft, new THREE.CylinderGeometry(0.3, 0.36, 0.7, 8), paint.dark, side * 0.45, 0.1, -2.75);
    jet.rotation.x = Math.PI / 2;
  }

  // Lampu navigasi: merah di ujung sayap kiri, hijau di ujung kanan.
  const lampGeo = new THREE.SphereGeometry(0.2, 8, 6);
  attach(craft, lampGeo, new THREE.MeshBasicMaterial({ color: 0xff2222 }), -6.25, -0.05, 0.6);
  attach(craft, lampGeo, new THREE.MeshBasicMaterial({ color: 0x22ff66 }), 6.25, -0.05, 0.6);

  // Tiga roda pendarat (dua di bawah sayap, satu di bawah ekor); tiap
  // roda digantung pada penopang pendek dari badan.
  const tyreGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.3, 10);
  const gearSpots = [[1.3, -0.95], [1.3, 0.95], [-2.4, 0]]; // pasangan [z, x]
  for (const [gz, gx] of gearSpots) {
    attach(craft, new THREE.CylinderGeometry(0.09, 0.09, 0.9, 6), paint.dark, gx, -0.9, gz);
    const tyre = attach(craft, tyreGeo, paint.dark, gx, -1.35, gz);
    tyre.rotation.z = Math.PI / 2;
  }

  // Kontrak kompatibilitas untuk main.js: grup bernama 'Propeller'
  // (berputar di tempat di hidung, tanpa bilah) dan cakram 'PropDisc'
  // beradius kecil dengan opacity awal nol — tidak pernah tampak.
  const spinner = new THREE.Group();
  spinner.name = 'Propeller';
  spinner.position.set(0, 0, 4.0);
  craft.add(spinner);
  const blurDisc = attach(craft,
    new THREE.CircleGeometry(0.3, 12),
    new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.0, side: THREE.DoubleSide }));
  blurDisc.name = 'PropDisc';

  // Bayangan dimatikan untuk semua bagian (gaya render datar mainan).
  craft.traverse((node) => { if (node.isMesh) node.castShadow = false; });
  return { group: craft, propeller: spinner, propDisc: blurDisc };
}

// Ring emas misi: torus tebal kuning menyala dilapisi torus tipis terang
// di sisi dalamnya. missions.js memakainya untuk semua checkpoint.
export function buildRing(radius = 18) {
  const group = new THREE.Group();
  attach(group,
    new THREE.TorusGeometry(radius, 1.6, 10, 32),
    new THREE.MeshLambertMaterial({ color: 0xffd23f, emissive: 0x8a6d00 }));
  attach(group,
    new THREE.TorusGeometry(radius, 0.5, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
  return group;
}
