// Toy Plane — terrain.js — DUNIA BAB 2 "KABUR DARI RUMAH"
// Rumah raksasa dilihat dari ketinggian pesawat mainan: ruang keluarga,
// dapur, dan halaman belakang berisi bak pasir dengan istana pasir.
// Tabrakan bermuara pada satu fungsi, terrainHeight(x, z): tinggi
// permukaan teratas pada kolom itu (lantai 0, karpet 1.2, meja makan
// 26, dinding 120). Dinding selatan dapur punya bukaan jendela — ambang
// 18, atas 100 — dan pesawat keluar lewat sana, bukan menembus dinding.
// Posisi ring Bab 2 tinggal di chapters.js (doktrin Rev7).
import * as THREE from 'three';

// Meja makan berperan sebagai runway bab ini (dipakai physics.js).
export const RUNWAY = { x: -285, z: 0, halfLen: 55, halfWid: 20, headingDeg: 270, height: 26 };
export const CEILING_Y = 104; // plafon lunak rumah — pesawat terkurung di dalam
export const WALL_TOP = 120;
// Target survei Misi 2: lampu gantung di atas karpet.
export const SURVEY = { x: -180, z: 0, y: 86, minDist: 45, maxDist: 125, minAlt: 55 };
// Jendela keluar di DINDING SELATAN dapur. Letaknya tegak lurus poros
// ambang pintu, jadi sesudah masuk dapur pemain wajib membelok ±90° ke
// selatan: bukaan x 118..182 pada bidang z = 196, ambang y 18, atas 100.
export const WINDOW = { cx: 150, z: 196, halfWid: 32, sillY: 18, topY: 100 };
// Bak pasir FINIS di halaman selatan: permukaan pasir top 3. Zona
// mendarat (land) = pasir TANPA istana; istana duduk di sudut timur.
export const SANDBOX = {
  x0: 120, x1: 210, z0: 310, z1: 380, top: 3,
  land: { x0: 126, x1: 168, z0: 316, z1: 374 },
  castle: { x: 190, z: 360 },
};

// ---- Tabel kotak tabrakan AABB: B(x0, x1, z0, z1, top) ----
const B = (x0, x1, z0, z1, top) => ({ x0, x1, z0, z1, top });
const BOXES = [
  // Dinding luar rumah (top 120)
  B(-372, -360, -202, 202, WALL_TOP),   // barat
  B(300, 312, -202, 202, WALL_TOP),     // timur (utuh — jendela sudah pindah)
  B(-372, 312, -202, -190, WALL_TOP),   // utara
  // Dinding selatan, terpotong bukaan jendela dapur (x 118..182, ambang 18)
  B(-372, 118, 190, 202, WALL_TOP),     // selatan sebelah barat jendela
  B(182, 312, 190, 202, WALL_TOP),      // selatan sebelah timur jendela
  B(118, 182, 190, 202, 18),            // ambang jendela selatan
  // Dinding pembagi ruang keluarga/dapur + ambang pintu (celah z -38..38)
  B(-15, -5, -202, -38, WALL_TOP),
  B(-15, -5, 38, 202, WALL_TOP),
  // Lantai berkarpet dan keset
  B(-300, -40, -120, 120, 1.2),         // karpet ruang keluarga
  B(-28, 8, -26, 26, 1.1),              // keset merah di ambang pintu
  // Meja makan (RUNWAY) dan empat kursinya: dudukan, lalu sandaran
  B(-340, -230, -20, 20, RUNWAY.height),
  B(-314, -296, 24, 42, 23),
  B(-314, -296, -42, -24, 23),
  B(-267, -249, 24, 42, 23),
  B(-267, -249, -42, -24, 23),
  B(-314, -296, 38, 42, 46),
  B(-314, -296, -42, -38, 46),
  B(-267, -249, 38, 42, 46),
  B(-267, -249, -42, -38, 46),
  // Sofa utara: dudukan, sandaran belakang, dua lengan
  B(-245, -145, -188, -138, 20),
  B(-245, -145, -188, -170, 38),
  B(-245, -232, -170, -138, 30),
  B(-158, -145, -170, -138, 30),
  // Meja kopi di atas karpet
  B(-218, -168, -62, -22, 14),
  // Rak buku menempel dinding barat
  B(-358, -332, -45, 95, 96),
  // Tanaman pot raksasa (kotak perkiraan pot + tajuk daun)
  B(-62, -22, -162, -122, 62),
  // Lampu lantai di samping sofa
  B(-118, -110, -158, -150, 58),
  // Buku-buku raksasa tergeletak di lantai
  B(-142, -96, 38, 86, 7),              // buku merah
  B(-96, -52, -98, -58, 6),             // buku biru
  B(168, 214, -64, -22, 7),             // buku hijau (dapur)
  // Kardus penyimpanan
  B(-72, -34, 88, 126, 23),
  // Dapur: counter dinding utara, kulkas, pulau dapur
  B(15, 245, -190, -152, 30),
  B(248, 296, -188, -142, 80),
  B(88, 152, 38, 86, 28),
  // Halaman selatan: permukaan bak pasir + istana (rintangan)
  B(120, 210, 310, 380, 3),
  B(174, 206, 342, 378, 15),
  // Pagar keliling halaman
  B(-160, 460, 640, 648, 9),            // pagar selatan
  B(-160, -152, 202, 648, 9),           // pagar barat
  B(452, 460, 202, 648, 9),             // pagar timur
  // Batang-batang pohon halaman
  B(36, 44, 326, 334, 26),
  B(306, 314, 326, 334, 26),
  B(76, 84, 536, 544, 26),
  B(296, 304, 556, 564, 26),
];

export function terrainHeight(x, z) {
  let highest = 0;
  for (const b of BOXES) {
    if (b.top <= highest) continue;
    if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1) highest = b.top;
  }
  return highest;
}

export function isOverLand(x, z) {
  return terrainHeight(x, z) > 1.5;
}

// ---------- Pembangun mesh ----------
// Kotak berwarna pada posisi tertentu; opts.flat menyalakan flat
// shading, opts.emissive menambah pijar, opts.ry memutar pada sumbu Y.
function putBox(parent, w, h, d, color, cx, cy, cz, opts = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color, flatShading: !!opts.flat, emissive: opts.emissive || 0x000000 }),
  );
  mesh.position.set(cx, cy, cz);
  if (opts.ry) mesh.rotation.y = opts.ry;
  parent.add(mesh);
  return mesh;
}

// Silinder berwarna (selalu flat shading), seg = jumlah sisi.
function putCyl(parent, rTop, rBottom, h, color, cx, cy, cz, seg = 12) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBottom, h, seg),
    new THREE.MeshLambertMaterial({ color, flatShading: true }),
  );
  mesh.position.set(cx, cy, cz);
  parent.add(mesh);
  return mesh;
}

const WOOD = 0xa9743a, WOOD_DARK = 0x8a5a2a, WALL = 0xf6dfae, WALL_K = 0xf3d49b;
const CREAM = 0xfff3d6, RED = 0xc93b2e, TEAL = 0x2e8f86, ORANGE = 0xf08c1e;

export function buildTerrain(scene) {
  const root = new THREE.Group();
  root.name = 'HouseInterior';

  // Lantai kayu: papan lebar + garis-garis papan gelap melintang.
  putBox(root, 672, 2, 404, WOOD, -30, -1, 0);
  for (let i = 0, pz = -182; i < 15; i++, pz += 26) {
    putBox(root, 672, 0.3, 1.6, WOOD_DARK, -30, 0.05, pz);
  }
  // Plafon krem dan balok-balok kayu di bawahnya.
  putBox(root, 672, 2, 404, 0xf9ecca, -30, 111, 0);
  for (let i = 0, bx = -320; i < 6; i++, bx += 120) {
    putBox(root, 4, 3, 404, WOOD_DARK, bx, 109, 0);
  }

  // Karpet ruang keluarga bertumpuk: dasar krem, lapisan merah,
  // dan panel krem di tengahnya.
  putBox(root, 264, 1.0, 244, 0xe8dcc0, -170, 0.5, 0);
  putBox(root, 244, 1.2, 224, 0xc93b2e, -170, 0.6, 0);
  putBox(root, 120, 1.35, 100, 0xe8dcc0, -170, 0.65, 0);
  // Keset merah berbingkai krem tepat di ambang pintu.
  putBox(root, 36, 1.1, 52, RED, -10, 0.55, 0);
  putBox(root, 28, 1.2, 44, CREAM, -10, 0.6, 0);

  raiseWalls(root);
  furnishLiving(root);
  furnishKitchen(root);
  buildYard(root);
  scene.add(root);
  return root;
}

function raiseWalls(g) {
  const H = 110, T = 12, midY = H / 2;
  // Barat, utara, timur: dinding utuh setinggi rumah.
  putBox(g, T, H, 404, WALL, -366, midY, 0);
  putBox(g, 684, H, T, WALL, -30, midY, -196);
  putBox(g, T, H, 404, WALL_K, 306, midY, 0);
  // Selatan: segmen barat + timur, kusen bawah ambang, dan kusen atas
  // jendela — menyisakan bukaan x 118..182, y 18..100.
  putBox(g, 490, H, T, WALL, -127, midY, 196);
  putBox(g, 130, H, T, WALL_K, 247, midY, 196);
  putBox(g, 64, 18, T, WALL_K, 150, 9, 196);
  putBox(g, 64, 10, T, WALL_K, 150, 105, 196);
  // Pembagi antar-ruang: dua segmen dengan celah pintu z -38..38 dan
  // kusen atas pintu (murni visual, y 95..110).
  putBox(g, 10, H, 152, WALL, -10, midY, -114);
  putBox(g, 10, H, 152, WALL, -10, midY, 114);
  putBox(g, 10, 15, 76, WALL, -10, 102.5, 0);
  // Kusen jendela putih + palang silang pada bidang z=196.
  const FRAME = 0xffffff;
  putBox(g, 68, 4, 3, FRAME, 150, 19, 195);
  putBox(g, 68, 4, 3, FRAME, 150, 99, 195);
  putBox(g, 4, 82, 3, FRAME, 119, 59, 195);
  putBox(g, 4, 82, 3, FRAME, 181, 59, 195);
  putBox(g, 2.4, 82, 3, FRAME, 150, 59, 195);
  putBox(g, 64, 2.4, 3, FRAME, 150, 59, 195);
  // Gorden oranye-merah menggantung di sisi dalam dapur, mengapit jendela.
  putBox(g, 13, 84, 4, 0xe2543e, 110, 58, 192);
  putBox(g, 13, 84, 4, 0xe2543e, 190, 58, 192);
  // Hiasan dinding ruang keluarga: dua lukisan dan jam bundar.
  putBox(g, 44, 30, 1.5, TEAL, -150, 58, 189);
  putBox(g, 36, 22, 1.8, ORANGE, -150, 58, 189);
  putBox(g, 30, 38, 1.5, 0x7a4fa3, -70, 60, 189);
  putCyl(g, 11, 11, 1.6, 0xffffff, -255, 66, 189, 20).rotation.x = Math.PI / 2;
}

function furnishLiving(g) {
  // Meja makan (RUNWAY): papan atas berlapis dan empat kaki sudut.
  putBox(g, 114, 4, 44, 0x9c6a34, RUNWAY.x, RUNWAY.height - 2, 0);
  putBox(g, 118, 1.2, 48, 0xb57e42, RUNWAY.x, RUNWAY.height - 0.2, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    putBox(g, 5, RUNWAY.height - 4, 5, WOOD_DARK, RUNWAY.x + sx * 50, (RUNWAY.height - 4) / 2, sz * 17);
  }
  // Garis tengah landasan putih di atas meja — penanda arah lepas landas.
  for (let dx = -44; dx <= 44; dx += 16) {
    putBox(g, 9, 0.3, 2, 0xffffff, RUNWAY.x + dx, RUNWAY.height + 0.55, 0);
  }
  // Piring dan gelas raksasa di ujung meja (jangan ditabrak!).
  putCyl(g, 9, 7, 1.6, 0xffffff, -248, RUNWAY.height + 0.8, 12, 16);
  putCyl(g, 3.2, 2.6, 7, 0x9fd8ff, -240, RUNWAY.height + 3.5, -11, 10);

  // Empat kursi makan: dudukan, sandaran (arah flip), empat kaki.
  const placeChair = (cx, cz, flip) => {
    putBox(g, 18, 2.5, 18, 0x7a4a22, cx, 22, cz);
    putBox(g, 18, 24, 2.5, 0x7a4a22, cx, 34, cz + flip * 8);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      putBox(g, 2.4, 21, 2.4, WOOD_DARK, cx + sx * 7, 10.5, cz + sz * 7);
    }
  };
  placeChair(-305, 33, 1); placeChair(-305, -33, -1);
  placeChair(-258, 33, 1); placeChair(-258, -33, -1);

  // Sofa oranye: alas, sandaran, dua lengan, dua bantalan duduk,
  // dan dua bantal lepas yang dimiringkan.
  putBox(g, 100, 14, 50, ORANGE, -195, 7, -163);
  putBox(g, 100, 38, 18, 0xd97a16, -195, 19, -179);
  putBox(g, 13, 30, 50, 0xd97a16, -238.5, 15, -163);
  putBox(g, 13, 30, 50, 0xd97a16, -151.5, 15, -163);
  putBox(g, 44, 6, 40, 0xffa63e, -219, 17, -160);
  putBox(g, 44, 6, 40, 0xffa63e, -171, 17, -160);
  putBox(g, 16, 16, 6, TEAL, -228, 24, -168).rotation.x = 0.2;
  putBox(g, 16, 16, 6, RED, -162, 24, -168).rotation.x = 0.2;

  // Meja kopi berkaki empat, di atasnya buku dan cangkir.
  putBox(g, 50, 3, 40, 0x8a5a2a, -193, 12.5, -42);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    putBox(g, 3, 11, 3, WOOD_DARK, -193 + sx * 21, 5.5, -42 + sz * 15);
  }
  putBox(g, 20, 3, 15, TEAL, -200, 15.5, -45, { ry: 0.3 });
  putCyl(g, 3.4, 2.8, 4.5, 0xffffff, -178, 16, -36, 10);

  // Rak buku: badan rak, empat papan rak, dan deretan buku warna-warni
  // dengan tinggi semu-deterministik per posisi.
  putBox(g, 26, 96, 140, 0x7a4a22, -345, 48, 25);
  const spineColors = [0xc93b2e, 0x2e8f86, 0xf2b134, 0x3f6fb5, 0x7a4fa3, 0x58a05c, 0xe2703a];
  for (let shelf = 0; shelf < 4; shelf++) {
    const shelfY = 6 + shelf * 24;
    putBox(g, 2, 2, 132, 0x5d3a1a, -331, shelfY, 25);
    for (let i = 0; i < 11; i++) {
      const bookH = 13 + ((i * 7 + shelf * 3) % 6);
      putBox(g, 7, bookH, 8.5, spineColors[(i + shelf * 2) % spineColors.length],
        -334, shelfY + 2 + bookH / 2, -32 + i * 11.5);
    }
  }

  // Tanaman pot raksasa: pot, batang, dan gumpalan-gumpalan daun.
  putCyl(g, 15, 11, 18, 0xb5502e, -42, 9, -142, 14);
  putCyl(g, 2.2, 3, 22, 0x6b4423, -42, 28, -142, 8);
  const foliage = new THREE.MeshLambertMaterial({ color: 0x2f9e44, flatShading: true });
  const leafBlobs = [[-42, 52, -142, 24], [-58, 44, -134, 17], [-26, 45, -150, 16], [-42, 62, -138, 15]];
  for (const [lx, ly, lz, lr] of leafBlobs) {
    const blob = new THREE.Mesh(new THREE.SphereGeometry(lr, 8, 6), foliage);
    blob.position.set(lx, ly, lz);
    blob.scale.y = 0.8;
    g.add(blob);
  }

  // Lampu lantai di samping sofa: alas, tiang, kap kerucut kuning.
  putCyl(g, 6, 7, 1.5, 0x444444, -114, 0.75, -154, 10);
  putCyl(g, 0.9, 0.9, 48, 0x444444, -114, 25, -154, 6);
  const floorShade = new THREE.Mesh(new THREE.ConeGeometry(11, 12, 12, 1, true),
    new THREE.MeshLambertMaterial({ color: 0xf2b134, side: THREE.DoubleSide }));
  floorShade.position.set(-114, 53, -154);
  g.add(floorShade);
  // Lampu gantung target survei: tali, kap oranye, bohlam menyala.
  putCyl(g, 0.7, 0.7, 22, 0x555555, SURVEY.x, 99, SURVEY.z, 6);
  const pendantShade = new THREE.Mesh(new THREE.ConeGeometry(15, 13, 14, 1, true),
    new THREE.MeshLambertMaterial({ color: 0xe2703a, side: THREE.DoubleSide }));
  pendantShade.position.set(SURVEY.x, 90, SURVEY.z);
  g.add(pendantShade);
  const pendantBulb = new THREE.Mesh(new THREE.SphereGeometry(4.5, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
  pendantBulb.position.set(SURVEY.x, 84, SURVEY.z);
  g.add(pendantBulb);

  // Buku raksasa tergeletak (merah dan biru) dan kardus terbuka.
  placeBook(g, -119, 62, 46, 7, 48, RED, 0.12);
  placeBook(g, -74, -78, 44, 6, 40, 0x3f6fb5, -0.18);
  putBox(g, 38, 23, 38, 0xbb8a52, -53, 11.5, 107);                 // badan kardus
  putBox(g, 40, 2, 12, 0xa1763f, -53, 24, 92, { ry: 0.5 });       // tutup terbuka (1)
  putBox(g, 40, 2, 12, 0xa1763f, -53, 24, 122, { ry: -0.4 });     // tutup terbuka (2)
}

// Buku tergeletak: halaman kertas di tengah, sampul berwarna membungkus
// bawah dan atasnya; keseluruhan diputar ry pada sumbu Y.
function placeBook(g, cx, cz, w, h, d, color, ry) {
  putBox(g, w, h * 0.45, d, 0xf5efdd, cx, h * 0.55, cz, { ry });      // halaman
  putBox(g, w + 2, h * 0.4, d + 2, color, cx, h * 0.2, cz, { ry });   // sampul bawah
  putBox(g, w + 2, h * 0.25, d + 2, color, cx, h * 0.9, cz, { ry });  // sampul atas
}

function furnishKitchen(g) {
  // Counter teal sepanjang dinding utara + permukaan kerja krem +
  // kabinet gantung cokelat.
  putBox(g, 230, 30, 38, 0x2e8f86, 130, 15, -171);
  putBox(g, 234, 2.5, 42, 0xe8dcc0, 130, 31, -171);
  putBox(g, 200, 28, 22, 0x7a4a22, 120, 71, -179);
  // Di atas counter: kompor dengan panci, dan wastafel.
  putBox(g, 34, 1.2, 26, 0x2b2f36, 60, 32.8, -171);
  putCyl(g, 8, 7, 6, 0x888888, 60, 35, -171, 12);
  putBox(g, 40, 1.2, 24, 0xb9c4c9, 170, 32.6, -171);
  // Kulkas putih besar: badan, garis pintu, tiga magnet warna.
  putBox(g, 48, 80, 46, 0xf2f2f2, 272, 40, -165);
  putBox(g, 48, 2, 46, 0xcccccc, 272, 56, -165);
  putBox(g, 5, 5, 1, RED, 258, 62, -141.5);
  putBox(g, 5, 5, 1, TEAL, 268, 52, -141.5);
  putBox(g, 5, 5, 1, ORANGE, 282, 66, -141.5);
  // Pulau dapur: badan kayu, permukaan krem, mangkuk buah berisi tiga
  // bola buah, dan dua bangku di sisinya.
  putBox(g, 64, 26, 48, 0xa9743a, 120, 13, 62);
  putBox(g, 68, 2.5, 52, 0xe8dcc0, 120, 27, 62);
  putCyl(g, 9, 5, 4, 0xc93b2e, 120, 30, 62, 12);
  const fruitSpots = [[116, 58, 0xf2b134], [124, 60, 0x58a05c], [120, 67, 0xe2703a]];
  for (const [fx, fz, fc] of fruitSpots) {
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 6),
      new THREE.MeshLambertMaterial({ color: fc }));
    fruit.position.set(fx, 33, fz);
    g.add(fruit);
  }
  putBox(g, 14, 16, 14, 0x7a4a22, 78, 8, 100);
  putBox(g, 14, 16, 14, 0x7a4a22, 162, 8, 100);
  // Buku hijau tergeletak di lantai dapur.
  placeBook(g, 191, -43, 46, 7, 42, 0x58a05c, 0.22);
  // Tanaman kecil di ambang jendela selatan, di dalam dapur.
  putCyl(g, 5, 4, 6, 0xb5502e, 128, 21, 193, 8);
  const herb = new THREE.Mesh(new THREE.SphereGeometry(8, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0x2f9e44, flatShading: true }));
  herb.position.set(128, 29, 193);
  g.add(herb);
}

function buildYard(g) {
  // Halaman SELATAN di luar jendela: hamparan rumput, dinding langit
  // biru di kejauhan dengan cakram matahari, pagar kayu keliling,
  // jalan setapak, pohon-pohon, dan bak pasir finis.
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(820, 520),
    new THREE.MeshLambertMaterial({ color: 0x58a05c }));
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(150, -0.2, 440);
  g.add(grass);
  const skyPanel = new THREE.Mesh(new THREE.PlaneGeometry(1100, 460),
    new THREE.MeshBasicMaterial({ color: 0xbfe6ff }));
  skyPanel.rotation.y = Math.PI; // menghadap kembali ke rumah (-Z)
  skyPanel.position.set(150, 180, 706);
  g.add(skyPanel);
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(34, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff3a0 }));
  sunDisc.rotation.y = Math.PI;
  sunDisc.position.set(430, 260, 700);
  g.add(sunDisc);
  // Pagar kayu: tiga sisi (selatan z=644, barat x=-156, timur x=456)
  // plus tiang-tiang pagar berkala.
  const FENCE = 0xb0894f;
  putBox(g, 620, 9, 2, FENCE, 150, 4.5, 644);
  putBox(g, 2, 9, 442, FENCE, -156, 4.5, 423);
  putBox(g, 2, 9, 442, FENCE, 456, 4.5, 423);
  for (let fx = -150; fx <= 455; fx += 55) putBox(g, 3, 11, 3, 0x8a6a38, fx, 5.5, 644);
  for (let fz = 215; fz <= 640; fz += 55) {
    putBox(g, 3, 11, 3, 0x8a6a38, -156, 5.5, fz);
    putBox(g, 3, 11, 3, 0x8a6a38, 456, 5.5, fz);
  }
  // Jalan setapak krem dari bawah jendela menuju bak pasir.
  putBox(g, 26, 0.3, 118, 0xe8dcc0, 152, 0.15, 257);
  // Pohon halaman: batang silinder (bertabrakan, top 26) dan tajuk
  // kerucut di atasnya — [x, z, tinggi total].
  const trees = [[40, 330, 52], [310, 330, 60], [80, 540, 46], [300, 560, 56]];
  for (const [tx, tz, th] of trees) {
    putCyl(g, 3, 4.5, th * 0.5, 0x7a5230, tx, th * 0.25, tz, 7);
    const coneTop = new THREE.Mesh(new THREE.ConeGeometry(th * 0.34, th * 0.8, 8),
      new THREE.MeshLambertMaterial({ color: 0x2f8f3a, flatShading: true }));
    coneTop.position.set(tx, th * 0.5 + th * 0.38, tz);
    g.add(coneTop);
  }
  buildSandpit(g);
}

function buildSandpit(g) {
  // Bak pasir anak: rangka kayu empat sisi, permukaan pasir (top y=3),
  // istana pasir berbendera di sudut timur, ember dan sekop sebagai
  // properti — zona mendarat di sisi barat dibiarkan bersih.
  const SAND = 0xf2d492, SAND_D = 0xe3c078, FRAME = 0x9c6a34;
  putBox(g, 84, 3, 64, SAND, 165, 1.5, 345);                        // permukaan pasir
  putBox(g, 94, 5, 6, FRAME, 165, 2.5, 307);                        // rangka utara
  putBox(g, 94, 5, 6, FRAME, 165, 2.5, 383);                        // rangka selatan
  putBox(g, 6, 5, 70, FRAME, 117, 2.5, 345);                        // rangka barat
  putBox(g, 6, 5, 70, FRAME, 213, 2.5, 345);                        // rangka timur
  // Istana: alas, dua menara silinder beratap kerucut, menara tengah
  // kotak, dan bendera merah pada tiangnya.
  putBox(g, 26, 7, 22, SAND_D, 190, 6.5, 360);
  putCyl(g, 4.5, 5.5, 13, SAND_D, 180, 9.5, 350, 10);
  putCyl(g, 4.5, 5.5, 13, SAND_D, 200, 9.5, 370, 10);
  const roofMat = new THREE.MeshLambertMaterial({ color: 0xd9ae62, flatShading: true });
  for (const [rx, rz] of [[180, 350], [200, 370]]) {
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.5, 6, 10), roofMat);
    roof.position.set(rx, 19, rz);
    g.add(roof);
  }
  putBox(g, 9, 12, 9, SAND_D, 190, 9, 360);
  putCyl(g, 0.5, 0.5, 11, 0x8a5a2a, 190, 20, 360, 6);               // tiang bendera
  putBox(g, 8, 4.5, 0.4, RED, 194.2, 23.5, 360);                    // bendera merah
  // Ember terbalik dan sekop tergeletak di atas pasir.
  putCyl(g, 3.2, 4.2, 4.5, TEAL, 138, 5.2, 330, 10);
  putBox(g, 1.2, 1.2, 9, 0xe2703a, 146, 3.8, 356, { ry: 0.6 });     // gagang sekop
  putBox(g, 4, 1, 5, 0xf2b134, 150, 3.6, 360, { ry: 0.6 });         // mata sekop
}

// ---------- Definisi dunia untuk worlds.js (Bab 2) ----------
// Zona pendaratan sah: permukaan meja makan (nama 'meja') dan bagian
// bak pasir tanpa istana (nama 'pasir', sama dengan SANDBOX.land) —
// sentuhan lembut di zona ini didaftarkan physics sebagai `landed`.
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
