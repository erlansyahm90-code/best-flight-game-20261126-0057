// Toy Plane — worlds.js
// Registri tiga dunia bab: Bab 1 kamar anak (bedroom.js), Bab 2 rumah
// (terrain.js), Bab 3 taman bermain (playground.js). Semua modul lain
// (physics, missions, main) hanya bicara ke dispatcher ini: dunia aktif
// menentukan heightfield tabrakan, langit-langit, runway untuk skor
// pendaratan, zona pendaratan sah, dan animasi dunia (putaran berputar).
import { WORLD as BEDROOM } from './bedroom.js';
import { WORLD as HOUSE } from './terrain.js';
import { WORLD as PLAYGROUND } from './playground.js';

const WORLDS = { 1: BEDROOM, 2: HOUSE, 3: PLAYGROUND };
const groups = {};
let active = HOUSE; // menu utama berlatar dunia rumah (Bab 2)

export function buildWorlds(scene) {
  for (const id of [1, 2, 3]) {
    groups[id] = WORLDS[id].build(scene);
    groups[id].visible = WORLDS[id] === active;
  }
}

export function setWorld(id) {
  active = WORLDS[id];
  for (const k of Object.keys(groups)) groups[k].visible = WORLDS[k] === active;
}

export function activeWorld() { return active; }

// --- Dispatcher yang dipakai physics ---
export function terrainHeight(x, z) { return active.heightAt(x, z); }
export function isOverLand(x, z) { return terrainHeight(x, z) > 1.5; }
export function ceilingY() { return active.ceiling; }
export function landingZones() { return active.landingZones; }
export function activeRunway() { return active.runway; }

// Animasi dunia aktif (Bab 3: putaran berputar; dunia lain diam).
export function tickWorld(dt) { if (active.tick) active.tick(dt); }
