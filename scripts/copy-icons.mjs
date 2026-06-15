// Copy node/credential icon assets (png, svg) into dist, preserving paths.
//
// tsc only emits JS from TS and does not copy static assets, so without this
// step the published package ships without the `file:hedy.png` icon that both
// nodes declare. That regressed in 1.3.3 (built from a clean CI checkout) and
// is fixed here. Run as part of `npm run build`.
import { readdirSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join } from 'path';

const SRC_DIRS = ['nodes', 'credentials'];
const ASSET_EXTENSIONS = ['.png', '.svg'];

let copied = 0;

function walk(dir) {
	if (!existsSync(dir)) return;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const sourcePath = join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(sourcePath);
		} else if (ASSET_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
			const destPath = join('dist', sourcePath);
			mkdirSync(join('dist', dir), { recursive: true });
			copyFileSync(sourcePath, destPath);
			copied++;
			console.log(`copy-icons: ${sourcePath} -> ${destPath}`);
		}
	}
}

for (const dir of SRC_DIRS) walk(dir);
console.log(`copy-icons: ${copied} asset(s) copied`);
