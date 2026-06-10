#!/usr/bin/env node
import { analyze } from './analyzer.js';
import { formatHuman, formatJson } from './reporter.js';
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

async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`codeq — AI-friendly code quality analyzer

Usage:
  codeq [path]              Analyze a directory (default: .)
  codeq --json              Output structured JSON
  codeq --quiet             Only show summary
  codeq --threshold <n>     Fail if score is below <n> (default: 50)
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
`);
    return;
  }

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
