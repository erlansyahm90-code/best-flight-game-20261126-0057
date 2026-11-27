// Toy Plane — hud.js
// Instrumen HUD yang menyala: kecepatan, kompas heading, ketinggian,
// bahan bakar, kerusakan, skor misi, timer, peringatan stall, dan banner akhir.
import { MAX_FUEL } from './physics.js';

const $ = (id) => document.getElementById(id);
const HEADING_NAMES = ['UTARA', 'TIMUR LAUT', 'TIMUR', 'TENGGARA', 'SELATAN', 'BARAT DAYA', 'BARAT', 'BARAT LAUT'];

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function compassTape(headingDeg) {
  // Pita kompas: huruf + derajat tiap 30°, digeser supaya heading saat ini di tengah
  const marks = [];
  for (let d = 0; d < 360; d += 30) {
    const label = d === 0 ? 'N' : d === 90 ? 'E' : d === 180 ? 'S' : d === 270 ? 'W' : String(d).padStart(3, '0');
    marks.push({ d, label });
  }
  let html = '';
  for (const m of marks) {
    let diff = m.d - headingDeg;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    if (Math.abs(diff) < 52) {
      // Jepit posisi supaya label tidak terpotong di tepi strip
      const x = Math.min(90, Math.max(10, 50 + diff * 1.05)); // persen dari tengah
      html += `<span style="position:absolute;left:${x}%;transform:translateX(-50%)">${m.label}</span>`;
    }
  }
  return html;
}

export class Hud {
  constructor() {
    this.els = {
      speed: $('hud-speed'), throttle: $('hud-throttle'), barThrottle: $('bar-throttle'),
      heading: $('hud-heading'), headingName: $('hud-heading-name'), tape: $('compass-tape'),
      alt: $('hud-alt'), vs: $('hud-vs'), barAlt: $('bar-alt'),
      missionName: $('hud-mission-name'), missionObj: $('hud-mission-obj'),
      missionProgress: $('hud-mission-progress'), score: $('hud-score'), time: $('hud-time'),
      barFuel: $('bar-fuel'), damage: $('hud-damage'), barDamage: $('bar-damage'),
      warning: $('hud-warning'), toast: $('hud-toast'),
      banner: $('banner'), bannerCard: $('banner-card'), bannerTitle: $('banner-title'),
      bannerSub: $('banner-sub'), bannerScoreNum: $('banner-score-num'),
      bannerDetail: $('banner-detail'),
    };
    this.toastTimer = null;
  }

  show() { $('hud').classList.remove('hidden'); }
  hide() { $('hud').classList.add('hidden'); }

  update(state, mission) {
    const e = this.els;
    e.speed.textContent = Math.round(state.speedKnots());
    e.throttle.textContent = Math.round(state.throttle * 100);
    e.barThrottle.style.width = (state.throttle * 100) + '%';
    const hd = state.headingDeg();
    e.heading.textContent = String(Math.round(hd)).padStart(3, '0');
    e.headingName.textContent = HEADING_NAMES[Math.round(hd / 45) % 8];
    e.tape.innerHTML = compassTape(hd);
    e.alt.textContent = Math.round(Math.max(0, state.position.y));
    e.vs.textContent = (state.verticalSpeed >= 0 ? '+' : '') + state.verticalSpeed.toFixed(1);
    e.barAlt.style.width = Math.min(100, (state.position.y / 120) * 100) + '%';
    e.barFuel.style.width = (state.fuel / MAX_FUEL * 100) + '%';
    e.barFuel.style.background = state.fuel < 25 ? '#ff9f1c' : '#39d98a';
    e.damage.textContent = Math.round(state.damage);
    e.barDamage.style.width = state.damage + '%';
    e.time.textContent = fmtTime(state.flightTime);

    if (mission) {
      e.missionName.textContent = mission.name;
      e.missionObj.textContent = mission.objective;
      e.missionProgress.textContent = mission.progressText();
      e.score.textContent = mission.score;
    } else {
      e.missionName.textContent = 'TERBANG BEBAS';
      e.missionObj.textContent = 'Jelajahi rumah raksasa. Jaga bahan bakar!';
      e.missionProgress.textContent = 'Alt maks ' + Math.round(state.maxAlt) + ' m';
      e.score.textContent = 0;
    }

    if (state.stalled) e.warning.classList.remove('hidden');
    else e.warning.classList.add('hidden');
  }

  toast(msg, ms = 2600) {
    const t = this.els.toast;
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
  }

  showBanner(kind, title, sub, score, detail) {
    const e = this.els;
    e.bannerCard.classList.remove('success', 'crash');
    e.bannerCard.classList.add(kind === 'crash' ? 'crash' : 'success');
    e.bannerTitle.textContent = title;
    e.bannerSub.textContent = sub;
    e.bannerScoreNum.textContent = score;
    e.bannerDetail.textContent = detail;
    e.banner.classList.remove('hidden');
  }

  hideBanner() { this.els.banner.classList.add('hidden'); }
}
