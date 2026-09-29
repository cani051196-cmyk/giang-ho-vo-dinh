import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';

const COOKIE = 'ghvd_admin';
const MAX_AGE_SECONDS = 60 * 60 * 24;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'dev-only-change-me';
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('hex');
}

export function createAdminSession(cookies: Cookies) {
  const expires = String(Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS);
  const payload = `${expires}.${sign(expires)}`;
  cookies.set(COOKIE, payload, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_SECONDS
  });
}

export function clearAdminSession(cookies: Cookies) {
  cookies.delete(COOKIE, { path: '/' });
}

export function isAdmin(cookies: Cookies) {
  const raw = cookies.get(COOKIE);
  if (!raw) return false;
  const [expires, signature] = raw.split('.');
  if (!expires || !signature) return false;
  if (Number(expires) < Math.floor(Date.now() / 1000)) return false;
  const expected = sign(expires);
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function verifyAdminPassword(input: unknown) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return false;
  if (process.env.NODE_ENV === 'production' && configured === 'change-me') return false;
  return typeof input === 'string' && input.length > 0 && input === configured;
}

export { COOKIE as ADMIN_COOKIE };
