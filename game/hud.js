// Toy Plane — hud.js
// Lapisan instrumen di atas canvas: angka kecepatan dan ketinggian,
// pita kompas berjalan, bar throttle / bahan bakar / kerusakan, info
// misi dan skor, jam terbang, peringatan stall, toast, serta banner
// akhir permainan. Kelas Hud membaca FlightState + Mission tiap tick
// dan menulis hasilnya ke elemen-elemen tetap di index.html.
import { MAX_FUEL } from './physics.js';

const byId = (id) => document.getElementById(id);

// Nama delapan arah mata angin, indeks 0 = utara, searah jarum jam.
const COMPASS_POINTS = ['UTARA', 'TIMUR LAUT', 'TIMUR', 'TENGGARA', 'SELATAN', 'BARAT DAYA', 'BARAT', 'BARAT LAUT'];

// Detik -> "MM:SS" dengan nol di depan.
function clockText(totalSec) {
  const minutes = Math.floor(totalSec / 60);
  const seconds = Math.floor(totalSec % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Label untuk satu garis pita kompas: huruf arah pada kelipatan 90°,
// angka derajat (3 digit) pada kelipatan 30° lainnya.
function tapeLabel(deg) {
  if (deg === 0) return 'N';
  if (deg === 90) return 'E';
  if (deg === 180) return 'S';
  if (deg === 270) return 'W';
  return String(deg).padStart(3, '0');
}

// HTML isi pita kompas untuk heading tertentu: semua label dalam
// jendela ±52° digambar absolut, heading saat ini selalu di tengah.
function tapeHtml(headingDeg) {
  const parts = [];
  for (let deg = 0; deg < 360; deg += 30) {
    let offset = deg - headingDeg;
    while (offset > 180) offset -= 360;
    while (offset < -180) offset += 360;
    if (Math.abs(offset) >= 52) continue;
    // Jepit ke 10%..90% supaya label tepi tidak terpotong strip.
    const pct = Math.min(90, Math.max(10, 50 + offset * 1.05));
    parts.push(`<span style="position:absolute;left:${pct}%;transform:translateX(-50%)">${tapeLabel(deg)}</span>`);
  }
  return parts.join('');
}

// Peta kunci internal -> id elemen di index.html.
const EL_IDS = {
  speed: 'hud-speed', throttle: 'hud-throttle', barThrottle: 'bar-throttle',
  heading: 'hud-heading', headingName: 'hud-heading-name', tape: 'compass-tape',
  alt: 'hud-alt', vs: 'hud-vs', barAlt: 'bar-alt',
  missionName: 'hud-mission-name', missionObj: 'hud-mission-obj',
  missionProgress: 'hud-mission-progress', score: 'hud-score', time: 'hud-time',
  barFuel: 'bar-fuel', damage: 'hud-damage', barDamage: 'bar-damage',
  warning: 'hud-warning', toast: 'hud-toast',
  banner: 'banner', bannerCard: 'banner-card', bannerTitle: 'banner-title',
  bannerSub: 'banner-sub', bannerScoreNum: 'banner-score-num',
  bannerDetail: 'banner-detail',
};

export class Hud {
  constructor() {
    this.els = {};
    for (const key of Object.keys(EL_IDS)) this.els[key] = byId(EL_IDS[key]);
    this.toastTimer = null;
  }

  show() { byId('hud').classList.remove('hidden'); }
  hide() { byId('hud').classList.add('hidden'); }

  update(state, mission) {
    const e = this.els;
    // Blok kecepatan & throttle.
    e.speed.textContent = Math.round(state.speedKnots());
    e.throttle.textContent = Math.round(state.throttle * 100);
    e.barThrottle.style.width = `${state.throttle * 100}%`;
    // Blok arah: angka derajat, nama mata angin, dan pita berjalan.
    const hd = state.headingDeg();
    e.heading.textContent = String(Math.round(hd)).padStart(3, '0');
    e.headingName.textContent = COMPASS_POINTS[Math.round(hd / 45) % 8];
    e.tape.innerHTML = tapeHtml(hd);
    // Blok ketinggian & laju vertikal (bar jenuh pada 120 m).
    e.alt.textContent = Math.round(Math.max(0, state.position.y));
    e.vs.textContent = (state.verticalSpeed >= 0 ? '+' : '') + state.verticalSpeed.toFixed(1);
    e.barAlt.style.width = `${Math.min(100, (state.position.y / 120) * 100)}%`;
    // Blok sumber daya: bahan bakar (oranye bila < 25) dan kerusakan.
    e.barFuel.style.width = `${(state.fuel / MAX_FUEL) * 100}%`;
    e.barFuel.style.background = state.fuel < 25 ? '#ff9f1c' : '#39d98a';
    e.damage.textContent = Math.round(state.damage);
    e.barDamage.style.width = `${state.damage}%`;
    e.time.textContent = clockText(state.flightTime);

    // Blok misi: dengan misi aktif tampilkan datanya; tanpa misi,
    // mode terbang bebas menampilkan rekor ketinggian sesi ini.
    if (mission) {
      e.missionName.textContent = mission.name;
      e.missionObj.textContent = mission.objective;
      e.missionProgress.textContent = mission.progressText();
      e.score.textContent = mission.score;
    } else {
      e.missionName.textContent = 'TERBANG BEBAS';
      e.missionObj.textContent = 'Jelajahi rumah raksasa. Jaga bahan bakar!';
      e.missionProgress.textContent = `Alt maks ${Math.round(state.maxAlt)} m`;
      e.score.textContent = 0;
    }

    // Peringatan stall mengikuti status stall pesawat.
    e.warning.classList.toggle('hidden', !state.stalled);
  }

  // Pesan singkat di tengah layar; panggilan baru menimpa timer lama.
  toast(msg, ms = 2600) {
    const el = this.els.toast;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.add('hidden'), ms);
  }

  // Banner akhir: kind 'crash' berwarna gagal, selain itu sukses.
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
