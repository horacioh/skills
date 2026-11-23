import assert from 'node:assert/strict';
import { test } from 'node:test';
import { timeCaptions } from './captions.mjs';

test('silent scenes give each caption time to be read', () => {
  const scene = { say: 'Read *the first sentence*. Also the second. Finally the third.', start: 4, audioAt: 4.35, duration: 3 };
  const captions = timeCaptions(scene);
  assert.equal(scene.duration, 4.5);
  assert.deepEqual(captions.map(c => c.start), [4, 5.5, 7]);
  assert.equal(captions[0].text, 'Read *the first sentence*.');
  assert.equal(timeCaptions(scene, { duration: 3, sentences: [{ start: 0 }, { start: 1.25 }] })[1].start, 5.6);
});
