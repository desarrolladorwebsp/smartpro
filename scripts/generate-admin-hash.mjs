import crypto from 'node:crypto';

const password = process.argv[2]?.trim();

if (!password) {
  console.error('Debes pasar la contraseña inicial como argumento.');
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const derived = crypto.scryptSync(password.normalize('NFKC'), salt, 64, { N: 16384, r: 8, p: 1 });

console.log(`scrypt$${salt.toString('hex')}$${derived.toString('hex')}`);
