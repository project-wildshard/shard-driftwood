// meta ONE-FORMAT OF22e2 (opus-drift6): the hold key goes to whoever beats the drowned sailor (`dead:sailor` is each player's
// own credit), but he came back only at night (respawnWhen.night), so in a shared room a player who arrived by day after
// another had beaten him met a padlocked pump for up to half a day cycle (~24 min). He now returns by day too, three
// minutes after his fall once no player stands within 60 m, so every player can earn the key.
import { expect, test } from 'vitest';
import { driftwoodDeclaredRoster } from '../src/generators/rows/declaredRoster';

test('the drowned sailor returns by day, so a later player can win the hold key', () => {
  const sailors = driftwoodDeclaredRoster({} as never).spawns.filter(row => row.strike === 'strike.sailor.swing');
  expect(sailors.length).toBeGreaterThan(0);
  for (const row of sailors) {
    expect(row.respawn).toBe(180);
    expect(row.respawnWhen?.night).toBeUndefined();
    expect(row.respawnWhen?.away).toBe(60);
  }
});
