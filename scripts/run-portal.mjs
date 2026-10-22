import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const [portal = 'guest', command = 'dev'] = process.argv.slice(2);
if (!['guest', 'management', 'admin'].includes(portal) || !['dev', 'build', 'start'].includes(command)) {
  throw new Error('Usage: node scripts/run-portal.mjs <guest|management|admin> <dev|build|start>');
}
const port = process.env.PORT || (portal === 'admin' ? '3002' : portal === 'management' ? '3001' : '3000');
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), command, ...(command === 'build' ? [] : ['--port', port])], {
  stdio: 'inherit',
  env: { ...process.env, APP_PORTAL: portal },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
