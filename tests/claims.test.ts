import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

interface ClaimEntry {
  id: string;
  claim: string;
  where: string;
  test: string;
  sandbox: string;
}

const claims = JSON.parse(readFileSync('.factory/claims.json', 'utf8')) as ClaimEntry[];
const e2e = readFileSync('tests/e2e/app.spec.ts', 'utf8');
const html = ['index.html', 'privacy/index.html', 'terms/index.html', '404.html']
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n');
const readme = readFileSync('README.md', 'utf8');

function occurrences(source: string, value: string): number {
  return source.split(value).length - 1;
}

describe('visitor claims contract', () => {
  it('declares one exact runnable test tag for every unique claim and no undeclared tags', () => {
    const ids = claims.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const claim of claims) {
      expect(claim).toEqual(expect.objectContaining({
        claim: expect.any(String),
        where: expect.any(String),
        sandbox: expect.any(String),
        test: `npm run test:e2e -- --grep @claim:${claim.id}`
      }));
      expect(occurrences(e2e, `@claim:${claim.id}`), claim.id).toBe(1);
    }
    const tags = [...e2e.matchAll(/@claim:([a-z0-9-]+)/g)].map((match) => match[1]);
    expect([...new Set(tags)].sort()).toEqual([...ids].sort());
  });

  it('maps every marked product and README claim to the declared contract', () => {
    const declared = new Set(claims.map(({ id }) => id));
    const htmlClaims = [...html.matchAll(/data-claim="([^"]+)"/g)]
      .flatMap((match) => match[1].split(/\s+/));
    const readmeClaims = [...readme.matchAll(/<!-- claim:([a-z0-9-]+) -->/g)]
      .map((match) => match[1]);
    const surfaced = new Set([...htmlClaims, ...readmeClaims]);
    expect([...surfaced].filter((id) => !declared.has(id))).toEqual([]);
    expect([...declared].filter((id) => !surfaced.has(id))).toEqual([]);
  });

  it('keeps every verifier-cited promise explicit and mapped', () => {
    expect(html).toContain('No account or installation required.');
    expect(html).toContain('Free to use under the MIT License.');
    expect(readme).toContain('No third-party runtime scripts, fonts, analytics, or trackers are');
    expect(readme).toContain('including `recorded_at`');
    expect(readme).toContain('A CSV without a type');
    expect(readme).toContain('workouts, routes, clinical records, ActivitySummary, and nested');
    for (const id of ['no-setup', 'free-source', 'first-party-runtime', 'csv-conventions', 'apple-record-scope']) {
      expect(claims.some((claim) => claim.id === id), id).toBe(true);
    }
  });
});
