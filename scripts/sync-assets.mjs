import fs from 'node:fs';
import path from 'node:path';

const sourceDir = path.resolve('contract/src/managed/payment');
const targetDirs = [
  path.resolve('public/zk/payment'),
  path.resolve('public/contract/payment'),
];

if (!fs.existsSync(sourceDir)) {
  console.warn(`[sync-assets] Source directory ${sourceDir} does not exist yet. Run 'npm run compact' first.`);
  process.exit(0);
}

for (const targetDir of targetDirs) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const sub of ['keys', 'zkir']) {
    const srcSub = path.join(sourceDir, sub);
    const dstSub = path.join(targetDir, sub);
    if (fs.existsSync(srcSub)) {
      fs.cpSync(srcSub, dstSub, { recursive: true });
      console.log(`[sync-assets] Copied ${srcSub} -> ${dstSub}`);
    }
  }
}

console.log('[sync-assets] ZK Assets successfully synchronized!');
