import { spawnSync } from 'node:child_process';

process.env.VITE_BASE = '/desafio-clinico-unirp/';

const tsc = spawnSync('npx', ['tsc', '-b'], { stdio: 'inherit', shell: true, env: process.env });
if (tsc.status) process.exit(tsc.status ?? 1);

const vite = spawnSync('npx', ['vite', 'build'], { stdio: 'inherit', shell: true, env: process.env });
process.exit(vite.status ?? 1);
