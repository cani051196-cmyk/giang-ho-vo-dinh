import { json } from '@sveltejs/kit';
import { loadGame, saveGame } from '$lib/core/game-service';
export async function POST(){ return json(await saveGame()); }
export async function GET(){ return json(await loadGame()); }
