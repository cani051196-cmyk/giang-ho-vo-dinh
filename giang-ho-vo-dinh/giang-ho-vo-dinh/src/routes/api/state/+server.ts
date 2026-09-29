import { json } from '@sveltejs/kit';
import { getPlayerView } from '$lib/core/game-service';
export async function GET(){ return json(await getPlayerView()); }
