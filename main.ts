// Archipelago Air — main.ts (Node 22, standard library only)
// Program penyerahan entri: menyalin game/ dan screenshots/ dari repo ini
// ke direktori output, lalu menulis /output/dossier.json dengan library
// make.fun yang di-vendor (vendor/makefun-game.ts).
// Di luar container grader, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Siapkan output, lalu salin game dan screenshot apa adanya.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Batas gate (lihat RULES.txt): dossier dibatasi 160 KiB teks, maksimal 4
// screenshot @ 256 KiB, game/ maksimal 993 file dan 48 MiB, dan tiap path
// di game/ maksimal 1000 byte. buildDossier menolak entri yang melanggar.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
