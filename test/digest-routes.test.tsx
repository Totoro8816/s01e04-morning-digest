import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Night } from '../src/digest/types.js';

const base = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60 };

function tempRuns(night: string, content: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'digest-routes-'));
  writeFileSync(join(dir, `${night}.jsonl`), content);
  return dir;
}

describe('digest routes', () => {
  it('serves a real night as page and JSON with the same jobs in the same order', async () => {
    const app = createApp({ ...base, runsDir: 'runs' });
    const page = await app.request('/digest/2026-10-28');
    const api = await app.request('/api/digest/2026-10-28');
    expect(page.status).toBe(200);
    expect(api.status).toBe(200);
    const html = await page.text();
    const night = (await api.json()) as Night;
    expect(night.rows.length).toBeGreaterThan(0);
    const cells = [...html.matchAll(/<tbody>[\s\S]*?<\/tbody>/g)][0]?.[0] ?? '';
    const pageJobs = [...cells.matchAll(/<tr[^>]*><td>([^<]*)<\/td>/g)].map((m) => m[1]);
    expect(pageJobs).toEqual(night.rows.map((r) => r.job));
  });

  it('returns 404 on both routes for a night with no file', async () => {
    const app = createApp({ ...base, runsDir: 'runs' });
    expect((await app.request('/digest/2026-01-01')).status).toBe(404);
    expect((await app.request('/api/digest/2026-01-01')).status).toBe(404);
  });

  it('renders an empty night as "nothing ran" with no rows', async () => {
    const app = createApp({ ...base, runsDir: tempRuns('2026-11-01', '') });
    const page = await app.request('/digest/2026-11-01');
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('nothing ran');
    const api = await app.request('/api/digest/2026-11-01');
    expect(api.status).toBe(200);
    expect(((await api.json()) as Night).rows).toEqual([]);
  });

  it('counts a bad line and still serves the night', async () => {
    const good = '{"at":"2026-11-02T23:00:00+01:00","job":"a/b","status":"ok","owner":"x"}';
    const app = createApp({ ...base, runsDir: tempRuns('2026-11-02', `${good}\nnot json\n`) });
    const page = await app.request('/digest/2026-11-02');
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('a/b');
    const api = await app.request('/api/digest/2026-11-02');
    expect(api.status).toBe(200);
    const night = (await api.json()) as Night;
    expect(night.badLines).toBe(1);
    expect(night.rows).toHaveLength(1);
  });
});
