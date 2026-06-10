#!/usr/bin/env node
import { analyze } from './analyzer.js';
import { formatHuman, formatJson } from './reporter.js';
import { compare, formatCompareHuman, formatCompareJson } from './compare.js';
import { resolve } from 'path';

const args = process.argv.slice(2);
const dir = resolve(args.find(a => !a.startsWith('-')) || '.');
const jsonOutput = args.includes('--json');
const quiet = args.includes('--quiet');

// Parse --threshold <number> or --threshold=<number>
const thresholdIdx = args.indexOf('--threshold');
const thresholdEq = args.find(a => a.startsWith('--threshold='));
let threshold = 50;
if (thresholdIdx !== -1 && args[thresholdIdx + 1]) {
  threshold = parseInt(args[thresholdIdx + 1], 10);
} else if (thresholdEq) {
  threshold = parseInt(thresholdEq.split('=')[1], 10);
}
if (isNaN(threshold)) threshold = 50;

// Parse --compare <ref> or --compare=<ref>
const compareIdx = args.indexOf('--compare');
const compareEq = args.find(a => a.startsWith('--compare='));
let compareRef = null;
if (compareIdx !== -1 && args[compareIdx + 1]) {
  compareRef = args[compareIdx + 1];
} else if (compareEq) {
  compareRef = compareEq.split('=')[1];
}

async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`codeq — AI-friendly code quality analyzer

Usage:
  codeq [path]              Analyze a directory (default: .)
  codeq --json              Output structured JSON
  codeq --quiet             Only show summary
  codeq --threshold <n>     Fail if score is below <n> (default: 50)
  codeq --compare <ref>     Compare current state against a git ref (branch/tag/commit)
  codeq --help              Show this help

Metrics:
  • File sizes & line counts
  • Function complexity estimation
  • TODO/FIXME/HACK tracking
  • Duplicate code detection
  • Import dependency graph stats

CI Usage:
  codeq --json --threshold 70 .
  Exit code 0 if score >= threshold, 1 otherwise.

Compare branches:
  codeq --compare main
  codeq --compare v1.0.0 --json
  Shows score delta, new/resolved issues between refs.
`);
    return;
  }

  // Branch comparison mode
  if (compareRef) {
    const results = await compare(dir, compareRef);

    if (jsonOutput) {
      console.log(formatCompareJson(results));
    } else {
      console.log(formatCompareHuman(results));
    }

    // Exit 1 if score degraded by more than threshold
    if (results.delta.score < -threshold) {
      if (!quiet) {
        console.error(`\n❌ Quality dropped by ${Math.abs(results.delta.score)} points (threshold: ${threshold})`);
      }
      process.exit(1);
    }
    return;
  }

  // Normal analysis mode
  const results = await analyze(dir);
  
  if (jsonOutput) {
    console.log(formatJson(results));
  } else {
    console.log(formatHuman(results, { quiet }));
  }

  if (results.score < threshold) {
    if (!quiet) {
      console.error(`\n❌ Score ${results.score} is below threshold ${threshold}`);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(2);
});
