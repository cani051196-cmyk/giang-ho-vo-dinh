import type { GameSnapshot } from '../core/types';
import { GameEngine } from './engine';

export interface SimulationSummary {
  win_rate: number;
  average_turns: number;
  average_damage: number;
  escape_rate: number;
  injury_rate: number;
  resource_usage: number;
}

export function simulateCombat(base: GameSnapshot, targetId: string, runs = 100): SimulationSummary {
  const engine = new GameEngine();
  let wins = 0;
  let escapes = 0;
  let totalTurns = 0;
  let totalDamage = 0;
  let injured = 0;
  let totalResourceUsage = 0;

  for (let i = 0; i < runs; i += 1) {
    const snapshot = structuredClone(base);
    const target = snapshot.world.npcs[targetId];
    if (!target) continue;

    // The simulator must test combat itself, not fail because the target started elsewhere.
    target.location_id = snapshot.player.location_id;
    let turns = 0;
    let qiSpent = 0;
    const damageStart = target.health;

    while (turns < 40 && snapshot.player.alive && target.alive) {
      const techniqueId = snapshot.world.martial_arts[snapshot.player.martial_art_ids[0]]?.technique_ids[0];
      const beforeQi = snapshot.player.qi.current;
      const result = engine.resolve(snapshot, {
        schema_version: '1.0',
        action_id: `sim_${i}_${turns}`,
        actor_id: snapshot.player.id,
        action_type: 'ATTACK',
        target_id: targetId,
        parameters: { technique_id: techniqueId },
        source: 'QUICK_ACTION'
      });
      turns += 1;
      qiSpent += Math.max(0, beforeQi - snapshot.player.qi.current);

      if (result.outcome === 'WIN') wins += 1;
      if (result.outcome === 'SURVIVE') escapes += 1;
      if (snapshot.player.injuries.length > 0) injured += 1;
      if (result.status === 'REJECTED') break;
    }

    totalTurns += turns;
    totalDamage += damageStart - target.health;
    totalResourceUsage += qiSpent;
  }

  return {
    win_rate: wins / runs,
    average_turns: totalTurns / runs,
    average_damage: totalDamage / runs,
    escape_rate: escapes / runs,
    injury_rate: injured / runs,
    resource_usage: totalResourceUsage / runs
  };
}
