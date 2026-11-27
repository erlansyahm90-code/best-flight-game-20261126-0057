// Toy Plane — main.js
// Rangka utama permainan: membuat renderer/scene/kamera, memasang
// input keyboard dan sentuh, menggerakkan loop, mengelola menu PILIH
// BAB dengan selingan cerita antar-bab, preset screenshot lewat query
// (?shot=...), dan pengait playtest window.__toyplane. Tiga bab cerita
// tinggal di tiga dunia — Bab 1 kamar anak (bedroom.js), Bab 2 rumah
// (terrain.js), Bab 3 taman bermain (playground.js) — dan perpindahan
// antar-dunia dirutekan lewat worlds.js.
import * as THREE from 'three';
import { buildWorlds, setWorld, tickWorld, terrainHeight, activeRunway } from './worlds.js';
import { CHAPTERS } from './chapters.js';
import { buildPlane } from './plane.js';
import { FlightState } from './physics.js';
import { Hud } from './hud.js';
import { Mission } from './missions.js';

const byId = (id) => document.getElementById(id);
const query = new URLSearchParams(location.search);
const touchCapable = ('ontouchstart' in window) || window.innerWidth < 760 || query.has('touch');

// ---------- Panggung: renderer, scene, kamera, cahaya ----------
const canvas = byId('scene');
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

// ---------- Keadaan permainan ----------
const state = new FlightState();
const hud = new Hud();
let mission = null;
let cameraMode = 'chase'; // 'chase' | 'cockpit'
let started = false;
let ended = false;
let orbitAngle = 0;

// Langit mengikuti dunia: kamar/rumah disinari siang hangat dari
// jendela; taman bermain di bawah langit biru terbuka (latar dan
// warna kabut diganti berpasangan).
function setWorldMood(worldId) {
  const garden = worldId === 3;
  scene.background.set(garden ? 0x9fd3f0 : 0xffd9a0);
  scene.fog.color.set(garden ? 0xcfe4f7 : 0xf3d9ae);
}

let stagedId = 0; // bab yang sedang dipajang di layar cerita
// Titik fokus orbit kamera menu + radiusnya: awalnya meja makan dunia
// rumah (tempat pesawat parkir); pindah ke titik spawn bab yang dipilih.
const menuFocus = { x: -300, y: 26, z: 0, r: 78 };

// Parkir pesawat di atas meja makan (dunia rumah) sebagai latar menu.
function parkForMenu() {
  setWorld(2);
  setWorldMood(2);
  state.reset(new THREE.Vector3(-305, activeRunway().height + 1.4, 0), 270);
  state.throttle = 0;
  state.speed = 0;
  menuFocus.x = -300; menuFocus.y = 26; menuFocus.z = 0; menuFocus.r = 78;
  matchPlaneToState();
}
parkForMenu();

// ---------- Input ----------
// Bendera input bersama yang dibaca FlightState.update tiap frame.
const input = { thrUp: false, thrDn: false, left: false, right: false, up: false, down: false };
const KEY_TO_ACTION = {
  KeyW: 'thrUp', ArrowUp: 'up', KeyS: 'thrDn', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
};
addEventListener('keydown', (e) => {
  const action = KEY_TO_ACTION[e.key] || KEY_TO_ACTION[e.code];
  if (action) { input[action] = true; e.preventDefault(); }
  if (e.code === 'KeyV') toggleCamera();
  if (e.code === 'KeyR') restartMission();
  if (!started && (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3')) {
    stageChapter(Number(e.code.slice(-1)));
  }
  if (e.code === 'Digit0' && !started) startMission(0);
  if (e.code === 'Enter' && !started && stagedId) startMission(stagedId);
});
addEventListener('keyup', (e) => {
  const action = KEY_TO_ACTION[e.key] || KEY_TO_ACTION[e.code];
  if (action) input[action] = false;
});

// Tombol sentuh: tekan menahan bendera, lepas/keluar melepasnya.
function wireTouchButton(id, actionKey) {
  const btn = byId(id);
  const press = (e) => { e.preventDefault(); input[actionKey] = true; btn.classList.add('active'); };
  const release = (e) => { e.preventDefault(); input[actionKey] = false; btn.classList.remove('active'); };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointerleave', release);
  btn.addEventListener('pointercancel', release);
}
wireTouchButton('btn-left', 'left');
wireTouchButton('btn-right', 'right');
wireTouchButton('btn-up', 'up');
wireTouchButton('btn-down', 'down');
wireTouchButton('btn-thr-up', 'thrUp');
wireTouchButton('btn-thr-dn', 'thrDn');
byId('btn-cam').addEventListener('click', toggleCamera);
if (touchCapable) byId('touch').classList.remove('hidden');

// ---------- Alur bab & misi ----------
// Memilih kartu bab TIDAK langsung terbang: dunia bab dimuat, pesawat
// diparkir di titik spawn dengan ring terlihat, dan SELINGAN CERITA
// ditampilkan — MULAI TERBANG-lah yang menjalankan babnya.
function stageChapter(id) {
  const ch = CHAPTERS[id];
  stagedId = id;
  setWorld(ch.world);
  setWorldMood(ch.world);
  if (mission) mission.dispose();
  mission = new Mission(id, scene);
  state.reset(mission.spawn.pos, mission.spawn.heading);
  state.throttle = 0;
  state.speed = 0;
  menuFocus.x = mission.spawn.pos.x; menuFocus.y = mission.spawn.pos.y;
  menuFocus.z = mission.spawn.pos.z; menuFocus.r = 62;
  matchPlaneToState();
  byId('story-label').textContent = ch.label;
  byId('story-title').textContent = ch.title;
  byId('story-text').textContent = ch.story;
  byId('story-obj').textContent = '🎯 ' + ch.objective;
  byId('menu').classList.add('hidden');
  byId('story').classList.remove('hidden');
}

function startMission(id) {
  const worldId = id === 0 ? 2 : CHAPTERS[id].world;
  setWorld(worldId);
  setWorldMood(worldId);
  if (mission) mission.dispose();
  mission = new Mission(id, scene);
  const spawn = mission.spawn;
  state.reset(spawn.pos, spawn.heading);
  state.throttle = mission.data.initialThrottle;
  state.speed = mission.data.initialSpeed;
  mission.start(0);
  ended = false;
  started = true;
  stagedId = 0;
  hud.hideBanner();
  hud.show();
  byId('menu').classList.add('hidden');
  byId('story').classList.add('hidden');
  byId('cockpit').classList.toggle('hidden', cameraMode !== 'cockpit');
  hud.toast(mission.name + ' — ' + mission.objective, 3400);
  matchPlaneToState();
}

function restartMission() {
  if (!mission) return;
  // Bab ber-ring yang belum selesai dan punya checkpoint: R / TERBANG
  // LAGI berarti respawn di ring terakhir (skor dan ring yang sudah
  // lewat TIDAK hilang). Di luar itu: restart penuh dari spawn.
  const cp = (!mission.done && mission.hasRings) ? mission.checkpointRespawn() : null;
  if (cp) {
    state.respawn(cp.pos, cp.headingDeg);
    ended = false;
    hud.hideBanner();
    hud.toast(`CHECKPOINT ${mission.ringIndex}/${mission.ringPositions.length} — LANJUT DARI SINI! Skor & ring tersimpan`, 2800);
    matchPlaneToState();
    return;
  }
  startMission(mission.id);
}

function backToMenu() {
  if (mission) { mission.dispose(); mission = null; }
  started = false;
  ended = false;
  stagedId = 0;
  hud.hide();
  hud.hideBanner();
  byId('story').classList.add('hidden');
  byId('menu').classList.remove('hidden');
  byId('cockpit').classList.add('hidden');
  parkForMenu();
}

function toggleCamera() {
  cameraMode = cameraMode === 'chase' ? 'cockpit' : 'chase';
  byId('cockpit').classList.toggle('hidden', cameraMode !== 'cockpit' || !started);
  hud.toast(cameraMode === 'cockpit' ? 'KAMERA KOKPIT' : 'KAMERA CHASE', 1200);
}

// Pemasangan tombol-tombol layar (kartu bab, cerita, banner).
document.querySelectorAll('.mission-card').forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = Number(btn.dataset.mission);
    if (id === 0) startMission(0);
    else stageChapter(id);
  });
});
byId('btn-start-story').addEventListener('click', () => {
  if (stagedId) startMission(stagedId);
});
byId('btn-story-back').addEventListener('click', backToMenu);
byId('btn-again').addEventListener('click', restartMission);
byId('btn-menu').addEventListener('click', backToMenu);
byId('btn-next').addEventListener('click', () => {
  if (mission && mission.id >= 1 && mission.id < 3) stageChapter(mission.id + 1);
});

// ---------- Sinkronisasi mesh pesawat dengan state ----------
// Urutan rotasi YXZ: heading dulu, lalu pitch, lalu bank. Grup
// propeller ikut berputar sebanding throttle dan cakram blur menebal.
function matchPlaneToState() {
  planeGroup.position.copy(state.position);
  planeGroup.rotation.order = 'YXZ';
  planeGroup.rotation.y = state.heading + Math.PI;
  planeGroup.rotation.x = -state.pitch;
  planeGroup.rotation.z = -state.bank;
  propeller.rotation.z += state.throttle * 0.9;
  propDisc.material.opacity = state.throttle * 0.22;
}

const scratchDir = new THREE.Vector3();
function noseVector() {
  return scratchDir.set(
    -Math.sin(state.heading) * Math.cos(state.pitch),
    Math.sin(state.pitch),
    -Math.cos(state.heading) * Math.cos(state.pitch),
  );
}

// ---------- Kamera ----------
const lookPoint = new THREE.Vector3(0, 220, 900);
function frameCamera(dt) {
  if (!started) {
    // Orbit sinematik pelan mengelilingi fokus menu (meja / spawn bab).
    orbitAngle += dt * 0.045;
    camera.position.set(
      menuFocus.x + Math.cos(orbitAngle) * menuFocus.r,
      menuFocus.y + 20,
      menuFocus.z + Math.sin(orbitAngle) * menuFocus.r,
    );
    camera.lookAt(menuFocus.x, menuFocus.y, menuFocus.z);
    return;
  }
  const fwd = noseVector();
  if (cameraMode === 'cockpit') {
    // Mata pilot: pesawat disembunyikan, kamera di hidung.
    planeGroup.visible = false;
    const eyePos = state.position.clone().addScaledVector(fwd, 1.2).add(new THREE.Vector3(0, 1.05, 0));
    camera.position.copy(eyePos);
    camera.lookAt(state.position.clone().addScaledVector(fwd, 60).add(new THREE.Vector3(0, 2, 0)));
  } else {
    // Chase: membuntuti dari belakang-atas; pada layar tegak (HP)
    // kamera ditarik lebih jauh supaya pesawat utuh dalam frame.
    planeGroup.visible = true;
    const portrait = camera.aspect < 0.9;
    const backDist = portrait ? 24 : 15;
    const upDist = portrait ? 8 : 5.2;
    const desired = state.position.clone()
      .addScaledVector(fwd, -backDist)
      .add(new THREE.Vector3(0, upDist, 0));
    camera.position.lerp(desired, Math.min(1, dt * 5));
    const ahead = state.position.clone().addScaledVector(fwd, 14);
    lookPoint.lerp(ahead, Math.min(1, dt * 7));
    camera.lookAt(lookPoint);
  }
}

// ---------- Akhir permainan ----------
function finishRun(kind, title, sub, score, detail) {
  if (ended) return;
  ended = true;
  // Bab yang selesai sukses menawarkan tombol lanjut ke bab berikutnya.
  const offerNext = kind === 'success' && mission && mission.id >= 1 && mission.id < 3 && mission.done;
  byId('btn-next').style.display = offerNext ? '' : 'none';
  hud.showBanner(kind, title, sub, score, detail);
}

// Detik -> "MM:SS".
function clockText(totalSec) {
  const minutes = Math.floor(totalSec / 60);
  const seconds = Math.floor(totalSec % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function overSolidGround() {
  return terrainHeight(state.position.x, state.position.z) > 1.5;
}

// Pemeriksa kondisi akhir tiap frame selama misi berjalan: tabrakan,
// mendarat sebelum ring lengkap, kehabisan bahan bakar, dan (khusus
// terbang bebas) pendaratan yang sah.
function watchEndings() {
  if (!started || ended || !mission) return;
  if (state.crashed) {
    const cpNote = mission.hasRings && mission.ringIndex > 0
      ? ` · Checkpoint ${mission.ringIndex}/${mission.ringPositions.length} tersimpan — TERBANG LAGI lanjut dari sana` : '';
    finishRun('crash', 'CRASH!',
      overSolidGround() ? 'Pesawat menabrak benda raksasa.' : 'Pesawat jatuh ke lantai.',
      mission.score,
      `Kerusakan 100% · skor misi ${mission.score} · waktu ${clockText(state.flightTime)}${cpNote}`);
    return;
  }
  if (state.landed && mission.hasRings && !mission.done) {
    // Menyentuh zona mana pun sebelum semua ring terkumpul: bab belum
    // selesai — akhiri dengan jelas (bukan soft-lock), tanpa lanjut bab.
    finishRun('crash', 'MENDARAT SEBELUM WAKTUNYA',
      'Ring belum lengkap — kumpulkan semua ring dulu, baru mendarat di finis.',
      mission.score,
      `Skor misi ${mission.score} · nilai landing ${state.landingScore()}/100 · waktu ${clockText(state.flightTime)}`);
    return;
  }
  if (state.fuel <= 0 && state.speed < 3 && !state.landed) {
    finishRun('crash', 'KEHABISAN BAHAN BAKAR',
      'Tangki kosong — pesawat tidak bisa terbang lagi.',
      mission.score, `Skor misi ${mission.score} · waktu ${clockText(state.flightTime)}`);
    return;
  }
  if (mission.id === 0 && state.landed) {
    finishRun('success', 'MENDARAT!', 'Pendaratan mulus.',
      150, `Terbang bebas · waktu ${clockText(state.flightTime)}`);
  }
}

// ---------- Loop utama ----------
// Fisika dan misi hanya maju saat permainan berjalan dan belum
// berakhir; HUD disegarkan paling sering tiap 0,12 detik.
const clock = new THREE.Clock();
let hudAccum = 0;
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
          finishRun('success', ev.text, mission.name, mission.score, ev.detail || '');
        }
      }
    }
    watchEndings();
  }
  matchPlaneToState();
  frameCamera(dt);
  hudAccum += dt;
  if (started && hudAccum > 0.12) {
    hud.update(state, mission && mission.id !== 0 ? mission : null);
    hudAccum = 0;
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
// Render asli game yang berjalan: tiap preset memulai bab tertentu dan
// menaruh pesawat pada pose terbang supaya frame langsung menunjukkan
// permainan lengkap tanpa klik menu. aimNoseAt mengarahkan hidung ke
// titik target dari posisi pesawat saat ini.
function aimNoseAt(target) {
  state.heading = Math.atan2(-(target.x - state.position.x), -(target.z - state.position.z));
}

const SHOT_FRAMINGS = {
  // Bab 2 di dapur, menatap ring CP4 di jendela SELATAN — halaman,
  // jalan setapak & bak pasir terlihat di balik jendela.
  cover() {
    startMission(2);
    const ring = mission.ringPositions[3];
    state.position.set(52, 44, 48);
    aimNoseAt(ring);
    state.pitch = 0.0;
    state.throttle = 0.72;
    state.speed = 60;
  },
  phone() { SHOT_FRAMINGS.cover(); },
  // Bab 2 di garis lurus poros meja menuju CP2 (Rev7).
  rings() {
    startMission(2);
    const ring = mission.ringPositions[1];
    state.position.set(ring.x - 48, ring.y + 6, ring.z - 38);
    aimNoseAt(ring);
    state.throttle = 0.75;
    state.speed = 62;
  },
  // Bab 1 tepat di atas kasur raksasa menuju CP3 — kasur, bantal &
  // selimut memenuhi bingkai, ring di depan.
  bedroom() {
    startMission(1);
    const ring = mission.ringPositions[2];
    state.position.set(28, 49, -118);
    aimNoseAt(ring);
    state.throttle = 0.55;
    state.speed = 42;
  },
  // Bab 3 di sumbu ayunan A menuju CP2 — lurus searah palang, celah
  // di antara dua dudukan gantung tepat di depan.
  playground() {
    startMission(3);
    const ring = mission.ringPositions[1];
    state.position.set(-178, 29, 55);
    aimNoseAt(ring);
    state.throttle = 0.7;
    state.speed = 55;
  },
  // Bab 3: perosotan + putaran berputar dalam satu bingkai.
  merry() {
    startMission(3);
    state.position.set(120, 30, 130);
    aimNoseAt({ x: 175, y: 12, z: 235 });
    state.throttle = 0.7;
    state.speed = 58;
  },
  // Bab 2 baru keluar jendela, menurun menuju bak pasir & istana pasir.
  window() {
    startMission(2);
    state.position.set(148, 34, 238);
    aimNoseAt({ x: 190, y: 8, z: 360 });
    state.pitch = -0.05;
    state.throttle = 0.6;
    state.speed = 52;
  },
  // Bab 2 dengan CP1 sudah terkumpul (HIJAU permanen) dan CP2 sebagai
  // target EMAS terang — memamerkan dua status warna ring sekaligus.
  colors() {
    startMission(2);
    mission.ringIndex = 1;
    mission.score = 100;
    mission.refreshRingColors();
    state.position.set(-340, 43, 142);
    aimNoseAt({ x: -142, y: 43, z: 8 });
    state.pitch = 0.0;
    state.throttle = 0.7;
    state.speed = 58;
  },
};

function applyShotFromQuery() {
  const framing = SHOT_FRAMINGS[query.get('shot')];
  if (framing) framing();
}
applyShotFromQuery();

// ---------- Pengait playtest (dipakai skrip screenshot, bukan bagian UI) ----------
window.__toyplane = {
  state, input,
  get mission() { return mission; },
  startMission, stageChapter, restartMission, backToMenu, toggleCamera,
  get cameraMode() { return cameraMode; },
  get started() { return started; },
  get ended() { return ended; },
};
