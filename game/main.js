// Archipelago Air — main.js
// Loop game, input keyboard + sentuh, kamera chase/cockpit,
// menu misi, preset screenshot (?shot=...), dan pengait playtest.
import * as THREE from 'three';
import { buildTerrain, RUNWAY, terrainHeight } from './terrain.js';
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
scene.background = new THREE.Color(0x87c9e8);
scene.fog = new THREE.Fog(0xa8d4ea, 900, 3800);

const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 9000);
camera.position.set(0, 220, 900);

const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x2a6b3a, 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d0, 1.6);
sun.position.set(800, 1200, 400);
scene.add(sun);

buildTerrain(scene);
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

// Parkir pesawat di runway untuk latar menu
function parkOnRunway() {
  state.reset(new THREE.Vector3(-40, RUNWAY.height + 1.4, 0), 90);
  state.throttle = 0;
  state.speed = 0;
  syncPlaneMesh();
}
parkOnRunway();

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
  if (e.code === 'Digit1') startMission(1);
  if (e.code === 'Digit2') startMission(2);
  if (e.code === 'Digit3') startMission(3);
  if (e.code === 'Digit0') startMission(0);
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

// ---------- Misi ----------
function startMission(id) {
  if (mission) mission.dispose();
  mission = new Mission(id, scene);
  const s = mission.spawn;
  state.reset(s.pos, s.heading);
  state.throttle = id === 3 ? 0.55 : 0.7;
  state.speed = id === 3 ? 45 : 58;
  mission.start(0);
  ended = false;
  started = true;
  hud.hideBanner();
  hud.show();
  $('menu').classList.add('hidden');
  $('cockpit').classList.toggle('hidden', cameraMode !== 'cockpit');
  hud.toast(mission.name + ' — ' + mission.objective, 3400);
  syncPlaneMesh();
}

function restartMission() {
  if (!mission) return;
  startMission(mission.id);
}

function backToMenu() {
  if (mission) { mission.dispose(); mission = null; }
  started = false;
  ended = false;
  hud.hide();
  hud.hideBanner();
  $('menu').classList.remove('hidden');
  $('cockpit').classList.add('hidden');
  parkOnRunway();
}

function toggleCamera() {
  cameraMode = cameraMode === 'chase' ? 'cockpit' : 'chase';
  $('cockpit').classList.toggle('hidden', cameraMode !== 'cockpit' || !started);
  hud.toast(cameraMode === 'cockpit' ? 'KAMERA KOKPIT' : 'KAMERA CHASE', 1200);
}

document.querySelectorAll('.mission-card').forEach((btn) => {
  btn.addEventListener('click', () => startMission(Number(btn.dataset.mission)));
});
$('btn-again').addEventListener('click', restartMission);
$('btn-menu').addEventListener('click', backToMenu);

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
    // Orbit sinematik di atas kepulauan selagi di menu
    menuOrbit += dt * 0.045;
    const r = 1050;
    camera.position.set(Math.cos(menuOrbit) * r, 330, Math.sin(menuOrbit) * r);
    camera.lookAt(0, 60, 0);
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
  hud.showBanner(kind, title, sub, score, detail);
}

function checkEndings() {
  if (!started || ended || !mission) return;
  if (state.crashed) {
    const overSea = !isOverLandNow();
    endGame('crash', 'CRASH!',
      overSea ? 'Pesawat jatuh ke laut.' : 'Pesawat menabrak terrain.',
      mission.score,
      `Kerusakan 100% · skor misi ${mission.score} · waktu ${fmtClock(state.flightTime)}`);
    return;
  }
  if (state.fuel <= 0 && state.speed < 3 && !state.landed) {
    endGame('crash', 'KEHABISAN BAHAN BAKAR',
      'Tangki kosong — pesawat tidak bisa terbang lagi.',
      mission.score, `Skor misi ${mission.score} · waktu ${fmtClock(state.flightTime)}`);
    return;
  }
  if (mission.id === 0 && state.landed) {
    endGame('success', 'MENDARAT!', 'Pendaratan mulus di runway Pulau Utama.',
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
// Render asli game yang berjalan — posisi & misi diatur supaya frame
// langsung menunjukkan game lengkap tanpa klik menu.
function applyShotPreset() {
  const shot = params.get('shot');
  if (!shot) return;
  if (shot === 'cover' || shot === 'phone') {
    startMission(1);
    // Dekatkan ke ring ke-2 supaya ring terlihat besar di depan
    const ring = mission.ringPositions[1];
    state.position.set(ring.x - 150, ring.y + 8, ring.z + 260);
    state.heading = Math.atan2(-(ring.x - state.position.x), -(ring.z - state.position.z));
    state.pitch = 0.02;
    state.throttle = 0.72;
    state.speed = 60;
  } else if (shot === 'rings') {
    startMission(1);
    const ring = mission.ringPositions[2];
    state.position.set(ring.x - 95, ring.y + 2, ring.z + 175);
    state.heading = Math.atan2(-(ring.x - state.position.x), -(ring.z - state.position.z));
    state.throttle = 0.75;
    state.speed = 62;
  } else if (shot === 'landing') {
    startMission(3);
    state.position.set(-480, 24, 6);
    state.heading = THREE.MathUtils.degToRad(270);
    state.pitch = -0.07;
    state.throttle = 0.45;
    state.speed = 35;
  }
  syncPlaneMesh();
}
applyShotPreset();

// ---------- Pengait playtest (dipakai skrip screenshot, bukan bagian UI) ----------
window.__archipelago = {
  state, input,
  get mission() { return mission; },
  startMission, restartMission, backToMenu, toggleCamera,
  get cameraMode() { return cameraMode; },
  get started() { return started; },
  get ended() { return ended; },
};
