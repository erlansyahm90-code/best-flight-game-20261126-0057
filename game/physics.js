// Toy Plane — physics.js
// Simulasi terbang gaya arcade untuk pesawat mainan: throttle dan
// kecepatan, belok banking, pitch, stall, konsumsi bahan bakar,
// kerusakan akibat benturan, dan penilaian kualitas pendaratan.
// Medan tabrakan tidak lagi tetap: heightfield, plafon, zona
// pendaratan, dan runway semuanya ditanyakan ke dunia AKTIF lewat
// worlds.js (kamar Bab 1, rumah Bab 2, taman Bab 3). Sentuhan lembut
// di dalam zona sah dunia aktif dicatat sebagai `landed` beserta
// nama zonanya di `landingZone`.
import * as THREE from 'three';
import { terrainHeight, isOverLand, ceilingY, landingZones, activeRunway } from './worlds.js';

export const MAX_SPEED = 95;      // m/s pada throttle penuh
export const STALL_SPEED = 26;    // m/s — di bawah ini sayap kehilangan lift
export const CRUISE_SPEED = 55;
export const MAX_FUEL = 100;

const WORLD_RADIUS = 2300;        // tepi dunia: pesawat diputar balik lembut

export class FlightState {
  constructor() {
    this.reset(new THREE.Vector3(0, 60, 500), 0);
  }

  // Nolkan sikap terbang (dipakai reset & respawn).
  _levelAttitude() {
    this.pitch = 0;
    this.bank = 0;
    this.verticalSpeed = 0;
    this.stalled = false;
    this.onGround = false;
    this.crashed = false;
    this.landed = false;
    this.landingZone = null;
  }

  reset(pos, headingDeg) {
    this.position = pos.clone();
    this.heading = THREE.MathUtils.degToRad(headingDeg); // 0 = ke -Z (utara)
    this._levelAttitude();
    this.speed = 0;
    this.throttle = 0;
    this.fuel = MAX_FUEL;
    this.damage = 0;
    this.flightTime = 0;
    this.maxAlt = 0;
    this.graceUntil = 0;
  }

  // Respawn di CHECKPOINT misi ring: mulai lagi dari ring terakhir
  // dengan badan pulih dan bahan bakar minimal 60. Jam terbang dan
  // skor misi sengaja TIDAK disentuh — progres pemain dipertahankan.
  respawn(pos, headingDeg) {
    this.position = pos.clone();
    this.heading = THREE.MathUtils.degToRad(headingDeg);
    this._levelAttitude();
    this.speed = 55;
    this.throttle = 0.65;
    this.damage = 0;
    this.fuel = Math.max(this.fuel, 60);
    this.graceUntil = this.flightTime + 2;
  }

  // input: {thrUp, thrDn, left, right, up, down} boolean
  update(dt, input) {
    if (this.crashed || this.landed) return;
    dt = Math.min(dt, 0.05);
    this.flightTime += dt;

    // Throttle digeser pemain; laju naik 0.55/dtk, turun 0.7/dtk.
    if (input.thrUp) this.throttle = Math.min(1, this.throttle + dt * 0.55);
    if (input.thrDn) this.throttle = Math.max(0, this.throttle - dt * 0.7);

    // Kecepatan mengejar throttle * MAX_SPEED secara eksponensial;
    // mengejarnya lebih malas saat throttle hidup daripada mati.
    const speedGoal = this.throttle * MAX_SPEED;
    const approach = this.throttle > 0 ? 6 : 9;
    this.speed += (speedGoal - this.speed) * Math.min(1, approach * dt / MAX_SPEED * 10);
    // Komponen gravitasi sepanjang lintasan: mendaki mengerem,
    // menukik mempercepat.
    this.speed -= Math.sin(this.pitch) * 14 * dt;
    this.speed = Math.max(0, this.speed);

    // Stall: di bawah STALL_SPEED (dan jelas di atas permukaan) hidung
    // dipaksa jatuh ke -14° sampai kecepatan pulih.
    const surfaceHere = terrainHeight(this.position.x, this.position.z);
    this.stalled = this.speed < STALL_SPEED && this.position.y > surfaceHere + 4;
    if (this.stalled) {
      this.pitch += (THREE.MathUtils.degToRad(-14) - this.pitch) * Math.min(1, dt * 1.2);
    }

    // Banking: A/◀ meminta miring kiri (+), D/▶ miring kanan (−);
    // heading berubah sebanding bank dan kecepatan (banking turn).
    const bankGoal = (input.left ? 1 : 0) * 0.62 - (input.right ? 1 : 0) * 0.62;
    this.bank += (bankGoal - this.bank) * Math.min(1, dt * 3.2);
    this.heading -= this.bank * (this.speed / MAX_SPEED) * 1.15 * dt;

    // Pitch mengikuti input naik/turun dengan batas asimetris.
    const pitchGoal = (input.up ? 1 : 0) * 0.32 - (input.down ? 1 : 0) * 0.26;
    this.pitch += (pitchGoal - this.pitch) * Math.min(1, dt * 2.6);

    // Maju sepanjang vektor hidung.
    const noseDir = new THREE.Vector3(
      -Math.sin(this.heading) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.heading) * Math.cos(this.pitch),
    );
    this.position.addScaledVector(noseDir, this.speed * dt);

    // Vertikal: panjat dari pitch yang diskalakan lift, ditambah
    // sink saat stall (-14) atau melayang nyaris diam (-2.5).
    const liftScale = THREE.MathUtils.clamp(this.speed / CRUISE_SPEED, 0, 1.35);
    const climbRate = Math.sin(this.pitch) * this.speed * liftScale;
    const sinkRate = this.stalled ? -14 : (this.speed < 8 ? -2.5 : 0);
    this.verticalSpeed = climbRate + sinkRate;
    this.position.y += this.verticalSpeed * dt;

    // Plafon dunia aktif (kamar/rumah 104, taman terbuka 500).
    const ceiling = ceilingY();
    if (this.position.y > ceiling) {
      this.position.y = ceiling;
      if (this.verticalSpeed > 0) this.verticalSpeed = 0;
    }

    // Bahan bakar terbakar sebanding throttle; tangki kosong mematikan
    // throttle dan pesawat tinggal melayang turun.
    if (this.throttle > 0.02 && this.speed > 1) {
      this.fuel = Math.max(0, this.fuel - this.throttle * dt * 0.55);
      if (this.fuel <= 0) this.throttle = 0;
    }

    this.maxAlt = Math.max(this.maxAlt, this.position.y);

    // Tepi dunia: di luar radius, heading dibelokkan halus menuju pusat.
    const distFromCenter = Math.hypot(this.position.x, this.position.z);
    if (distFromCenter > WORLD_RADIUS) {
      const headingHome = Math.atan2(-this.position.x, -this.position.z);
      let turnDiff = headingHome - this.heading;
      while (turnDiff > Math.PI) turnDiff -= Math.PI * 2;
      while (turnDiff < -Math.PI) turnDiff += Math.PI * 2;
      this.heading += THREE.MathUtils.clamp(turnDiff, -1, 1) * dt * 0.8;
    }

    this.checkCollision();
  }

  checkCollision() {
    const surface = terrainHeight(this.position.x, this.position.z);
    const gap = this.position.y - surface;

    // Masa tenggang pasca-benturan/respawn: jangan menghukum dua kali
    // untuk satu sentuhan.
    if (this.flightTime < this.graceUntil) return;

    if (gap <= 1.4) {
      // Apakah sentuhan ini cukup lembut untuk disebut mendarat, dan
      // apakah titiknya di dalam zona sah dunia aktif?
      const softEnough = this.speed < 42 && this.verticalSpeed > -6 && Math.abs(this.pitch) < 0.28;
      const { x, z } = this.position;
      const pad = landingZones().find((zn) => x >= zn.x0 && x <= zn.x1 && z >= zn.z0 && z <= zn.z1);
      if (pad && softEnough && this.speed > 4) {
        this.landed = true;
        this.landingZone = pad.name;
        this.position.y = pad.top + 1.4;
        this.speed = Math.max(0, this.speed - 12);
        return;
      }
      // Bukan pendaratan: benturan. Energi tumbukan menentukan rusak;
      // yang selamat terpental sedikit dan dapat jeda 1,5 detik.
      const impactLoad = Math.abs(this.verticalSpeed) + this.speed * 0.35;
      this.damage = Math.min(100, this.damage + Math.min(60, 12 + impactLoad * 1.6));
      this.position.y = surface + 1.4;
      if (this.damage >= 100 || impactLoad > 26) {
        this.crashed = true;
      } else {
        this.speed *= 0.55;
        this.verticalSpeed = 5;
        this.position.y = surface + 6;
        this.graceUntil = this.flightTime + 1.5;
      }
      return;
    }
    // Jatuh ke air: permukaan di bawah 1.5 dianggap air dan fatal.
    if (!isOverLand(this.position.x, this.position.z) && this.position.y < 1.2) {
      this.damage = 100;
      this.crashed = true;
      this.position.y = 1.2;
    }
  }

  // Arah hadap dalam derajat 0-359 (0 = utara)
  headingDeg() {
    let deg = THREE.MathUtils.radToDeg(this.heading) % 360;
    if (deg < 0) deg += 360;
    return deg;
  }

  speedKnots() {
    return this.speed * 1.944;
  }

  // Penilaian landing untuk misi pendaratan (0..100): potongan untuk
  // kecepatan berlebih, sudut hidung, kemiringan sayap, kekerasan
  // turun, dan jarak dari sumbu runway dunia aktif.
  landingScore() {
    const strip = activeRunway();
    let points = 100;
    points -= Math.max(0, (this.speed - 22)) * 1.6;
    points -= Math.abs(THREE.MathUtils.radToDeg(this.pitch)) * 1.4;
    points -= Math.abs(THREE.MathUtils.radToDeg(this.bank)) * 0.9;
    points -= Math.abs(this.verticalSpeed) * 3;
    points -= Math.abs(this.position.x - strip.x) / strip.halfLen * 12;
    return Math.max(0, Math.round(points));
  }
}
