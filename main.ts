// Vice Cover Studio — make.fun entry program (Node 22, standard library only).
// It hands the app in: copies app/ and screenshots/ from beside this file
// into the output directory and writes dossier.json there with the vendored
// make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
// /output, so a local check is:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program is deterministic: same input files, same output bytes.
// It never removes the output directory itself: under the grader
// /output is a mount point the program cannot delete, so it clears
// only the entries inside it and overwrites them.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Start from a clean output directory so stale files never leak in.
// Clear only the contents: the directory itself stays put, because
// deleting it fails (EPERM) when it is a mount point the program
// does not own, as under the grader.
mkdirSync(outputDir, { recursive: true });
for (const entry of readdirSync(outputDir)) {
  rmSync(join(outputDir, entry), { recursive: true, force: true });
}

// The app: plain static files under app/, served by any static server.
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

// The screenshots: 3 or 4 real captures taken from the running app.
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier: the summary the judge reads, written by the vendored
// library from the files just copied. The caps mirror the gate so a
// local run refuses anything the scorer would refuse.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

