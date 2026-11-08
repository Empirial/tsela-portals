// Runs the Firebase CLI with a longer function-load timeout (the default 10s is too short on slow disks).
// Usage: node run.mjs emulators | node run.mjs test
import { spawn } from 'node:child_process';

const mode = process.argv[2];
const only = 'auth,functions,firestore,storage';
const args =
  mode === 'test'
    ? ['emulators:exec', '--only', only, '"npm --prefix functions run smoke"']
    : ['emulators:start', '--only', `${only},ui`];

const child = spawn('firebase', args, {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, FUNCTIONS_DISCOVERY_TIMEOUT: '120' },
});
child.on('exit', (code) => process.exit(code ?? 1));
