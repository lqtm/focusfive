import { spawnSync } from 'node:child_process';
import { access, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
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

const BUNDLED_PACKAGES = [
  'react',
  'react-dom',
  'scheduler',
  'motion',
  'framer-motion',
  'motion-dom',
  'motion-utils',
  '@phosphor-icons/react',
  '@fontsource-variable/schibsted-grotesk',
  '@fontsource/commit-mono',
];

async function licenseText(packageName) {
  const directory = path.join(root, 'node_modules', packageName);
  const files = await readdir(directory);
  const licenseFile = files.find((file) => /^licen[cs]e/i.test(file));
  if (!licenseFile) throw new Error(`No license file found for ${packageName}.`);
  const { version, license } = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));
  const text = (await readFile(path.join(directory, licenseFile), 'utf8')).trim();
  return `${packageName} ${version} (${license})\n${'-'.repeat(72)}\n${text}`;
}

const notices = await Promise.all(BUNDLED_PACKAGES.map(licenseText));
await writeFile(path.join(dist, 'THIRD_PARTY_NOTICES.txt'), [
  'Focus Five bundles the following open-source software and fonts.',
  'Presentation wallpapers are photographs from Unsplash, used under the Unsplash License (https://unsplash.com/license); each photo is credited in the app.',
  ...notices,
].join('\n\n') + '\n');

await mkdir(release, { recursive: true });
const archive = path.join(release, `five-extension-v${packageJson.version}.zip`);
await rm(archive, { force: true });

const result = spawnSync('zip', ['-q', '-r', archive, '.', '-x', '*.DS_Store'], {
  cwd: dist,
  encoding: 'utf8',
});
if (result.status !== 0) throw new Error(result.stderr || 'Could not create release archive.');

console.log(`Created ${path.relative(root, archive)}`);
