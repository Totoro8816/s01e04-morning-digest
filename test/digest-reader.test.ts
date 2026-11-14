import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('readNight', () => {
  it('reads 2026-10-28: 5 jobs, 1 bad line', () => {
    const n = readNight('runs', '2026-10-28');
    expect(n?.rows).toHaveLength(5);
    expect(n?.badLines).toBe(1);
    const fx = n?.rows.find((r) => r.job === 'fixtures/refresh');
    expect(fx).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', owner: 'rook' });
  });
  it('keeps a null owner and sorts by job', () => {
    const n = readNight('runs', '2026-10-28');
    expect(n?.rows.find((r) => r.job === 'digest/render')?.owner).toBeNull();
    const jobs = n?.rows.map((r) => r.job) ?? [];
    expect(jobs).toEqual([...jobs].sort());
  });
  it('returns null for a night with no file', () => {
    expect(readNight('runs', '1999-01-01')).toBeNull();
  });
});
