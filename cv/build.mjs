// Renders cv/OropesaCarlJanzell-CV.html to public/OropesaCarlJanzell-CV.pdf with headless
// Chrome, plus a Word copy in cv/dist/ (gitignored) for job portals that only take .docx.
// Zero dependencies: Chrome for the PDF, macOS textutil for the .docx.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'OropesaCarlJanzell-CV.html');
const pdf = join(here, '..', 'public', 'OropesaCarlJanzell-CV.pdf');
const outDir = join(here, 'dist');

const chrome = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => p && existsSync(p));
if (!chrome) {
  console.error('No Chrome or Chromium found. Set CHROME_PATH.');
  process.exit(1);
}

const before = existsSync(pdf) ? statSync(pdf).mtimeMs : 0;
execFileSync(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  '--virtual-time-budget=10000', // lets the web fonts load before printing
  `--print-to-pdf=${pdf}`,
  pathToFileURL(src).href,
], { stdio: 'ignore' });
if (!existsSync(pdf) || statSync(pdf).mtimeMs === before) {
  console.error('Chrome did not write the PDF.');
  process.exit(1);
}
console.log(`pdf  → ${pdf}`);

// textutil understands neither flexbox nor ::before, so the Word copy swaps the print styles
// for plain ones, spells out the separators the layout implies, and uses a font Word always has.
const WORD_CSS = `<style>
  body { font: 10pt/1.3 Arial, Helvetica, sans-serif; color: #1A1D21; }
  h1 { font-size: 20pt; margin: 0; }
  h2 { font-size: 9.5pt; text-transform: uppercase; letter-spacing: 1px; color: #69727D; border-bottom: 1px solid #D0D4D9; margin: 10pt 0 3pt; }
  p, div { margin: 0; }
  .org { font-weight: bold; }
  .dates, .stack, .contact { color: #5A636E; }
  ul { margin: 2pt 0 4pt; padding-left: 14pt; }
  li { margin: 0; }
</style>`;

if (process.platform === 'darwin') {
  mkdirSync(outDir, { recursive: true });
  const flat = readFileSync(src, 'utf8')
    .replace(/<link rel="stylesheet"[^>]*>/, '')
    .replace(/<style>[\s\S]*?<\/style>/, WORD_CSS)
    .replace(/<div class="mark"><\/div>/, '')
    .replace(/<\/span><span/g, '</span> · <span')
    .replace(/<dt>(.*?)<\/dt><dd>(.*?)<\/dd>/g, '<p><b>$1:</b> $2</p>')
    .replace(/<\/?dl[^>]*>/g, '');
  const tmp = join(outDir, 'cv-flat.html');
  const docx = join(outDir, 'OropesaCarlJanzell-CV.docx');
  writeFileSync(tmp, flat);
  execFileSync('textutil', ['-convert', 'docx', '-output', docx, tmp]);
  console.log(`docx → ${docx}`);
}
