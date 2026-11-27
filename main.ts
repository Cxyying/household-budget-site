import { cpSync, lstatSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const source = fileURLToPath(new URL('.', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
};

function validateInputs() {
  if (!lstatSync(join(source, 'app', 'index.html'), { throwIfNoEntry: false })?.isFile()) {
    throw new Error('app/index.html must exist as a file.');
  }

  const screenshots = join(source, 'screenshots');
  if (!lstatSync(screenshots, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error('screenshots/ is missing or is not a directory. It must contain 3 or 4 files.');
  }

  const names = readdirSync(screenshots).sort();
  if (names.length < 3 || names.length > caps.screenshots.max) {
    throw new Error(`screenshots/ must contain 3 or 4 files. Found ${names.length} entries.`);
  }

  for (const name of names) {
    const entry = lstatSync(join(screenshots, name));
    if (!entry.isFile()) throw new Error(`screenshots/${name} must be a file.`);
    if (entry.size > caps.screenshots.max_bytes) {
      throw new Error(`screenshots/${name} is ${entry.size} bytes. The limit is ${caps.screenshots.max_bytes}.`);
    }
  }
}

function printFiles(directory) {
  const entries = readdirSync(join(source, directory)).sort();
  for (const name of entries) {
    const path = join(directory, name);
    const stats = lstatSync(join(output, path));
    if (stats.isDirectory()) {
      printFiles(path);
    } else {
      console.log(`${path}  ${stats.size} bytes`);
    }
  }
}

validateInputs();
mkdirSync(output, { recursive: true });
for (const directory of ['app', 'screenshots']) {
  cpSync(join(source, directory), join(output, directory), { recursive: true });
}
const dossier = buildDossier(output, caps);
writeFileSync(join(output, 'dossier.json'), dossier);

printFiles('app');
printFiles('screenshots');
console.log(`dossier.json  ${dossier.byteLength} bytes`);
