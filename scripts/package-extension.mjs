import { spawnSync } from 'node:child_process';
import { access, mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const release = path.join(root, 'release');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(dist, 'manifest.json'), 'utf8'));

if (manifest.manifest_version !== 3) throw new Error('Packaged manifest is not Manifest V3.');
if (manifest.version !== packageJson.version) {
  throw new Error(`Manifest version ${manifest.version} does not match package version ${packageJson.version}.`);
}

const requiredFiles = [
  'index.html',
  manifest.background?.service_worker,
  ...Object.values(manifest.icons ?? {}),
].filter(Boolean);
await Promise.all(requiredFiles.map((file) => access(path.join(dist, file))));

await mkdir(release, { recursive: true });
const archive = path.join(release, `five-extension-v${packageJson.version}.zip`);
await rm(archive, { force: true });

const result = spawnSync('zip', ['-q', '-r', archive, '.'], {
  cwd: dist,
  encoding: 'utf8',
});
if (result.status !== 0) throw new Error(result.stderr || 'Could not create release archive.');

console.log(`Created ${path.relative(root, archive)}`);
