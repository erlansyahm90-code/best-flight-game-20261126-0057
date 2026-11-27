// Toy Plane — missions.js
// Mesin misi generik yang digerakkan data bab (chapters.js), API sama
// persis dengan misi prototipe: skor di misi, update() mengembalikan
// event {event, text, detail}, checkpointRespawn() mengembalikan
// {pos, headingDeg}. Satu kelas untuk tiga bab cerita:
//  Bab 1 KAMAR ANAK — 5 ring keliling kamar, finis MENDARAT di meja belajar.
//  Bab 2 KABUR DARI RUMAH — 5 ring Rev7, keluar jendela, finis di istana pasir.
//  Bab 3 TAMAN BERMAIN ANAK — 5 ring slalom ayunan, finis di putaran berputar.
// Ring = +100 poin + CHECKPOINT respawn (model koin Mario); finis +200.
import * as THREE from 'three';
import { buildRing } from './plane.js';
import { CHAPTERS, FREE_FLIGHT } from './chapters.js';

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
    this.setup();
  }

  setup() {
    const data = this.id === 0 ? FREE_FLIGHT : CHAPTERS[this.id];
    this.data = data;
    this.name = data.name;
    this.objective = data.objective;
    this.spawn = data.spawn;
    this.finish = data.finish || null;
    if (data.rings) {
      this.ringPositions = data.rings;
      for (let i = 0; i < data.rings.length; i++) {
        const p = data.rings[i];
        const ring = buildRing(18);
        ring.position.copy(p);
        // Ring tegak lurus arah jalur (menghadap titik berikutnya);
        // ring terakhir menghadap titik finis bab.
        const next = data.rings[i + 1] || this.finish.target;
        ring.lookAt(next.x, next.y, next.z);
        ring.userData.baseY = p.y;
        this.scene.add(ring);
        this.ringMeshes.push(ring);
      }
      this.refreshRingColors();
    }
  }

  get hasRings() { return this.ringPositions.length > 0; }

  // Status warna ring (spesifikasi bos, Rev4): SEMUA ring yang belum
  // terkumpul = EMAS TERANG (satu status tunggal), sudah terkumpul =
  // HIJAU permanen (tetap terlihat). Denyut skala pada target berikutnya
  // dipertahankan. Warna selalu diturunkan dari ringIndex, jadi tetap
  // benar sesudah respawn checkpoint.
  refreshRingColors() {
    const COL = {
      done: { torus: 0x2fd35a, emissive: 0x0e7a28, inner: 0xd2ffd9 },
      gold: { torus: 0xffd23f, emissive: 0x8a6d00, inner: 0xfff2b0 },
    };
    for (let i = 0; i < this.ringMeshes.length; i++) {
      const ring = this.ringMeshes[i];
      const c = i < this.ringIndex ? COL.done : COL.gold;
      ring.children[0].material.color.setHex(c.torus);
      ring.children[0].material.emissive.setHex(c.emissive);
      ring.children[1].material.color.setHex(c.inner);
      ring.visible = true;
      if (i !== this.ringIndex) ring.scale.setScalar(1);
    }
  }

  start(clockSec) { this.startTime = clockSec; }

  elapsed(clockSec) { return Math.max(0, clockSec - this.startTime); }

  progressText() {
    if (!this.hasRings) return 'Terbang bebas';
    if (this.ringIndex >= this.ringPositions.length) return this.finish.hint;
    return `Checkpoint ${this.ringIndex} / ${this.ringPositions.length}`;
  }

  // Dipanggil tiap frame. Return {event: 'ring'|'done', text, detail} atau null.
  update(state, clockSec) {
    if (this.done || !this.hasRings) return null;

    // Semua ring terkumpul → cek finis sesuai tipe bab.
    if (this.ringIndex >= this.ringPositions.length) return this.updateFinish(state, clockSec);

    const target = this.ringPositions[this.ringIndex];
    const d = state.position.distanceTo(target);
    // Ring aktif berdenyut
    const active = this.ringMeshes[this.ringIndex];
    active.scale.setScalar(1 + Math.sin(clockSec * 4) * 0.12);
    if (d < 17) {
      // Ring = POIN + CHECKPOINT: +100, progres tersimpan; ring yang
      // sudah lewat berubah HIJAU permanen, tidak perlu diulang.
      const idx = this.ringIndex;
      this.ringIndex++;
      this.score += 100;
      this.refreshRingColors();
      const special = this.data.ringToasts && this.data.ringToasts[idx];
      if (special) return { event: 'ring', text: special, detail: '' };
      if (this.ringIndex >= this.ringPositions.length) {
        return { event: 'ring', text: `CHECKPOINT ${this.ringIndex}/${this.ringPositions.length}! +100 — ${this.finish.hint.toUpperCase()}`, detail: '' };
      }
      return { event: 'ring', text: `CHECKPOINT ${this.ringIndex}/${this.ringPositions.length}! +100`, detail: '' };
    }
    return null;
  }

  updateFinish(state, clockSec) {
    const f = this.finish;
    if (f.type === 'flare') {
      // Pemicu utama: masuk zona finis rendah (< top+10) & pelan (< 50).
      // Sentuhan lembut yang terdaftar `landed` oleh physics di zona
      // land finis juga diterima.
      const p = state.position;
      const inZone = p.x >= f.zone.x0 && p.x <= f.zone.x1 && p.z >= f.zone.z0 && p.z <= f.zone.z1;
      const flare = inZone && p.y < f.zone.top + 10 && state.speed < 50;
      const touchedDown = state.landed && state.landingZone === f.landZoneName;
      if (flare || touchedDown) {
        this.done = true;
        this.score += f.bonus;
        return {
          event: 'done', text: f.text,
          detail: touchedDown
            ? `Nilai landing ${state.landingScore()}/100 · waktu ${fmtTime(this.elapsed(clockSec))} · bonus finis +${f.bonus}`
            : `${this.ringPositions.length} checkpoint · waktu ${fmtTime(this.elapsed(clockSec))} · bonus finis +${f.bonus}`,
        };
      }
      return null;
    }
    // 'land': touchdown lembut wajib di zona landasan finis bab.
    if (state.landed && state.landingZone === f.zoneName) {
      this.done = true;
      this.score += f.bonus;
      return {
        event: 'done', text: f.text,
        detail: `Nilai landing ${state.landingScore()}/100 · waktu ${fmtTime(this.elapsed(clockSec))} · bonus finis +${f.bonus}`,
      };
    }
    return null;
  }

  // Titik respawn checkpoint: posisi ring terakhir yang dilewati, hidung
  // menghadap ring berikutnya (atau titik finis bila semua ring selesai).
  // Return null bila belum ada checkpoint — restart penuh dari spawn.
  checkpointRespawn() {
    if (!this.hasRings || this.ringIndex <= 0) return null;
    const last = this.ringPositions[this.ringIndex - 1];
    const target = this.ringIndex < this.ringPositions.length
      ? this.ringPositions[this.ringIndex]
      : this.finish.respawnTarget;
    const headingDeg = THREE.MathUtils.radToDeg(
      Math.atan2(-(target.x - last.x), -(target.z - last.z)));
    const pos = last.clone();
    pos.y += 1;
    return { pos, headingDeg };
  }

  dispose() {
    for (const r of this.ringMeshes) this.scene.remove(r);
    this.ringMeshes = [];
  }
}
