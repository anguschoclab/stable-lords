const { execSync } = require('child_process');
try {
  execSync('pnpm tsc --noEmit', { stdio: 'inherit' });
} catch(e) {
  // Let it fail silently, we will see output
}
