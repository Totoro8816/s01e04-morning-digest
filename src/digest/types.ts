export type JobStatus = 'ok' | 'retry' | 'fail';

// One row per job for one night.
export type DigestRow = {
  job: string;
  owner: string | null; // null renders as "—"
  runs: number; // log lines for this job
  retries: number; // lines with status "retry"
  lastStatus: JobStatus;
  lastError: string | null;
  first: string; // `at` of the first line, offset kept
  last: string; // `at` of the last line, offset kept
};

export type Night = {
  night: string; // YYYY-MM-DD
  rows: DigestRow[]; // sorted by job
  badLines: number; // lines that did not parse, counted and never thrown
};

// Returns null when runs/<night>.jsonl does not exist.
export type ReadNight = (runsDir: string, night: string) => Night | null;
