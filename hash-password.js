import { randomBytes, scryptSync } from 'node:crypto';

const senha = process.argv[2];

if (!senha) {
	console.error('Uso: node hash-password.js <senha>');
	process.exit(1);
}

const salt = randomBytes(16).toString('hex');
const hash = scryptSync(senha, salt, 64).toString('hex');

process.stdout.write(salt + ':' + hash + '\n');
