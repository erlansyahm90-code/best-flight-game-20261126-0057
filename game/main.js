// Toy Plane — main.js
// Loop game, input keyboard + sentuh, kamera chase/cockpit, menu PILIH BAB
// dengan selingan cerita (story interstitial), preset screenshot
// (?shot=...), dan pengait playtest. Tiga bab cerita dalam tiga dunia:
// Bab 1 kamar anak (bedroom.js), Bab 2 rumah (terrain.js), Bab 3 taman
// bermain (playground.js) — perpindahan dunia lewat worlds.js.
import * as THREE from 'three';
import { buildWorlds, setWorld, tickWorld, terrainHeight, activeRunway } from './worlds.js';
import { CHAPTERS } from './chapters.js';
import { buildPlane } from './plane.js';
import { FlightState } from './physics.js';
import { Hud } from './hud.js';
import { Mission } from './missions.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const isTouchDevice = ('ontouchstart' in window) || window.innerWidth < 760 || params.has('touch');

// ---------- Scene ----------
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffd9a0); // cahaya siang hangat dari jendela
scene.fog = new THREE.Fog(0xf3d9ae, 650, 2400);

const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 9000);
camera.position.set(-200, 60, 120);

const hemi = new THREE.HemisphereLight(0xfff3d6, 0x8a5a2a, 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe9bb, 1.5);
sun.position.set(200, 320, 700); // sinar masuk dari arah jendela selatan
scene.add(sun);

buildWorlds(scene);
const { group: planeGroup, propeller, propDisc } = buildPlane();
scene.add(planeGroup);

// ---------- State ----------
const state = new FlightState();
const hud = new Hud();
let mission = null;
let cameraMode = 'chase'; // 'chase' | 'cockpit'
let started = false;
let ended = false;
let menuOrbit = 0;

// Suasana langit per dunia: kamar/rumah = cahaya siang hangat dari
// jendela; taman bermain = langit biru terbuka (latar + kabut diselaraskan).
function applyMood(worldId) {
  if (worldId === 3) {
    scene.background.set(0x9fd3f0);
    scene.fog.color.set(0xcfe4f7);
  } else {
    scene.background.set(0xffd9a0);
    scene.fog.color.set(0xf3d9ae);
  }
}

let stagedChapter = 0; // bab yang sedang ditampilkan di layar cerita
// Fokus orbit kamera menu: default meja makan dunia rumah (pesawat parkir);
// saat bab dipilih, fokus pindah ke titik spawn bab itu.
const menuFocus = { x: -300, y: 26, z: 0, r: 78 };

// Parkir pesawat di atas meja makan (dunia rumah) untuk latar menu
function parkInHouse() {
  setWorld(2);
  applyMood(2);
  state.reset(new THREE.Vector3(-305, activeRunway().height + 1.4, 0), 270);
  state.throttle = 0;
  state.speed = 0;
  menuFocus.x = -300; menuFocus.y = 26; menuFocus.z = 0; menuFocus.r = 78;
  syncPlaneMesh();
}
parkInHouse();

// ---------- Input ----------
const input = { thrUp: false, thrDn: false, left: false, right: false, up: false, down: false };
const KEYMAP = {
  KeyW: 'thrUp', ArrowUp: 'up', KeyS: 'thrDn', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
};
addEventListener('keydown', (e) => {
  if (KEYMAP[e.key] || KEYMAP[e.code]) { input[KEYMAP[e.key] || KEYMAP[e.code]] = true; e.preventDefault(); }
  if (e.code === 'KeyV') toggleCamera();
  if (e.code === 'KeyR') restartMission();
  if (!started && (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3')) {
    stageChapter(Number(e.code.slice(-1)));
  }
  if (e.code === 'Digit0' && !started) startMission(0);
  if (e.code === 'Enter' && !started && stagedChapter) startMission(stagedChapter);
});
addEventListener('keyup', (e) => {
  if (KEYMAP[e.key] || KEYMAP[e.code]) input[KEYMAP[e.key] || KEYMAP[e.code]] = false;
});

// Kontrol sentuh
function bindTouch(id, key) {
  const btn = $(id);
  const on = (e) => { e.preventDefault(); input[key] = true; btn.classList.add('active'); };
  const off = (e) => { e.preventDefault(); input[key] = false; btn.classList.remove('active'); };
  btn.addEventListener('pointerdown', on);
  btn.addEventListener('pointerup', off);
  btn.addEventListener('pointerleave', off);
  btn.addEventListener('pointercancel', off);
}
bindTouch('btn-left', 'left');
bindTouch('btn-right', 'right');
bindTouch('btn-up', 'up');
bindTouch('btn-down', 'down');
bindTouch('btn-thr-up', 'thrUp');
bindTouch('btn-thr-dn', 'thrDn');
$('btn-cam').addEventListener('click', toggleCamera);
if (isTouchDevice) $('touch').classList.remove('hidden');

// ---------- Bab & misi ----------
// Memilih kartu bab membuka SELINGAN CERITA dulu: dunia bab dimuat,
// pesawat diparkir di titik spawn, ring bab terlihat — MULAI TERBANG
// baru menjalankan babnya.
function stageChapter(id) {
  const ch = CHAPTERS[id];
  stagedChapter = id;
  setWorld(ch.world);
  applyMood(ch.world);
  if (mission) mission.dispose();
  mission = new Mission(id, scene);
  state.reset(mission.spawn.pos, mission.spawn.heading);
  state.throttle = 0;
  state.speed = 0;
  menuFocus.x = mission.spawn.pos.x; menuFocus.y = mission.spawn.pos.y;
  menuFocus.z = mission.spawn.pos.z; menuFocus.r = 62;
  syncPlaneMesh();
  $('story-label').textContent = ch.label;
  $('story-title').textContent = ch.title;
  $('story-text').textContent = ch.story;
  $('story-obj').textContent = '🎯 ' + ch.objective;
  $('menu').classList.add('hidden');
  $('story').classList.remove('hidden');
}

function startMission(id) {
  setWorld(id === 0 ? 2 : CHAPTERS[id].world);
  applyMood(id === 0 ? 2 : CHAPTERS[id].world);
  if (mission) mission.dispose();
  mission = new Mission(id, scene);
  const s = mission.spawn;
  state.reset(s.pos, s.heading);
  state.throttle = mission.data.initialThrottle;
  state.speed = mission.data.initialSpeed;
  mission.start(0);
  ended = false;
  started = true;
  stagedChapter = 0;
  hud.hideBanner();
  hud.show();
  $('menu').classList.add('hidden');
  $('story').classList.add('hidden');
  $('cockpit').classList.toggle('hidden', cameraMode !== 'cockpit');
  hud.toast(mission.name + ' — ' + mission.objective, 3400);
  syncPlaneMesh();
}

function restartMission() {
  if (!mission) return;
  // Bab dengan checkpoint tersimpan: R / TERBANG LAGI = respawn di ring
  // checkpoint terakhir (skor & ring yang sudah lewat TIDAK hilang).
  // Selain itu (atau bab sudah selesai): restart penuh seperti biasa.
  const cp = (!mission.done && mission.hasRings) ? mission.checkpointRespawn() : null;
  if (cp) {
    state.respawn(cp.pos, cp.headingDeg);
    ended = false;
    hud.hideBanner();
    hud.toast(`CHECKPOINT ${mission.ringIndex}/${mission.ringPositions.length} — LANJUT DARI SINI! Skor & ring tersimpan`, 2800);
    syncPlaneMesh();
    return;
  }
  startMission(mission.id);
}

function backToMenu() {
  if (mission) { mission.dispose(); mission = null; }
  started = false;
  ended = false;
  stagedChapter = 0;
  hud.hide();
  hud.hideBanner();
  $('story').classList.add('hidden');
  $('menu').classList.remove('hidden');
  $('cockpit').classList.add('hidden');
  parkInHouse();
}

function toggleCamera() {
  cameraMode = cameraMode === 'chase' ? 'cockpit' : 'chase';
  $('cockpit').classList.toggle('hidden', cameraMode !== 'cockpit' || !started);
  hud.toast(cameraMode === 'cockpit' ? 'KAMERA KOKPIT' : 'KAMERA CHASE', 1200);
}

document.querySelectorAll('.mission-card').forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = Number(btn.dataset.mission);
    if (id === 0) startMission(0);
    else stageChapter(id);
  });
});
$('btn-start-story').addEventListener('click', () => {
  if (stagedChapter) startMission(stagedChapter);
});
$('btn-story-back').addEventListener('click', backToMenu);
$('btn-again').addEventListener('click', restartMission);
$('btn-menu').addEventListener('click', backToMenu);
$('btn-next').addEventListener('click', () => {
  if (mission && mission.id >= 1 && mission.id < 3) stageChapter(mission.id + 1);
});

// ---------- Sinkron mesh pesawat dengan state ----------
const tmpFwd = new THREE.Vector3();
function syncPlaneMesh() {
  planeGroup.position.copy(state.position);
  planeGroup.rotation.order = 'YXZ';
  planeGroup.rotation.y = state.heading + Math.PI;
  planeGroup.rotation.x = -state.pitch;
  planeGroup.rotation.z = -state.bank;
  propeller.rotation.z += state.throttle * 0.9;
  propDisc.material.opacity = state.throttle * 0.22;
}

function forwardVector() {
  return tmpFwd.set(
    -Math.sin(state.heading) * Math.cos(state.pitch),
    Math.sin(state.pitch),
    -Math.cos(state.heading) * Math.cos(state.pitch),
  );
}

// ---------- Kamera ----------
const camTarget = new THREE.Vector3(0, 220, 900);
function updateCamera(dt) {
  if (!started) {
    // Orbit sinematik mengelilingi fokus menu (meja makan / spawn bab)
    menuOrbit += dt * 0.045;
    camera.position.set(
      menuFocus.x + Math.cos(menuOrbit) * menuFocus.r,
      menuFocus.y + 20,
      menuFocus.z + Math.sin(menuOrbit) * menuFocus.r,
    );
    camera.lookAt(menuFocus.x, menuFocus.y, menuFocus.z);
    return;
  }
  const fwd = forwardVector();
  if (cameraMode === 'cockpit') {
    planeGroup.visible = false;
    const eye = state.position.clone().addScaledVector(fwd, 1.2).add(new THREE.Vector3(0, 1.05, 0));
    camera.position.copy(eye);
    camera.lookAt(state.position.clone().addScaledVector(fwd, 60).add(new THREE.Vector3(0, 2, 0)));
  } else {
    planeGroup.visible = true;
    // Layar tegak (HP): tarik kamera lebih jauh supaya pesawat utuh dalam frame
    const portrait = camera.aspect < 0.9;
    const back = portrait ? 24 : 15;
    const up = portrait ? 8 : 5.2;
    const desired = state.position.clone()
      .addScaledVector(fwd, -back)
      .add(new THREE.Vector3(0, up, 0));
    camera.position.lerp(desired, Math.min(1, dt * 5));
    const look = state.position.clone().addScaledVector(fwd, 14);
    camTarget.lerp(look, Math.min(1, dt * 7));
    camera.lookAt(camTarget);
  }
}

// ---------- Akhir game ----------
function endGame(kind, title, sub, score, detail) {
  if (ended) return;
  ended = true;
  // Bab selesai dengan sukses → tawarkan lanjut ke bab berikutnya.
  const showNext = kind === 'success' && mission && mission.id >= 1 && mission.id < 3 && mission.done;
  $('btn-next').style.display = showNext ? '' : 'none';
  hud.showBanner(kind, title, sub, score, detail);
}

function checkEndings() {
  if (!started || ended || !mission) return;
  if (state.crashed) {
    const overSea = !isOverLandNow();
    const cpNote = mission.hasRings && mission.ringIndex > 0
      ? ` · Checkpoint ${mission.ringIndex}/${mission.ringPositions.length} tersimpan — TERBANG LAGI lanjut dari sana` : '';
    endGame('crash', 'CRASH!',
      overSea ? 'Pesawat jatuh ke lantai.' : 'Pesawat menabrak benda raksasa.',
      mission.score,
      `Kerusakan 100% · skor misi ${mission.score} · waktu ${fmtClock(state.flightTime)}${cpNote}`);
    return;
  }
  if (state.landed && mission.hasRings && !mission.done) {
    // Mendarat di landasan/zona mana pun sebelum ring lengkap: bab belum
    // selesai — akhiri dengan jelas (bukan soft-lock), tanpa tombol lanjut.
    endGame('crash', 'MENDARAT SEBELUM WAKTUNYA',
      'Ring belum lengkap — kumpulkan semua ring dulu, baru mendarat di finis.',
      mission.score,
      `Skor misi ${mission.score} · nilai landing ${state.landingScore()}/100 · waktu ${fmtClock(state.flightTime)}`);
    return;
  }
  if (state.fuel <= 0 && state.speed < 3 && !state.landed) {
    endGame('crash', 'KEHABISAN BAHAN BAKAR',
      'Tangki kosong — pesawat tidak bisa terbang lagi.',
      mission.score, `Skor misi ${mission.score} · waktu ${fmtClock(state.flightTime)}`);
    return;
  }
  if (mission.id === 0 && state.landed) {
    endGame('success', 'MENDARAT!', 'Pendaratan mulus.',
      150, `Terbang bebas · waktu ${fmtClock(state.flightTime)}`);
  }
}

function isOverLandNow() {
  return terrainHeight(state.position.x, state.position.z) > 1.5;
}

function fmtClock(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

// ---------- Loop ----------
const clock = new THREE.Clock();
let hudTick = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  tickWorld(dt);
  if (started && !ended) {
    state.update(dt, input);
    if (mission) {
      const ev = mission.update(state, state.flightTime);
      if (ev) {
        hud.toast(ev.text, 3000);
        if (ev.event === 'done') {
          endGame('success', ev.text, mission.name, mission.score, ev.detail || '');
        }
      }
    }
    checkEndings();
  }
  syncPlaneMesh();
  updateCamera(dt);
  hudTick += dt;
  if (started && hudTick > 0.12) {
    hud.update(state, mission && mission.id !== 0 ? mission : null);
    hudTick = 0;
  }
  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- Preset screenshot (?shot=...) ----------
// Render asli game yang berjalan — posisi & bab diatur supaya frame
// langsung menunjukkan game lengkap tanpa klik menu.
function applyShotPreset() {
  const shot = params.get('shot');
  if (!shot) return;
  const aimAt = (target) => {
    state.heading = Math.atan2(-(target.x - state.position.x), -(target.z - state.position.z));
  };
  if (shot === 'cover' || shot === 'phone') {
    startMission(2);
    // Bab 2: di dapur, menatap ring CP4 di jendela SELATAN — halaman,
    // jalan setapak & bak pasir terlihat di balik jendela.
    const ring = mission.ringPositions[3];
    state.position.set(52, 44, 48);
    aimAt(ring);
    state.pitch = 0.0;
    state.throttle = 0.72;
    state.speed = 60;
  } else if (shot === 'rings') {
    startMission(2);
    // Di garis lurus poros meja menuju CP2 (Rev7)
    const ring = mission.ringPositions[1];
    state.position.set(ring.x - 48, ring.y + 6, ring.z - 38);
    aimAt(ring);
    state.throttle = 0.75;
    state.speed = 62;
  } else if (shot === 'bedroom') {
    startMission(1);
    // Bab 1: tepat di atas kasur raksasa menuju CP3 — kasur, bantal &
    // selimut memenuhi bingkai, ring di depan
    const ring = mission.ringPositions[2];
    state.position.set(28, 49, -118);
    aimAt(ring);
    state.throttle = 0.55;
    state.speed = 42;
  } else if (shot === 'playground') {
    startMission(3);
    // Bab 3: di sumbu ayunan A menuju CP2 — lurus searah palang, celah
    // di antara dua dudukan gantung tepat di depan
    const ring = mission.ringPositions[1];
    state.position.set(-178, 29, 55);
    aimAt(ring);
    state.throttle = 0.7;
    state.speed = 55;
  } else if (shot === 'merry') {
    startMission(3);
    // Bab 3: perosotan + putaran berputar dalam satu bingkai
    state.position.set(120, 30, 130);
    aimAt({ x: 175, y: 12, z: 235 });
    state.throttle = 0.7;
    state.speed = 58;
  } else if (shot === 'window') {
    startMission(2);
    // Baru keluar jendela, menurun menuju bak pasir & istana pasir
    state.position.set(148, 34, 238);
    aimAt({ x: 190, y: 8, z: 360 });
    state.pitch = -0.05;
    state.throttle = 0.6;
    state.speed = 52;
  } else if (shot === 'colors') {
    startMission(2);
    // CP1 sudah terkumpul (HIJAU permanen), CP2 = target EMAS terang.
    mission.ringIndex = 1;
    mission.score = 100;
    mission.refreshRingColors();
    state.position.set(-340, 43, 142);
    aimAt({ x: -142, y: 43, z: 8 });
    state.pitch = 0.0;
    state.throttle = 0.7;
    state.speed = 58;
  }
  syncPlaneMesh();
}
applyShotPreset();

// ---------- Pengait playtest (dipakai skrip screenshot, bukan bagian UI) ----------
window.__toyplane = {
  state, input,
  get mission() { return mission; },
  startMission, stageChapter, restartMission, backToMenu, toggleCamera,
  get cameraMode() { return cameraMode; },
  get started() { return started; },
  get ended() { return ended; },
};
