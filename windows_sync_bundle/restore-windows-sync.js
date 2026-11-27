#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const backupsBase = path.join(root, '_sync_backups');
const argPath = process.argv[2];

function listBackupDirs() {
  if (!fs.existsSync(backupsBase)) return [];
  return fs.readdirSync(backupsBase, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function resolveBackupDir() {
  if (argPath) {
    const direct = path.isAbsolute(argPath) ? argPath : path.join(root, argPath);
    if (!fs.existsSync(direct) || !fs.statSync(direct).isDirectory()) {
      throw new Error(`Backup directory not found: ${direct}`);
    }
    return direct;
  }

  const backups = listBackupDirs();
  if (!backups.length) {
    throw new Error('No backups found in _sync_backups/');
  }
  return path.join(backupsBase, backups[backups.length - 1]);
}

function copyRecursive(sourceDir, targetDir) {
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true });
      copyRecursive(sourcePath, targetPath);
    } else {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function main() {
  const backupDir = resolveBackupDir();
  copyRecursive(backupDir, root);
  console.log(`Restored files from backup: ${backupDir}`);
}

main();
