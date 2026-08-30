const { execFileSync } = require('child_process');
const path = require('path');

// With no Developer ID available, electron-builder skips signing and leaves the
// stock linker-signed Electron signature in place. macOS then reads that as a
// bundle modified after signing and reports the app as "damaged" once it has
// been downloaded and carries a quarantine flag. Re-signing ad-hoc gives the
// bundle a signature that actually matches its contents, which downgrades that
// to the ordinary unidentified-developer prompt.
exports.default = async function adhocSign(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', app]);
  console.log(`  • ad-hoc signed  ${app}`);
};
