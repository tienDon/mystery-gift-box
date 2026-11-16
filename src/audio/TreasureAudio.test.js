import test from 'node:test';
import assert from 'node:assert/strict';
import { TreasureAudio } from './TreasureAudio.js';

function fakeContext() {
  const parameter = () => ({
    value: 0,
    cancelScheduledValues() {},
    setValueAtTime(value) { this.value = value; },
    linearRampToValueAtTime(value) { this.value = value; },
    exponentialRampToValueAtTime(value) { this.value = value; },
  });
  const node = () => ({ connect() {}, gain: parameter(), frequency: parameter(), Q: parameter() });
  const ctx = {
    currentTime: 0, sampleRate: 100, state: 'suspended', destination: {}, started: 0,
    createGain: node, createDynamicsCompressor: node, createBiquadFilter: node,
    createBuffer: () => ({ getChannelData: () => new Float32Array(100) }),
    createOscillator: source, createBufferSource: source,
    async resume() { this.state = 'running'; },
    async suspend() { this.state = 'suspended'; },
    async close() { this.state = 'closed'; },
  };
  function source() { return { ...node(), start() { ctx.started++; }, stop() { this.onended?.(); } }; }
  return ctx;
}

test('audio is lazy, muted by default, and mute cancels sources and music', async () => {
  const ctx = fakeContext();
  let allocations = 0;
  const audio = new TreasureAudio({ contextFactory: () => { allocations++; return ctx; }, isHidden: () => false });
  audio.play('open');
  assert.equal(allocations, 0);
  await audio.enable();
  assert.equal(allocations, 1);
  assert(audio.musicTimer);
  const before = ctx.started;
  for (const name of ['shake', 'open', 'coins', 'tap', 'page', 'correct', 'review', 'reward', 'close']) audio.play(name);
  assert(ctx.started > before);
  await audio.disable();
  assert.equal(audio.sources.size, 0);
  assert.equal(audio.musicTimer, null);
  assert.equal(ctx.state, 'suspended');
  const mutedCount = ctx.started;
  audio.play('page');
  assert.equal(ctx.started, mutedCount);
  audio.dispose();
});

test('quiz is quieter, closing fades music, reopening restarts it', async () => {
  const ctx = fakeContext();
  const audio = new TreasureAudio({ contextFactory: () => ctx, isHidden: () => false });
  audio.setScene('quiz');
  await audio.enable();
  assert.equal(audio.music.gain.value, 0.46);
  audio.setScene('closing');
  assert.equal(audio.music.gain.value, 0);
  assert.equal(audio.musicTimer, null);
  audio.setScene('done');
  audio.setScene('shaking');
  assert(audio.musicTimer);
  assert.equal(audio.music.gain.value, 0.64);
  audio.dispose();
});

test('backgrounding silences audio; only an enabled engine resumes', async () => {
  let hidden = false;
  const ctx = fakeContext();
  const audio = new TreasureAudio({ contextFactory: () => ctx, isHidden: () => hidden });
  await audio.enable();
  hidden = true;
  audio.visibilityChanged();
  await Promise.resolve();
  assert.equal(audio.sources.size, 0);
  assert.equal(ctx.state, 'suspended');
  const count = ctx.started;
  audio.play('reward');
  assert.equal(ctx.started, count);
  hidden = false;
  audio.visibilityChanged();
  await Promise.resolve();
  assert.equal(ctx.state, 'running');
  assert(audio.musicTimer);
  await audio.disable();
  audio.visibilityChanged();
  assert.equal(ctx.state, 'suspended');
  audio.dispose();
});

test('unsupported audio and resume failure leave the app silent', async () => {
  const missing = new TreasureAudio({ contextFactory: () => null, isHidden: () => false });
  assert.equal(await missing.enable(), false);
  missing.play('tap');
  missing.dispose();
  const ctx = fakeContext();
  ctx.resume = async () => { throw new Error('blocked'); };
  const blocked = new TreasureAudio({ contextFactory: () => ctx, isHidden: () => false });
  assert.equal(await blocked.enable(), false);
  assert.equal(blocked.musicTimer, undefined);
  blocked.dispose();
});

test('loaded theme replaces fallback, loops, and stops on mute', async () => {
  const ctx = fakeContext();
  const buffer = { duration: 57.65 };
  const audio = new TreasureAudio({ contextFactory: () => ctx, isHidden: () => false, musicLoader: async () => buffer });
  await audio.enable();
  await audio.musicPromise;
  assert.equal(audio.musicTimer, null);
  assert.equal(audio.themeSource.buffer, buffer);
  assert.equal(audio.themeSource.loop, true);
  assert.equal(audio.musicSources.size, 1);
  await audio.disable();
  assert.equal(audio.themeSource, null);
  assert.equal(audio.sources.size, 0);
  await audio.enable();
  assert.equal(audio.themeSource.buffer, buffer);
  audio.dispose();
});

test('loading after mute does not restart playback, failed load retains fallback', async () => {
  const ctx = fakeContext();
  let finishLoad;
  const audio = new TreasureAudio({ contextFactory: () => ctx, isHidden: () => false, musicLoader: () => new Promise(resolve => { finishLoad = resolve; }) });
  await audio.enable();
  await audio.disable();
  finishLoad({ duration: 57 });
  await audio.musicPromise;
  assert.equal(audio.themeSource, null);
  assert.equal(audio.musicTimer, null);
  audio.dispose();

  const fallback = new TreasureAudio({ contextFactory: fakeContext, isHidden: () => false, musicLoader: async () => { throw Error('offline'); } });
  await fallback.enable();
  await fallback.musicPromise;
  assert(fallback.musicTimer);
  assert.equal(fallback.themeSource, undefined);
  fallback.dispose();
});

test('correct and review have distinct melodies, and restore the quiz mix', async () => {
  const audio = new TreasureAudio({ contextFactory: fakeContext, isHidden: () => false });
  audio.setScene('quiz');
  await audio.enable();
  const notes = [];
  audio.tone = (frequency, delay) => notes.push([frequency, delay]);
  audio.play('correct');
  assert.deepEqual(notes.filter((_, i) => i < 8 && i % 2 === 0).map(note => note[0]), [523.25, 659.25, 783.99, 1046.5]);
  notes.length = 0;
  audio.play('review');
  assert.deepEqual(notes.slice(0, 3).map(note => note[0]), [440, 349.23, 293.66]);
  assert.equal(audio.music.gain.value, 0.46);
  audio.dispose();
});
