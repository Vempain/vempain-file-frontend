import fs from 'fs';
import path from 'path';
import {execSync} from 'child_process';
import dayjs from 'dayjs';
import {fileURLToPath} from 'url';

// __dirname workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionFilePath = path.resolve(__dirname, 'VERSION');
const baseVersion = fs.readFileSync(versionFilePath, 'utf8').trim();

/**
 * Replicates the logic in .github/workflows/ci.yaml:
 *  git fetch --tags origin
 *  currentVersion=$(git tag --list --sort=-version:refname "${baseVersion}.*" | head -n 1 || "${baseVersion}.0")
 *  if empty -> newVersion=baseVersion.0
 *  else increment patch component
 */
function computeNewVersion(baseVersion) {
    try {
        execSync('git fetch --tags origin', {stdio: 'ignore'});
    } catch (e) {
        console.error('Failed to fetch tags from origin:', e);
        // Continue; we will fall back to .0
    }

    let currentVersion = '';
    try {
        currentVersion = execSync(
            `bash -c 'git tag --list --sort=-version:refname "${baseVersion}.*" | head -n 1'`,
            {encoding: 'utf8'}
        ).trim();
    } catch {
        currentVersion = '';
    }

    if (!currentVersion) {
        return `${baseVersion}.0`;
    }

    const parts = currentVersion.split('.');
    const patch = Number(parts[2]);
    if (Number.isNaN(patch)) {
        return `${baseVersion}.0`;
    }
    return `${baseVersion}.${patch + 1}`;
}

const newVersion = computeNewVersion(baseVersion);

const buildTimeISO = new Date().toISOString();
const buildTimeFormatted = dayjs(buildTimeISO).format('YYYY.MM.DD HH:mm');

const outputFilePath = path.resolve(__dirname, 'src/buildInfo.json');
fs.writeFileSync(
    outputFilePath,
    JSON.stringify({buildTime: buildTimeFormatted, version: newVersion}),
    'utf8'
);

console.log("==================================================================================");
console.log("Generating build time and version...");
console.log(`Build time: ${buildTimeFormatted}`);
console.log(`New version: ${newVersion}`);
console.log("==================================================================================");