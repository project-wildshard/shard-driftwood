import { expect, test } from 'vitest';
import audio from '../src/data/audioSource.json' with { type: 'json' };
import mounts from '../src/mounts.json' with { type: 'json' };
import bank from '../src/static/assets/driftwood-isle/music/driftwood-isle/music.json' with { type: 'json' };

test('the island score carries the original timed stems under the shard slug', () => {
  const dir = '/assets/driftwood-isle/music/driftwood-isle/';
  const music = audio.audio.music;
  expect(music.source).toEqual({ dir, manifestKey: 'driftwood-isle' });
  expect(music.catalogue.mode).toBe('bank');
  expect(music.bootSlots).toEqual(['title', 'island']);
  expect(music.sets).toEqual({ island: 'driftwood-isle' });
  expect(music.controlTension).toBe('late');
  const score = bank.slots.island;
  expect(score).toMatchObject({ bpm: 76.781, beatsPerBar: 4, loopStart: 14.3035, loopEnd: 54.9384, duration: 58.0693 });
  expect(bank.stings).toEqual({});
  const urls = mounts.outputs['driftwood-isle'];
  expect(urls.filter(url => url.includes('/music/'))).toEqual([`${dir}${score.calm}`, `${dir}${score.tension}`, `${dir}music.json`]);
});
