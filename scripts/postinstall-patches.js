const fs = require('fs');
const path = require('path');

function safePatch(filePath, replacers) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`[postinstall] Skip: not found ${filePath}`);
      return;
    }
    const original = fs.readFileSync(filePath, 'utf8');
    let patched = original;
    for (const { search, replace } of replacers) {
      if (patched.includes(replace)) {
        console.log(`[postinstall] Already patched: ${search}`);
        continue;
      }
      if (!patched.includes(search)) {
        console.log(`[postinstall] Pattern not found, skipping: ${search}`);
        continue;
      }
      patched = patched.replace(search, replace);
      console.log(`[postinstall] Replaced: ${search} -> ${replace}`);
    }
    if (patched !== original) {
      fs.writeFileSync(filePath, patched, 'utf8');
      console.log(`[postinstall] Wrote changes to ${filePath}`);
    } else {
      console.log('[postinstall] No changes necessary');
    }
  } catch (e) {
    console.log(`[postinstall] Non-fatal error while patching: ${e?.message || e}`);
  }
}

// Patch expo-ads-admob Gradle for Gradle 8+ compatibility
const admobGradlePath = path.join(
  process.cwd(),
  'node_modules',
  'expo-ads-admob',
  'android',
  'build.gradle'
);

safePatch(admobGradlePath, [
  {
    search: "classifier = 'sources'",
    replace: "archiveClassifier.set('sources')"
  }
]);

console.log('[postinstall] Completed custom patches.');