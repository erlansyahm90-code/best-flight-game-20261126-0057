// Archipelago Air — missions.js
// Tiga misi dengan tujuan BERBEDA + mode terbang bebas:
// 1) Ring Run — tembus 8 ring emas di atas teluk.
// 2) Volcano Survey — lingkari kawah Gunung Api 2 putaran.
// 3) Final Landing — mendarat di runway pulau utama, dinilai kecepatan & sudut.
import * as THREE from 'three';
import { buildRing } from './plane.js';
import { ringRunPositions, VOLCANO, RUNWAY } from './terrain.js';

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

export class Mission {
  constructor(id, scene) {
    this.id = id;
    this.scene = scene;
    this.score = 0;
    this.done = false;
    this.startTime = 0;
    this.ringMeshes = [];
    this.ringIndex = 0;
    this.ringPositions = [];
    this.laps = 0;
    this.prevAngle = null;
    this.accumAngle = 0;
    this.setup();
  }

  setup() {
    if (this.id === 1) {
      this.name = 'MISI 1 — RING RUN';
      this.objective = 'Tembus 8 ring emas di atas Teluk Banda';
      this.ringPositions = ringRunPositions();
      for (const p of this.ringPositions) {
        const ring = buildRing(18);
        ring.position.copy(p);
        // Ring menghadap arah terbang (tegak lurus jalur)
        ring.lookAt(p.x - 100, p.y, p.z + 60);
        ring.userData.baseY = p.y;
        this.scene.add(ring);
        this.ringMeshes.push(ring);
      }
      this.spawn = { pos: new THREE.Vector3(-60, 110, 420), heading: 285 };
    } else if (this.id === 2) {
      this.name = 'MISI 2 — VOLCANO SURVEY';
      this.objective = 'Lingkari kawah Gunung Api 2 putaran (alt > 220 m)';
      // Satu ring penanda di atas kawah
      const ring = buildRing(26);
      ring.position.set(VOLCANO.x, VOLCANO.peakH + 60, VOLCANO.z);
      ring.rotation.x = Math.PI / 2; // horizontal, seperti halo di atas kawah
      this.scene.add(ring);
      this.ringMeshes.push(ring);
      this.spawn = { pos: new THREE.Vector3(VOLCANO.x - 700, 300, VOLCANO.z + 500), heading: 135 };
    } else if (this.id === 3) {
      this.name = 'MISI 3 — FINAL LANDING';
      this.objective = 'Mendarat di runway Pulau Utama — pelan & lurus!';
      this.spawn = { pos: new THREE.Vector3(-1150, 150, 0), heading: 270 };
    } else {
      this.name = 'TERBANG BEBAS';
      this.objective = 'Jelajahi kepulauan. Jaga bahan bakar!';
      this.spawn = { pos: new THREE.Vector3(0, 120, 600), heading: 0 };
    }
  }

  start(clockSec) { this.startTime = clockSec; }

  elapsed(clockSec) { return Math.max(0, clockSec - this.startTime); }

  progressText() {
    if (this.id === 1) return `Ring ${Math.min(this.ringIndex, 8)} / 8`;
    if (this.id === 2) return `Putaran ${Math.min(this.laps, 2)} / 2 · ${Math.round(this.accumAngle)}°`;
    if (this.id === 3) return 'Menuju runway… jaga speed < 80 kt';
    return 'Terbang bebas';
  }

  // Dipanggil tiap frame. Return {event: 'ring'|'lap'|'done'|'landing', ...} atau null.
  update(state, clockSec) {
    if (this.done) return null;
    if (this.id === 1) return this.updateRingRun(state, clockSec);
    if (this.id === 2) return this.updateSurvey(state, clockSec);
    if (this.id === 3) return this.updateLanding(state, clockSec);
    return null;
  }

  updateRingRun(state, clockSec) {
    if (this.ringIndex >= this.ringPositions.length) return null;
    const target = this.ringPositions[this.ringIndex];
    const d = state.position.distanceTo(target);
    // Ring aktif berdenyut
    const active = this.ringMeshes[this.ringIndex];
    const pulse = 1 + Math.sin(clockSec * 4) * 0.12;
    active.scale.setScalar(pulse);
    if (d < 17) {
      this.ringIndex++;
      const timeBonus = Math.max(0, 60 - Math.round(this.elapsed(clockSec)));
      this.score += 100 + timeBonus;
      active.visible = false;
      if (this.ringIndex >= this.ringPositions.length) {
        this.done = true;
        const total = this.score + 200;
        this.score = total;
        return { event: 'done', text: 'SEMUA RING DITEMBUS!', detail: `8 ring · waktu ${fmtTime(this.elapsed(clockSec))} · bonus akhir +200` };
      }
      return { event: 'ring', text: `RING ${this.ringIndex}/8! +${100 + timeBonus}`, detail: '' };
    }
    return null;
  }

  updateSurvey(state, clockSec) {
    const dx = state.position.x - VOLCANO.x;
    const dz = state.position.z - VOLCANO.z;
    const dist = Math.hypot(dx, dz);
    const angle = Math.atan2(dz, dx) * 180 / Math.PI;
    const highEnough = state.position.y > 220;
    const nearRing = dist > 320 && dist < 900;
    if (highEnough && nearRing) {
      if (this.prevAngle !== null) {
        let d = angle - this.prevAngle;
        while (d > 180) d -= 360;
        while (d < -180) d += 360;
        this.accumAngle += Math.abs(d);
        const lapsNow = Math.floor(this.accumAngle / 360);
        if (lapsNow > this.laps) {
          this.laps = lapsNow;
          this.score += 150;
          if (this.laps >= 2) {
            this.done = true;
            this.score += 200;
            return { event: 'done', text: 'SURVEI SELESAI — 2 PUTARAN!', detail: `Kawah Gunung Api terdokumentasi · waktu ${fmtTime(this.elapsed(clockSec))} · bonus +200` };
          }
          return { event: 'lap', text: `PUTARAN ${this.laps}/2 SELESAI! +150`, detail: '' };
        }
      }
      this.prevAngle = angle;
    } else {
      // Keluar zona: reset sudut acuan supaya tidak lompat
      this.prevAngle = null;
    }
    return null;
  }

  updateLanding(state) {
    if (state.landed) {
      this.done = true;
      const quality = state.landingScore();
      this.score = 300 + quality * 2;
      const verdict = quality >= 80 ? 'MULUS SEKALI!' : quality >= 55 ? 'MENDARAT DENGAN BAIK' : 'MENDARAT KASAR';
      return {
        event: 'done', text: verdict,
        detail: `Nilai landing ${quality}/100 · speed ${Math.round(state.speedKnots())} kt · skor misi ${this.score}`,
      };
    }
    return null;
  }

  dispose() {
    for (const r of this.ringMeshes) this.scene.remove(r);
    this.ringMeshes = [];
  }
}
