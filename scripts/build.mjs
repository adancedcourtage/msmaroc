// Copie les fichiers publiables dans dist/ (aucune compilation).
// Exclusions : .deployignore (un motif par ligne, `*` = n'importe quel nom sans "/",
// un motif sans "/" s'applique au nom de fichier ou de dossier à tous les niveaux).
import { readFileSync, readdirSync, rmSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist');

const toRegex = (p) => new RegExp('^' + p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$');
const rules = readFileSync(join(root, '.deployignore'), 'utf8')
  .split('\n')
  .map((l) => l.trim().replace(/\/$/, ''))
  .filter((l) => l && !l.startsWith('#'))
  .map((p) => ({ re: toRegex(p), anywhere: !p.includes('/') }));

const excluded = (rel, name) => rules.some((r) => r.re.test(r.anywhere ? name : rel));

let count = 0;
function walk(rel) {
  for (const entry of readdirSync(join(root, rel), { withFileTypes: true })) {
    const path = rel ? `${rel}/${entry.name}` : entry.name;
    if (excluded(path, entry.name)) continue;
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile()) {
      mkdirSync(join(out, rel), { recursive: true });
      copyFileSync(join(root, path), join(out, path));
      count++;
    }
  }
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
walk('');
console.log(`dist/ prêt : ${count} fichiers`);
