import { json } from '@sveltejs/kit';
import { clearAdminSession } from '$lib/admin/auth';

export async function POST({ cookies }) {
  clearAdminSession(cookies);
  return json({ ok: true });
}
