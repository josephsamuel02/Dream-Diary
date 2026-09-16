import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appJsonPath = path.join(root, 'app.json');

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const [major, minor, patch] = appJson.expo.version.split('.').map(Number);

if (!Number.isInteger(major) || !Number.isInteger(minor) || !Number.isInteger(patch)) {
  throw new Error(`Invalid version in app.json: ${appJson.expo.version}`);
}

appJson.expo.version = `${major}.${minor}.${patch + 1}`;

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
console.log(`Version bumped to ${appJson.expo.version}`);
