import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// Helper to execute commands and pipe output to stdout/stderr
function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

try {
  // 1. Read package.json
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error('Error: package.json not found. Run this script from the tauri-app directory.');
    process.exit(1);
  }
  
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  // 2. Increment version based on argument
  const bumpType = process.argv[2] || 'minor';
  const parts = pkg.version.split('.');
  if (parts.length !== 3) {
    console.error('Error: package.version is not in valid semver format (x.y.z)');
    process.exit(1);
  }
  
  if (bumpType === 'major') {
    parts[0] = parseInt(parts[0], 10) + 1;
    parts[1] = 0;
    parts[2] = 0;
  } else if (bumpType === 'patch' || bumpType === 'bugfix') {
    parts[2] = parseInt(parts[2], 10) + 1;
  } else {
    // default to minor
    parts[1] = parseInt(parts[1], 10) + 1;
    parts[2] = 0;
  }
  const newVersion = parts.join('.');
  console.log(`Bumping version from ${pkg.version} to ${newVersion}...`);

  // 3. Update package.json
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Updated package.json`);

  // 4. Update tauri.conf.json
  const tauriPath = path.join(process.cwd(), 'src-tauri', 'tauri.conf.json');
  if (fs.existsSync(tauriPath)) {
    const tauri = JSON.parse(fs.readFileSync(tauriPath, 'utf8'));
    tauri.version = newVersion;
    fs.writeFileSync(tauriPath, JSON.stringify(tauri, null, 2) + '\n');
    console.log(`Updated tauri.conf.json`);
  }

  // 4.5 Update Cargo.toml
  const cargoPath = path.join(process.cwd(), 'src-tauri', 'Cargo.toml');
  if (fs.existsSync(cargoPath)) {
    let cargo = fs.readFileSync(cargoPath, 'utf8');
    // Replace version = "x.y.z" under [package]
    cargo = cargo.replace(/(\[package\][\s\S]*?version\s*=\s*")[^"]+(")/, `$1${newVersion}$2`);
    fs.writeFileSync(cargoPath, cargo);
    console.log(`Updated Cargo.toml`);
  }

  // 5. Git commit and tag
  // Add changes from tauri-app to git
  run(`git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml`);
  
  // Also add the workflow file if it was just created/modified so it's included in the release commit
  try {
    run(`git add ../.github/workflows/release.yml`);
  } catch(e) {
    // Ignore if already added or not modified
  }

  // Check if there are changes to commit
  const status = execSync('git status --porcelain').toString();
  if (status.trim() !== '') {
    run(`git commit -m "chore(release): v${newVersion}"`);
  } else {
    console.log('No changes to commit.');
  }

  // Create tag
  run(`git tag v${newVersion}`);

  // 6. Push to origin
  run(`git push origin HEAD`);
  run(`git push origin --tags`);

  console.log(`\n✅ Successfully released v${newVersion}`);
  console.log(`GitHub Actions should now be triggered for the tag v${newVersion}.`);

} catch (err) {
  console.error('\n❌ Release failed:');
  console.error(err.message);
  process.exit(1);
}
