// Toy Plane — plane.js
// Pesawat MAINAN: jet kecil warna cerah (merah-putih) dengan bentuk bulat
// ramah mainan — badan pendek gemuk, sayap lebar, sirip ekor besar, roda kecil.
// Struktur sama seperti sebelumnya (group + propeller + propDisc dikembalikan)
// supaya main.js tidak berubah; baling-baling diganti tutup hidung jet dan
// cakram blur disembunyikan di dalam badan (jet mainan tidak punya baling-baling).
import * as THREE from 'three';

export function buildPlane() {
  const plane = new THREE.Group();
  plane.name = 'ToyPlane';

  const redMat = new THREE.MeshLambertMaterial({ color: 0xe23b2e, flatShading: true });   // merah mainan
  const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf7f3e8, flatShading: true });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x2b2f36 });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x8fd8ff });
  const yellowMat = new THREE.MeshLambertMaterial({ color: 0xffd23f, flatShading: true });

  // Badan gemuk pendek (mainan!) — hidung ke +Z
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.7, 5.6, 12), redMat);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.z = 0.2;
  plane.add(fuselage);

  // Hidung bulat putih
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 10), whiteMat);
  nose.scale.set(1, 0.92, 1.1);
  nose.position.z = 3.0;
  plane.add(nose);
  // Tutup hidung (bekas dudukan baling-baling — jet mainan)
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.5, 10), darkMat);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = 4.0;
  plane.add(cap);

  // Kanopi besar (kaca) — ciri pesawat mainan
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 10), glassMat);
  canopy.scale.set(1, 0.8, 1.6);
  canopy.position.set(0, 0.8, 1.2);
  plane.add(canopy);

  // Sayap lebar putih + ujung kuning
  const wing = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.3, 2.6), whiteMat);
  wing.position.set(0, -0.05, 0.6);
  plane.add(wing);
  for (const s of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.32, 2.6), yellowMat);
    tip.position.set(s * 5.65, -0.05, 0.6);
    plane.add(tip);
  }

  // Ekor: stabilizer + sirip vertikal besar merah
  const tailH = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.24, 1.6), whiteMat);
  tailH.position.set(0, 0.3, -2.7);
  plane.add(tailH);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.4, 1.9), redMat);
  fin.position.set(0, 1.1, -2.7);
  plane.add(fin);

  // Knalpot jet kembar di belakang
  for (const s of [-1, 1]) {
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.7, 8), darkMat);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(s * 0.45, 0.1, -2.75);
    plane.add(exhaust);
  }

  // Lampu navigasi ujung sayap (merah kiri, hijau kanan)
  const lightL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xff2222 }));
  lightL.position.set(-6.25, -0.05, 0.6);
  plane.add(lightL);
  const lightR = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x22ff66 }));
  lightR.position.set(6.25, -0.05, 0.6);
  plane.add(lightR);

  // Roda pendarat kecil (3 titik)
  const wheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.3, 10);
  for (const [wx, wz] of [[-0.95, 1.3], [0.95, 1.3], [0, -2.4]]) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.9, 6), darkMat);
    strut.position.set(wx, -0.9, wz);
    plane.add(strut);
    const wheel = new THREE.Mesh(wheelGeo, darkMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, -1.35, wz);
    plane.add(wheel);
  }

  // Grup "propeller" dipertahankan untuk kompatibilitas main.js (berputar di
  // tempat, tak terlihat — isinya cuma tutup hidung). PropDisc ditaruh DI DALAM
  // badan dengan radius kecil supaya tidak pernah tampak sebagai cakram jet.
  const propeller = new THREE.Group();
  propeller.name = 'Propeller';
  propeller.position.set(0, 0, 4.0);
  plane.add(propeller);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(0.3, 12),
    new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.0, side: THREE.DoubleSide }),
  );
  disc.position.set(0, 0, 0);
  disc.name = 'PropDisc';
  plane.add(disc);

  plane.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  return { group: plane, propeller, propDisc: disc };
}

// Membangun ring emas misi (torus) — sama seperti sebelumnya, dipakai missions.js
export function buildRing(radius = 18) {
  const ring = new THREE.Group();
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 1.6, 10, 32),
    new THREE.MeshLambertMaterial({ color: 0xffd23f, emissive: 0x8a6d00 }),
  );
  ring.add(torus);
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.5, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0 }),
  );
  ring.add(inner);
  return ring;
}
