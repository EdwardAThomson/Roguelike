#!/usr/bin/env node

/**
 * Version Bump Script
 * Automatically updates version numbers in package.json and version.js
 * 
 * Usage:
 *   node scripts/bump-version.js patch   # 0.4.0 -> 0.4.1
 *   node scripts/bump-version.js minor   # 0.4.0 -> 0.5.0
 *   node scripts/bump-version.js major   # 0.4.0 -> 1.0.0
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const bumpType = args[0]; // 'major', 'minor', or 'patch'

if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.error('❌ Error: Invalid bump type');
    console.error('Usage: node scripts/bump-version.js [major|minor|patch]');
    console.error('');
    console.error('Examples:');
    console.error('  node scripts/bump-version.js patch   # Bug fixes (0.4.0 -> 0.4.1)');
    console.error('  node scripts/bump-version.js minor   # New features (0.4.0 -> 0.5.0)');
    console.error('  node scripts/bump-version.js major   # Breaking changes (0.4.0 -> 1.0.0)');
    process.exit(1);
}

// Read current version from package.json
const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Calculate new version
let newVersion;
let newMajor, newMinor, newPatch;

switch (bumpType) {
    case 'major':
        newMajor = major + 1;
        newMinor = 0;
        newPatch = 0;
        newVersion = `${newMajor}.${newMinor}.${newPatch}`;
        break;
    case 'minor':
        newMajor = major;
        newMinor = minor + 1;
        newPatch = 0;
        newVersion = `${newMajor}.${newMinor}.${newPatch}`;
        break;
    case 'patch':
        newMajor = major;
        newMinor = minor;
        newPatch = patch + 1;
        newVersion = `${newMajor}.${newMinor}.${newPatch}`;
        break;
}

console.log('');
console.log('🔄 Bumping version...');
console.log(`   ${currentVersion} → ${newVersion} (${bumpType})`);
console.log('');

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('✅ Updated package.json');

// Update version.js
const versionJsPath = path.join(__dirname, '../src/js/version.js');
let versionJs = fs.readFileSync(versionJsPath, 'utf8');

versionJs = versionJs.replace(/static MAJOR = \d+;/, `static MAJOR = ${newMajor};`);
versionJs = versionJs.replace(/static MINOR = \d+;/, `static MINOR = ${newMinor};`);
versionJs = versionJs.replace(/static PATCH = \d+;/, `static PATCH = ${newPatch};`);

fs.writeFileSync(versionJsPath, versionJs);
console.log('✅ Updated src/js/version.js');

console.log('');
console.log('📝 Next steps:');
console.log('   1. Update CODENAME in src/js/version.js (if needed)');
console.log('   2. Update RELEASE_DATE in src/js/version.js');
console.log('   3. Add changelog entry to documentation/developer_log.md');
console.log('   4. Commit changes:');
console.log(`      git add package.json src/js/version.js`);
console.log(`      git commit -m "Release v${newVersion}"`);
console.log('   5. Create git tag:');
console.log(`      git tag -a v${newVersion} -m "Release v${newVersion}"`);
console.log('   6. Push to remote:');
console.log(`      git push origin main`);
console.log(`      git push origin v${newVersion}`);
console.log('');
