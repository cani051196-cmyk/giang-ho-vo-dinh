import { json } from '@sveltejs/kit';

export async function GET() {
  return json({ ok: true, service: 'giang-ho-vo-dinh', timestamp: new Date().toISOString() });
}
