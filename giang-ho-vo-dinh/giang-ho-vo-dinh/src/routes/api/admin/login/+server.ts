import { json } from '@sveltejs/kit';
import { createAdminSession, isAdmin, verifyAdminPassword } from '$lib/admin/auth';

export async function POST({ request, cookies }) {
  const body = await request.json().catch(() => ({}));
  if (!verifyAdminPassword(body?.password)) {
    return json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
  }
  createAdminSession(cookies);
  return json({ ok: true });
}

export async function GET({ cookies }) {
  const configured = Boolean(process.env.ADMIN_PASSWORD);
  return json({ authenticated: isAdmin(cookies), configured });
}
