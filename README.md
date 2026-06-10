# codeq — AI-friendly code quality analyzer

A zero-config CLI that scans your codebase and tells you what's actually going on. Outputs both human-readable reports and structured JSON that AI agents and CI pipelines can consume.

## Why this exists

Most code quality tools are either enterprise-grade monsters or produce output that only CI systems understand. `codeq` gives you quick, actionable insights in your terminal — and when you need it, clean JSON for automation.

Built because I wanted something I could point at any project and immediately see: what's complex, what's duplicated, what's being postponed with TODOs, and whether the overall health is okay.

## Install

```bash
npm install -g ai-code-quality-analyzer
```

Or run directly with npx:

```bash
npx ai-code-quality-analyzer .
```

## Usage

```bash
# Analyze current directory
codeq

# Analyze a specific project
codeq ~/projects/my-app

# JSON output for CI / AI tools
codeq --json

# Quiet mode — just the summary
codeq --quiet
```

## What it checks

| Metric | What it tells you |
|--------|------------------|
| **File sizes** | Which files are getting too big to maintain |
| **Cyclomatic complexity** | How complex your functions are getting |
| **TODO/FIXME/HACK tracking** | What you're postponing (and who's responsible) |
| **Code duplication** | Blocks that appear in multiple places |
| **Import analysis** | Dependency graph stats per file |
| **Overall score** | 0-100 health score for the codebase |

## Example output

```
codeq — code quality report
─────────────────────────────
📁 42 code files (67 total)
📝 3,218 lines of code (4,502 total)
⭐ Score: 78/100

Most complex files:
  src/analyzer.js                           complexity: 24 ████████
  src/reporter.js                           complexity: 12 ████

TODOs & FIXMEs (7):
  src/analyzer.js:45 — TODO: handle edge cases
  src/cli.js:12 — FIXME: arg parsing is fragile

Recommendations:
  ⚠️ 2 file(s) exceed 500 lines. Consider splitting.
  💡 3 potential duplicate blocks found.
  ✅ Codebase looks healthy overall.
```

## JSON output

Use `--json` for structured output perfect for CI or AI agents:

```bash
codeq --json | jq '.summary.score'
```

The JSON includes: summary, per-file metrics, duplicate detection, and actionable recommendations with severity levels.

## Score calculation

The 0-100 score starts at 100 and deducts points for:
- Large files (>500 lines): -2 each
- High complexity (>20 per function): -3 each
- TODOs/FIXMEs: -0.5 each (capped at -15)
- Duplicate code blocks: -1.5 each (capped at -20)
- Low code-to-comment ratio: -1 each

Exit code is 1 if score drops below 50 (configurable with `--threshold`). Useful for CI gates.

## CI / GitHub Actions

Use `--threshold` to set a quality gate in CI:

```bash
# Fail if score < 70
npx ai-code-quality-analyzer --json --threshold 70 .
```

### Quick setup

Drop this workflow into `.github/workflows/code-quality.yml`:

```yaml
name: Code Quality
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx ai-code-quality-analyzer --json --threshold 70 .
```

The pipeline fails when the score drops below your threshold. Adjust `--threshold` to whatever bar makes sense for your team.

### With artifact upload

Want to keep the full report? Upload it as an artifact:

```yaml
      - run: npx ai-code-quality-analyzer --json . > quality-report.json
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: quality-report
          path: quality-report.json
```

## Supported languages

JavaScript, TypeScript, Python, Ruby, Go, Rust, Java, Kotlin, C/C++.

## License

MIT
