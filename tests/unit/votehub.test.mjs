import test from 'node:test';
import assert from 'node:assert/strict';
import { VoteHubClient, voteHubPollsUrl } from '../../packages/connectors/src/votehub.ts';

const sample = { id: 'gen202synthetic1', poll_type: 'generic-ballot', pollster: 'Example Research', answers: [{ choice: 'Dem', pct: 44 }, { choice: 'Rep', pct: 43 }], end_date: '2026-10-31', sample_size: '1000' };
const poll = (path, body, code = 200) => ({ path, body, code });
function fakeHttp(routes, called) {
  return async (url, options) => {
    called.push({ url, options });
    const route = routes.find(r => r.path === url);
    if (!route) return new Response('missing', { status: 404 });
    return Response.json(route.body, { status: route.code });
  };
}

test('no filters request all poll types, not just generic ballot', () => {
  assert.equal(voteHubPollsUrl(), 'https://api.votehub.com/polls');
  assert.match(voteHubPollsUrl({ poll_type: 'approval', population: 'lv' }), /poll_type=approval&population=lv/);
});

test('all five documented endpoints; preserve raw poll and source attribution', async () => {
  const called = [];
  const api = new VoteHubClient({ fetcher: fakeHttp([
    poll('https://api.votehub.com/polls', { polls: [sample, { ...sample, id: 'gov-synth', poll_type: 'governor' }] }),
    poll('https://api.votehub.com/polls/gen202synthetic1', sample),
    poll('https://api.votehub.com/pollsters', ['Example Research']),
    poll('https://api.votehub.com/poll-types', ['generic-ballot', 'governor']),
    poll('https://api.votehub.com/subjects', [{ subject: '2026', poll_types: ['generic-ballot'] }]),
  ], called), now: () => 1793650000000 });
  const all = await api.getPolls();
  assert.equal(all.data.length, 2);
  assert.equal(all.data[1].poll_type, 'governor');
  assert.equal(all.data[0].raw.sample_size, '1000');
  assert.equal(all.cached, false);
  assert.equal(all.stale, false);
  assert.match(all.license, /creativecommons.org\/licenses\/by\/4.0/);
  assert.equal((await api.getPollById('gen202synthetic1')).data.id, sample.id);
  assert.deepEqual((await api.getPollsters()).data, ['Example Research']);
  assert.deepEqual((await api.getPollTypes()).data, ['generic-ballot', 'governor']);
  assert.deepEqual((await api.getSubjects()).data[0].poll_types, ['generic-ballot']);
  assert.equal(called.length, 5);
});

test('cache avoids repeated calls; refresh bypasses cache; stale cache is identified', async () => {
  const calls = [];
  let now = 100000;
  const routes = [poll('https://api.votehub.com/polls', { polls: [sample] })];
  const api = new VoteHubClient({ fetcher: fakeHttp(routes, calls), now: () => now, cacheMs: 1000 });
  await api.getPolls();
  assert.equal((await api.getPolls()).cached, true);
  assert.equal(calls.length, 1);
  assert.equal((await api.getPolls({}, true)).cached, false);
  assert.equal(calls.length, 2);
  now += 2000;
  routes.length = 0;
  const old = await api.getPolls();
  assert.equal(old.cached, true);
  assert.equal(old.stale, true);
  assert.equal(calls.length, 3);
});

test('reject bad filter data, malformed bodies, and poll id traversal', async () => {
  assert.throws(() => voteHubPollsUrl({ min_sample_size: -1 }));
  assert.throws(() => voteHubPollsUrl({ from_date: '2026-11-02', to_date: '2026-11-01' }));
  assert.throws(() => voteHubPollsUrl({ from_date: 'tomorrow' }));
  const api = new VoteHubClient({ fetcher: async () => Response.json({ polls: [{ ...sample, answers: [{ choice: 'Dem', pct: '44' }] }] }) });
  await assert.rejects(api.getPolls(), /malformed poll answer/);
  assert.throws(() => api.getPollById('../subjects'), /invalid poll ID/);
});

test('upstream error without cache is visible; no silent fake data', async () => {
  const api = new VoteHubClient({ fetcher: async () => new Response('no', { status: 503 }) });
  await assert.rejects(api.getPollTypes(), /HTTP 503/);
});

test('live VoteHub direct top-level poll array is accepted without losing fields',async()=>{
  const api=new VoteHubClient({fetcher:async()=>Response.json([{...sample,poll_type:'approval',sample_size:800}])});
  const response=await api.getPolls();
  assert.equal(response.data.length,1);
  assert.equal(response.data[0].poll_type,'approval');
  assert.equal(response.data[0].raw.sample_size,800);
});
