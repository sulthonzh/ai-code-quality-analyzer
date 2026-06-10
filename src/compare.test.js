import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { formatCompareHuman, formatCompareJson } from './compare.js';

describe('formatCompareHuman', () => {
  it('shows score improvement', () => {
    const results = {
      base: { ref: 'main', summary: { score: 72, codeFiles: 10, codeLines: 500, totalLines: 700 }, recommendations: [{ type: 'large-files', severity: 'warning', message: '1 file(s) exceed 500 lines.' }] },
      head: { ref: 'HEAD', summary: { score: 80, codeFiles: 12, codeLines: 600, totalLines: 800 }, recommendations: [{ type: 'overall', severity: 'good', message: 'Codebase looks healthy.' }] },
      delta: { score: 8, codeFiles: 2, codeLines: 100, totalLines: 100 },
      newIssues: [],
      resolvedIssues: [{ type: 'large-files', severity: 'warning', message: '1 file(s) exceed 500 lines.' }],
    };
    const out = formatCompareHuman(results);
    assert.ok(out.includes('72 → 80'));
    assert.ok(out.includes('+8'));
    assert.ok(out.includes('Quality improved'));
    assert.ok(out.includes('Resolved issues'));
  });

  it('shows score degradation', () => {
    const results = {
      base: { ref: 'main', summary: { score: 85, codeFiles: 8, codeLines: 400, totalLines: 500 }, recommendations: [] },
      head: { ref: 'HEAD', summary: { score: 70, codeFiles: 8, codeLines: 400, totalLines: 500 }, recommendations: [{ type: 'high-complexity', severity: 'warning', message: '2 file(s) have high complexity.' }] },
      delta: { score: -15, codeFiles: 0, codeLines: 0, totalLines: 0 },
      newIssues: [{ type: 'high-complexity', severity: 'warning', message: '2 file(s) have high complexity.' }],
      resolvedIssues: [],
    };
    const out = formatCompareHuman(results);
    assert.ok(out.includes('85 → 70'));
    assert.ok(out.includes('-15'));
    assert.ok(out.includes('degraded'));
    assert.ok(out.includes('New issues'));
  });

  it('shows unchanged score', () => {
    const results = {
      base: { ref: 'v1.0', summary: { score: 80, codeFiles: 5, codeLines: 300, totalLines: 400 }, recommendations: [] },
      head: { ref: 'HEAD', summary: { score: 80, codeFiles: 5, codeLines: 300, totalLines: 400 }, recommendations: [] },
      delta: { score: 0, codeFiles: 0, codeLines: 0, totalLines: 0 },
      newIssues: [],
      resolvedIssues: [],
    };
    const out = formatCompareHuman(results);
    assert.ok(out.includes('unchanged'));
  });
});

describe('formatCompareJson', () => {
  it('produces valid JSON with delta', () => {
    const results = {
      base: { ref: 'main', summary: { score: 80 }, recommendations: [] },
      head: { ref: 'HEAD', summary: { score: 85 }, recommendations: [] },
      delta: { score: 5, codeFiles: 0, codeLines: 0, totalLines: 0 },
      newIssues: [],
      resolvedIssues: [],
    };
    const json = formatCompareJson(results);
    const parsed = JSON.parse(json);
    assert.equal(parsed.delta.score, 5);
  });
});
