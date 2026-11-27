// Toy Plane — physics.js
// Model terbang arcade: throttle, banking, pitch, lift & stall,
// tabrakan perabot/lantai, bahan bakar, kerusakan, dan penilaian landing.
// Adaptasi 3 bab: heightfield, langit-langit, zona pendaratan & runway
// diambil dari dunia AKTIF (worlds.js) — kamar (Bab 1), rumah (Bab 2),
// taman (Bab 3). Sentuhan lembut di zona pendaratan sah dunia aktif
// tercatat sebagai `landed` + `landingZone` (nama zonanya).
import * as THREE from 'three';
import { terrainHeight, isOverLand, ceilingY, landingZones, activeRunway } from './worlds.js';

export const MAX_SPEED = 95;      // m/s pada throttle penuh
export const STALL_SPEED = 26;    // m/s — di bawah ini pesawat stall
export const CRUISE_SPEED = 55;
export const MAX_FUEL = 100;

export class FlightState {
  constructor() {
    this.reset(new THREE.Vector3(0, 60, 500), 0);
  }

  reset(pos, headingDeg) {
    this.position = pos.clone();
    this.heading = THREE.MathUtils.degToRad(headingDeg); // 0 = ke -Z (utara)
    this.pitch = 0;      // radian, + = hidung naik
    this.bank = 0;       // radian, + = miring kiri (sayap kiri turun)
    this.speed = 0;
    this.throttle = 0;
    this.verticalSpeed = 0;
    this.fuel = MAX_FUEL;
    this.damage = 0;
    this.stalled = false;
    this.onGround = false;
    this.crashed = false;
    this.landed = false;
    this.landingZone = null;
    this.flightTime = 0;
    this.maxAlt = 0;
    this.graceUntil = 0;
  }

  // Respawn di CHECKPOINT (Misi 1): posisi & arah diatur dari ring terakhir,
  // kerusakan dipulihkan penuh, bahan bakar diisi sampai minimal 60.
  // Waktu terbang & skor misi TIDAK disentuh — progres pemain tersimpan.
  respawn(pos, headingDeg) {
    this.position = pos.clone();
    this.heading = THREE.MathUtils.degToRad(headingDeg);
    this.pitch = 0;
    this.bank = 0;
    this.speed = 55;
    this.throttle = 0.65;
    this.verticalSpeed = 0;
    this.damage = 0;
    this.stalled = false;
    this.onGround = false;
    this.crashed = false;
    this.landed = false;
    this.landingZone = null;
    this.fuel = Math.max(this.fuel, 60);
    this.graceUntil = this.flightTime + 2;
  }

  // input: {thrUp, thrDn, left, right, up, down} boolean
  update(dt, input) {
    if (this.crashed || this.landed) return;
    dt = Math.min(dt, 0.05);
    this.flightTime += dt;

    // --- Throttle ---
    if (input.thrUp) this.throttle = Math.min(1, this.throttle + dt * 0.55);
    if (input.thrDn) this.throttle = Math.max(0, this.throttle - dt * 0.7);

    // --- Kecepatan: mendekati throttle * MAX_SPEED ---
    const targetSpeed = this.throttle * MAX_SPEED;
    const accel = this.throttle > 0 ? 6 : 9; // melambat lebih cepat saat throttle 0
    this.speed += (targetSpeed - this.speed) * Math.min(1, accel * dt / MAX_SPEED * 10);
    // Mendaki menguras kecepatan, menukik menambah
    this.speed -= Math.sin(this.pitch) * 14 * dt;
    this.speed = Math.max(0, this.speed);

    // --- Stall: terlalu lambat = kehilangan lift, hidung jatuh ---
    this.stalled = this.speed < STALL_SPEED && this.position.y > terrainHeight(this.position.x, this.position.z) + 4;
    if (this.stalled) {
      this.pitch += (THREE.MathUtils.degToRad(-14) - this.pitch) * Math.min(1, dt * 1.2);
    }

    // --- Banking & belok ---
    // targetBank: A/◀ = + (miring kiri), D/▶ = − (miring kanan).
    // Belok mengikuti bank: heading berkurang = belok kiri, bertambah = kanan.
    const targetBank = (input.left ? 1 : 0) * 0.62 - (input.right ? 1 : 0) * 0.62;
    this.bank += (targetBank - this.bank) * Math.min(1, dt * 3.2);
    // Belok sebanding bank & kecepatan (banking turn)
    this.heading -= this.bank * (this.speed / MAX_SPEED) * 1.15 * dt;

    // --- Pitch ---
    const targetPitch = (input.up ? 1 : 0) * 0.32 - (input.down ? 1 : 0) * 0.26;
    this.pitch += (targetPitch - this.pitch) * Math.min(1, dt * 2.6);
    // Pitch di bawah stall dibatasi (hidung sudah jatuh sendiri)

    // --- Gerak maju ---
    const fwd = new THREE.Vector3(
      -Math.sin(this.heading) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.heading) * Math.cos(this.pitch),
    );
    this.position.addScaledVector(fwd, this.speed * dt);

    // --- Lift / sink ---
    const liftFactor = THREE.MathUtils.clamp(this.speed / CRUISE_SPEED, 0, 1.35);
    const climb = Math.sin(this.pitch) * this.speed * liftFactor;
    const sink = this.stalled ? -14 : (this.speed < 8 ? -2.5 : 0);
    this.verticalSpeed = climb + sink;
    this.position.y += this.verticalSpeed * dt;

    // --- Plafon dunia aktif: kamar/rumah 104, taman terbuka 500 ---
    const ceil = ceilingY();
    if (this.position.y > ceil) {
      this.position.y = ceil;
      if (this.verticalSpeed > 0) this.verticalSpeed = 0;
    }

    // --- Bahan bakar: habis sebanding throttle ---
    if (this.throttle > 0.02 && this.speed > 1) {
      this.fuel = Math.max(0, this.fuel - this.throttle * dt * 0.55);
      if (this.fuel <= 0) this.throttle = 0; // kehabisan bahan bakar = melayang
    }

    this.maxAlt = Math.max(this.maxAlt, this.position.y);

    // --- Batas dunia: putar balik lembut di tepi ---
    const R = 2300;
    const distC = Math.hypot(this.position.x, this.position.z);
    if (distC > R) {
      const back = Math.atan2(-this.position.x, -this.position.z);
      let diff = back - this.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.heading += THREE.MathUtils.clamp(diff, -1, 1) * dt * 0.8;
    }

    // --- Tabrakan ---
    this.checkCollision();
  }

  checkCollision() {
    const ground = terrainHeight(this.position.x, this.position.z);
    const clearance = this.position.y - ground;

    // Jeda pasca-sentuhan: jangan hukum dua kali untuk satu benturan.
    if (this.flightTime < this.graceUntil) return;

    if (clearance <= 1.4) {
      // Sentuhan lembut di zona pendaratan sah dunia aktif (landasan bab,
      // pasir istana Bab 2, cakram putaran Bab 3) = landing sah.
      const gentle = this.speed < 42 && this.verticalSpeed > -6 && Math.abs(this.pitch) < 0.28;
      const { x, z } = this.position;
      const zone = landingZones().find((zn) => x >= zn.x0 && x <= zn.x1 && z >= zn.z0 && z <= zn.z1);
      if (zone && gentle && this.speed > 4) {
        this.landed = true;
        this.landingZone = zone.name;
        this.position.y = zone.top + 1.4;
        this.speed = Math.max(0, this.speed - 12);
        return;
      }
      // Bukan landing: tabrakan — sentuhan ringan bisa selamat, hantaman keras tidak.
      const impact = Math.abs(this.verticalSpeed) + this.speed * 0.35;
      this.damage = Math.min(100, this.damage + Math.min(60, 12 + impact * 1.6));
      this.position.y = ground + 1.4;
      if (this.damage >= 100 || impact > 26) {
        this.crashed = true;
      } else {
        // Sentuhan keras tapi selamat: pantul sedikit, kecepatan hilang,
        // dan jeda 1,5 detik tanpa tabrakan supaya tidak mati beruntun.
        this.speed *= 0.55;
        this.verticalSpeed = 5;
        this.position.y = ground + 6;
        this.graceUntil = this.flightTime + 1.5;
      }
      return;
    }
    // Terjun ke laut (terrain di bawah 1.5 = air)
    if (!isOverLand(this.position.x, this.position.z) && this.position.y < 1.2) {
      this.damage = 100;
      this.crashed = true;
      this.position.y = 1.2;
    }
  }

  // Arah hadap dalam derajat 0-359 (0 = utara)
  headingDeg() {
    let d = THREE.MathUtils.radToDeg(this.heading) % 360;
    if (d < 0) d += 360;
    return d;
  }

  speedKnots() {
    return this.speed * 1.944;
  }

  // Penilaian landing untuk Misi 3 (0..100)
  landingScore() {
    let score = 100;
    score -= Math.max(0, (this.speed - 22)) * 1.6;          // terlalu kencang
    score -= Math.abs(THREE.MathUtils.radToDeg(this.pitch)) * 1.4; // sudut
    score -= Math.abs(THREE.MathUtils.radToDeg(this.bank)) * 0.9;  // sayap miring
    score -= Math.abs(this.verticalSpeed) * 3;              // turun terlalu keras
    const rw = activeRunway();
    score -= Math.abs(this.position.x - rw.x) / rw.halfLen * 12; // jauh dari tengah
    return Math.max(0, Math.round(score));
  }
}
