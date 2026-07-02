# Version Management Guide

**Current Version**: 0.5.0 "Crypts & Castles"

---

## Quick Commands

```bash
# Bug fix (0.4.0 → 0.4.1)
npm run bump:patch

# New feature (0.4.0 → 0.5.0)
npm run bump:minor

# Major release (0.4.0 → 1.0.0)
npm run bump:major
```

---

## How It Works

### The "Automation" Explained

**What the script does automatically**:
- ✅ Updates `package.json` version
- ✅ Updates `src/js/version.js` constants
- ✅ Calculates new version number

**What you still do manually**:
- 📝 Choose codename (in `version.js`)
- 📝 Set release date (in `version.js`)
- 📝 Write changelog entry (in `CHANGELOG.md`)
- 📝 Commit, tag, and push to git

### Visual Workflow

```
You add a feature
    ↓
Run: npm run bump:minor
    ↓
Script automatically updates:
  - package.json ✅
  - version.js ✅
    ↓
You manually update:
  - Codename
  - Release date
  - Changelog
    ↓
Commit and tag
    ↓
Done! 🎉
```

---

## When to Bump Version

### PATCH (0.4.0 → 0.4.1)
- Bug fixes
- Minor tweaks
- Balance adjustments
- Documentation updates

### MINOR (0.4.0 → 0.5.0)
- New features
- New content (items, monsters, spells)
- New systems (backwards-compatible)
- Significant improvements

### MAJOR (0.9.0 → 1.0.0)
- Game release milestones (1.0 launch)
- Breaking changes
- Complete rewrites

---

## Complete Release Workflow

### Step 1: Develop Your Feature
Write code, test, etc.

### Step 2: Bump Version (Automated)
```bash
npm run bump:minor
```

**What happens**:
- `package.json`: `"0.4.0"` → `"0.5.0"`
- `version.js`: `MINOR = 4` → `MINOR = 5`

### Step 3: Update Metadata (Manual)
Edit `src/js/version.js`:
```javascript
static CODENAME = "Depths Unknown";  // Your choice
static RELEASE_DATE = "2025-11-15";  // Today's date
```

### Step 4: Update Changelog (Manual)
Edit `CHANGELOG.md`:
```markdown
## [0.5.0] - 2025-11-15 "Depths Unknown"

### Added
- New dungeon biomes
- Environmental hazards

### Changed
- Improved generation algorithm

### Fixed
- Bug with room connections
```

### Step 5: Commit and Tag (Manual)
```bash
git add package.json src/js/version.js CHANGELOG.md
git commit -m "Release v0.5.0: Advanced Dungeons"
git tag -a v0.5.0 -m "Release v0.5.0"
git push origin main v0.5.0
```

---

## Example: Major Version (0.9.0 → 1.0.0)

```bash
# Step 1: Bump
npm run bump:major

# Step 2: Edit version.js
# CODENAME = "The Journey Begins"
# RELEASE_DATE = "2025-12-01"

# Step 3: Update CHANGELOG.md
# Add entry for 1.0.0

# Step 4: Commit and tag
git commit -m "Release v1.0.0: The Journey Begins"
git tag -a v1.0.0 -m "Release v1.0.0: Full game release!"
git push origin main v1.0.0
```

---

## Using Version in Code

```javascript
import { Version } from './version.js';

// Get version string
Version.version;        // "0.4.0"
Version.displayVersion; // "Modern Rogue v0.4.0"
Version.fullVersion;    // "0.4.0 'Arcane Awakening'"

// Log to console (styled)
Version.logVersion();
// Output:
// Modern Rogue v0.4.0
// Codename: Arcane Awakening
// Release: 2025-10-17
```

---

## Semantic Versioning (SemVer)

Format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes, incompatible API changes
- **MINOR**: New features, backwards-compatible
- **PATCH**: Bug fixes, backwards-compatible

Examples:
- `0.3.0` → `0.3.1` - Bug fix
- `0.3.1` → `0.4.0` - New feature
- `0.4.0` → `1.0.0` - Major release

---

## Files Involved

### Automated (by bump script)
- `package.json` - Version field
- `src/js/version.js` - MAJOR, MINOR, PATCH constants

### Manual (you update)
- `src/js/version.js` - CODENAME, RELEASE_DATE
- `documentation/CHANGELOG.md` - Version history
- `DEVLOG.md` (repo root) - Narrative development notes (optional)

---

## Troubleshooting

### Wrong bump type?
```bash
# Before committing: checkout and redo
git checkout package.json src/js/version.js
npm run bump:patch  # or correct type
```

### Forgot codename?
```bash
# Edit version.js, then amend commit
git add src/js/version.js
git commit --amend --no-edit
```

### Need to undo a tag?
```bash
# Delete local tag
git tag -d v0.5.0

# Delete remote tag
git push origin :refs/tags/v0.5.0
```

---

## Git Tags

### List all tags
```bash
git tag -l
```

### View tag details
```bash
git show v0.4.0
```

### Push all tags
```bash
git push origin --tags
```

---

## Version History

| Version | Date | Codename | Status |
|---------|------|----------|--------|
| 0.1.0 | 2025-05-01 | First Steps | Released |
| 0.2.0 | 2025-06-15 | The Hoarder | Released |
| 0.3.0 | 2025-07-07 | Steel & Strategy | Released |
| 0.4.0 | 2025-10-17 | Arcane Awakening | Released |
| **0.5.0** | **2026-07-02** | **Crypts & Castles** | **Current** |

See `CHANGELOG.md` for complete history and roadmap.

---

## Summary

**The bump script saves you from**:
- ❌ Forgetting to update files
- ❌ Version number typos
- ❌ Miscalculating next version
- ❌ Inconsistent versions

**You still control**:
- ✅ When to release
- ✅ What to call it
- ✅ What changed
- ✅ When to push
