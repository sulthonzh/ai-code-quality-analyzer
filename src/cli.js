#!/usr/bin/env node
import { analyze } from './analyzer.js';
import { formatHuman, formatJson } from './reporter.js';
import { resolve } from 'path';

const args = process.argv.slice(2);
const dir = resolve(args[0] || '.');
const jsonOutput = args.includes('--json');
const quiet = args.includes('--quiet');

async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`codeq — AI-friendly code quality analyzer

Usage:
  codeq [path]        Analyze a directory (default: .)
  codeq --json        Output structured JSON
  codeq --quiet       Only show summary
  codeq --help        Show this help

Metrics:
  • File sizes & line counts
  • Function complexity estimation
  • TODO/FIXME/HACK tracking
  • Duplicate code detection
  • Import dependency graph stats
`);
    return;
  }

  const results = await analyze(dir);
  
  if (jsonOutput) {
    console.log(formatJson(results));
  } else {
    console.log(formatHuman(results, { quiet }));
  }

  // Exit with error code if score is too low
  if (results.score < 50) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(2);
});
