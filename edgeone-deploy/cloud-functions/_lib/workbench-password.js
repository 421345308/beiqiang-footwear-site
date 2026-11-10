import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { ApiError } from './workbench.js';

// OWASP's 32 MiB scrypt setting; admit only one derivation per process so the
// small self-hosted API cannot exhaust its memory limit on concurrent logins.
const derive = promisify(scrypt);
const COST = 32768, BLOCK = 8, PARALLEL = 3, KEY_BYTES = 32;
const OPTIONS = { N: COST, r: BLOCK, p: PARALLEL, maxmem: 64 * 1024 * 1024 };
const DUMMY = { salt: '00000000000000000000000000000000', digest: '00'.repeat(KEY_BYTES) };
let busy = false;

async function calculate(password, salt) {
  if (busy) throw new ApiError(503, '登录服务正忙，请稍后重试。');
  busy = true;
  try { return await derive(password, Buffer.from(salt, 'hex'), KEY_BYTES, OPTIONS); }
  finally { busy = false; }
}

export function validNewPassword(value) {
  return typeof value === 'string' && Array.from(value).length >= 12 && Buffer.byteLength(value, 'utf8') <= 1024;
}

export async function makePassword(value) {
  if (!validNewPassword(value)) throw new ApiError(400, '密码至少 12 个字符，且不能超过 1024 字节。');
  const salt = randomBytes(16).toString('hex');
  const digest = (await calculate(value, salt)).toString('hex');
  return { algorithm: 'scrypt', cost: COST, block: BLOCK, parallel: PARALLEL, salt, digest };
}

export async function checkPassword(value, credential) {
  const valid = credential?.algorithm === 'scrypt' && credential.cost === COST && credential.block === BLOCK && credential.parallel === PARALLEL &&
    /^[a-f0-9]{32}$/.test(credential.salt || '') && /^[a-f0-9]{64}$/.test(credential.digest || '');
  const input = typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= 1024 ? value : '';
  const saved = valid ? credential : DUMMY;
  const actual = await calculate(input, saved.salt), expected = Buffer.from(saved.digest, 'hex');
  return Boolean(valid && input && timingSafeEqual(actual, expected));
}
