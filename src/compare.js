import { execSync } from 'child_process';
import { analyze } from './analyzer.js';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Compare code quality between two git refs (branches, tags, commits).
 * Uses git worktree to checkout the base ref in a temp directory.
 */
export async function compare(rootDir, baseRef, headRef = 'HEAD') {
  const results = {};

  // Analyze HEAD (current state) first
  results.head = await analyze(rootDir);
  results.head.ref = headRef;

  // Try to analyze base ref
  const tmpDir = mkdtempSync(join(tmpdir(), 'codeq-compare-'));
  try {
    execSync(`git worktree add "${tmpDir}" ${baseRef} 2>/dev/null`, {
      cwd: rootDir,
      stdio: 'pipe',
    });
    results.base = await analyze(tmpDir);
    results.base.ref = baseRef;
  } catch (err) {
    // Fallback: try stashing + checkout approach
    try {
      execSync(`git stash --quiet`, { cwd: rootDir, stdio: 'pipe' });
      execSync(`git checkout ${baseRef} --quiet 2>/dev/null`, { cwd: rootDir, stdio: 'pipe' });
      results.base = await analyze(rootDir);
      results.base.ref = baseRef;
      execSync(`git checkout - --quiet`, { cwd: rootDir, stdio: 'pipe' });
      execSync(`git stash pop --quiet`, { cwd: rootDir, stdio: 'pipe' });
    } catch {
      throw new Error(
        `Could not checkout "${baseRef}". Make sure you're in a git repo and the ref exists.`
      );
    }
  } finally {
    try {
      execSync(`git worktree remove "${tmpDir}" --force 2>/dev/null`, { stdio: 'pipe' });
    } catch {}
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }

  // Compute delta
  results.delta = {
    score: results.head.summary.score - results.base.summary.score,
    codeFiles: results.head.summary.codeFiles - results.base.summary.codeFiles,
    codeLines: results.head.summary.codeLines - results.base.summary.codeLines,
    totalLines: results.head.summary.totalLines - results.base.summary.totalLines,
  };

  // New/degraded recommendations
  const baseRecTypes = new Set(results.base.recommendations.map(r => r.type));
  results.newIssues = results.head.recommendations.filter(
    r => !baseRecTypes.has(r.type) && r.severity !== 'good'
  );
  results.resolvedIssues = results.base.recommendations.filter(
    r => !new Set(results.head.recommendations.map(h => h.type)).has(r.type) && r.severity !== 'good'
  );

  return results;
}

export function formatCompareHuman(results) {
  const { base, head, delta, newIssues, resolvedIssues } = results;
  const lines = [];

  lines.push(`codeq — branch comparison`);
  lines.push(`─────────────────────────────`);
  lines.push(`  base: ${base.ref}`);
  lines.push(`  head: ${head.ref}`);
  lines.push('');

  // Score comparison
  const scoreArrow = delta.score > 0 ? '↑' : delta.score < 0 ? '↓' : '→';
  const scoreColor = delta.score > 0 ? '+' : '';
  lines.push(`  Score:   ${base.summary.score} → ${head.summary.score}  (${scoreColor}${delta.score} ${scoreArrow})`);
  lines.push(`  Files:   ${base.summary.codeFiles} → ${head.summary.codeFiles}  (${delta.codeFiles >= 0 ? '+' : ''}${delta.codeFiles})`);
  lines.push(`  Lines:   ${base.summary.codeLines} → ${head.summary.codeLines}  (${delta.codeLines >= 0 ? '+' : ''}${delta.codeLines})`);
  lines.push('');

  if (resolvedIssues.length > 0) {
    lines.push(`Resolved issues:`);
    for (const r of resolvedIssues) {
      lines.push(`  ✅ ${r.message}`);
    }
    lines.push('');
  }

  if (newIssues.length > 0) {
    lines.push(`New issues:`);
    for (const r of newIssues) {
      const icon = r.severity === 'warning' ? '⚠️' : '💡';
      lines.push(`  ${icon} ${r.message}`);
    }
    lines.push('');
  }

  if (newIssues.length === 0 && resolvedIssues.length === 0) {
    lines.push(`  No changes in code quality issues.`);
    lines.push('');
  }

  // Verdict
  if (delta.score > 0) {
    lines.push(`✅ Quality improved!`);
  } else if (delta.score < -5) {
    lines.push(`❌ Quality degraded significantly.`);
  } else if (delta.score < 0) {
    lines.push(`⚠️  Slight quality decrease.`);
  } else {
    lines.push(`➡️  Quality unchanged.`);
  }

  return lines.join('\n');
}

export function formatCompareJson(results) {
  return JSON.stringify(results, null, 2);
}
