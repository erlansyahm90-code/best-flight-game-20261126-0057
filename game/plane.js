// Archipelago Air — plane.js
// Model pesawat propeller low-poly yang TERLIHAT dibangun:
// badan, sayap, ekor, baling-baling berputar, roda, lampu ujung sayap.
import * as THREE from 'three';

export function buildPlane() {
  const plane = new THREE.Group();
  plane.name = 'PlayerPlane';

  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xff7a1a, flatShading: true }); // oranye
  const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf5f2e8, flatShading: true });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x22262b });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x9fd8ff });

  // Badan utama (silinder sepanjang sumbu Z, hidung ke -Z? hidung ke +Z di Three = depan)
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.55, 6.4, 10), bodyMat);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.z = 0.4;
  plane.add(fuselage);

  // Hidung
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.6, 10), whiteMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = 4.4;
  plane.add(nose);

  // Kanopi kokpit (kaca)
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.72, 10, 8), glassMat);
  canopy.scale.set(1, 0.75, 1.7);
  canopy.position.set(0, 0.75, 1.6);
  plane.add(canopy);

  // Sayap utama
  const wing = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.28, 2.4), whiteMat);
  wing.position.set(0, 0.05, 0.9);
  plane.add(wing);
  // Ujung sayap oranye
  for (const s of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 2.4), bodyMat);
    tip.position.set(s * 5.7, 0.05, 0.9);
    plane.add(tip);
  }

  // Stabilizer horizontal + sirip vertikal ekor
  const tailH = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 1.5), whiteMat);
  tailH.position.set(0, 0.25, -2.9);
  plane.add(tailH);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.2, 1.8), bodyMat);
  fin.position.set(0, 1.0, -2.9);
  plane.add(fin);

  // Lampu navigasi ujung sayap (merah kiri, hijau kanan)
  const lightL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xff2222 }));
  lightL.position.set(-6.25, 0.05, 0.9);
  plane.add(lightL);
  const lightR = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x22ff66 }));
  lightR.position.set(6.25, 0.05, 0.9);
  plane.add(lightR);

  // Roda pendarat (3 titik)
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10);
  for (const [wx, wz] of [[-0.9, 1.4], [0.9, 1.4], [0, -2.6]]) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.9, 6), darkMat);
    strut.position.set(wx, -0.9, wz);
    plane.add(strut);
    const wheel = new THREE.Mesh(wheelGeo, darkMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, -1.35, wz);
    plane.add(wheel);
  }

  // Baling-baling: hub + 2 bilah, diputar di update
  const propeller = new THREE.Group();
  propeller.name = 'Propeller';
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.5, 8), darkMat);
  hub.rotation.x = Math.PI / 2;
  propeller.add(hub);
  const bladeGeo = new THREE.BoxGeometry(0.34, 3.6, 0.12);
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const blade1 = new THREE.Mesh(bladeGeo, bladeMat);
  propeller.add(blade1);
  const blade2 = new THREE.Mesh(bladeGeo, bladeMat);
  blade2.rotation.z = Math.PI / 2;
  propeller.add(blade2);
  propeller.position.set(0, 0, 5.35);
  plane.add(propeller);

  // Cakram blur baling-baling saat throttle tinggi (semi transparan)
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.9, 24),
    new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.0, side: THREE.DoubleSide }),
  );
  disc.position.set(0, 0, 5.35);
  disc.name = 'PropDisc';
  plane.add(disc);

  plane.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  return { group: plane, propeller, propDisc: disc };
}

// Membangun ring emas misi (torus) — dipakai missions.js
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
