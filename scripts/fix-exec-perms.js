#!/usr/bin/env node
const { execSync } = require('child_process');
const { existsSync } = require('fs');

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.warn(`[warn] command failed: ${cmd}`);
  }
}

console.log('[fix-exec-perms] Ensuring RN/Expo scripts are executable...');
if (existsSync('node_modules/react-native/scripts')) {
  run('chmod -R +x node_modules/react-native/scripts');
}
if (existsSync('node_modules/expo-modules-autolinking')) {
  run('chmod -R +x node_modules/expo-modules-autolinking');
}
if (existsSync('node_modules/expo-constants/scripts')) {
  run('chmod -R +x node_modules/expo-constants/scripts');
}
if (existsSync('node_modules/.bin')) {
  run('chmod -R +x node_modules/.bin');
}

console.log('[fix-exec-perms] Mark all *.sh under node_modules/**/scripts as executable...');
run("find node_modules -path '*/scripts/*.sh' -type f -exec chmod +x {} \\;");

if (process.platform === 'darwin') {
  console.log('[fix-exec-perms] Removing com.apple.quarantine where present...');
  run('xattr -r -d com.apple.quarantine node_modules');
}

console.log('[fix-exec-perms] Done.');