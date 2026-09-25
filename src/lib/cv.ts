import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The résumé keeps one stable path, so phones that opened an older copy keep
// showing it. Tagging the link with a hash of the PDF gives every rebuild a new
// URL while the file path itself never changes.
const pdf = readFileSync(join(process.cwd(), 'public', 'OropesaCarlJanzell-CV.pdf'));
const version = createHash('sha256').update(pdf).digest('hex').slice(0, 8);

export const cvPath = (base: string) => `${base}OropesaCarlJanzell-CV.pdf?v=${version}`;
