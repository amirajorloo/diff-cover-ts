# diff-cover-ts

A TypeScript reimplementation of [diff_cover](https://github.com/Bachmann1234/diff_cover) for the Node.js ecosystem.

## Why this project?

The original [diff_cover](https://github.com/Bachmann1234/diff_cover) by [Matt Bachmann](https://github.com/Bachmann1234) is an excellent Python tool that enforces test coverage and code quality on git diffs. However, JavaScript/TypeScript projects that want to use it must install Python as a dependency in their CI pipelines.

**diff-cover-ts** provides the same functionality as a native Node.js package — no Python required. It can be run via `npx`, `bunx`, or `yarn dlx`, making it a drop-in fit for JS/TS toolchains.

## Getting Started

**Run in 30 seconds — no install required:**

```bash
# 1. Generate a coverage report with your test runner
npx jest --coverage --coverageReporters=lcov      # Jest
npx vitest run --coverage                          # Vitest

# 2. Run diff-cover against the report
npx diff-cover-ts coverage/lcov.info

# 3. (Optional) Fail CI if coverage drops below 80%
npx diff-cover-ts coverage/lcov.info --fail-under 80
```

For code quality:

```bash
npx diff-cover-ts diff-quality --violations eslint --fail-under 90
```

> See [GETTING_STARTED.md](./GETTING_STARTED.md) for a full step-by-step tutorial, including CI setup.

## Installation

```bash
# Run directly (no install needed)
npx diff-cover-ts <coverage-file>
bunx diff-cover-ts <coverage-file>

# Or install globally / as a dev dependency
bun add -d diff-cover-ts
npm install -D diff-cover-ts
```

## Commands

### `diff-cover` — Coverage on changed lines

Finds lines changed in a git diff that lack test coverage.

```bash
# Basic usage
diff-cover coverage/lcov.info

# Fail if less than 80% of changed lines are covered
diff-cover coverage/lcov.info --fail-under 80

# Multiple output formats at once
diff-cover coverage/cobertura.xml --format html:report.html --format json:coverage.json --format markdown:coverage.md

# Compare against a specific branch instead of origin/main
diff-cover coverage/lcov.info --compare-branch origin/develop

# Monorepo: restrict to one package's source files
diff-cover coverage/lcov.info --src-roots packages/core/src

# Only check certain files (glob patterns)
diff-cover coverage/lcov.info --include "src/**/*.ts" --exclude "src/**/*.test.ts"

# Use two-dot diff notation (uncommitted changes only)
diff-cover coverage/lcov.info --diff-range-notation ..

# Load settings from a TOML config file
diff-cover coverage/lcov.info --config-file pyproject.toml
```

### `diff-quality` — Quality violations on changed lines

Finds code quality violations on lines changed in a git diff.

```bash
# Run ESLint on changed files and fail below 90% clean
diff-quality --violations eslint --fail-under 90

# Run Stylelint on changed CSS/SCSS files
diff-quality --violations stylelint

# Use a pre-generated lint report (any tool that outputs file:line:message)
diff-quality --violations generic --input lint-output.txt

# Compare against a specific branch and output Markdown
diff-quality --violations eslint --compare-branch origin/develop --format markdown:quality.md

# Suppress console output (useful in CI when you only want the file)
diff-quality --violations eslint --format json:quality.json --quiet
```

## Supported Formats

### Coverage reports

| Format    | File type         |
| --------- | ----------------- |
| LCOV      | `.info` / `.lcov` |
| Cobertura | XML               |
| Clover    | XML               |
| JaCoCo    | XML               |

### Quality tools

| Tool      | How it runs                                    |
| --------- | ---------------------------------------------- |
| ESLint    | `npx eslint --format=compact`                  |
| Stylelint | `npx stylelint --formatter=compact`            |
| Generic   | Reads `file:line:message` from `--input` files |

### Output formats

Console (default), HTML, JSON, Markdown — can output multiple formats at once.

## CLI Options

| Option                      | Description                                                          | Default       |
| --------------------------- | -------------------------------------------------------------------- | ------------- |
| `--compare-branch <branch>` | Branch to compare against                                            | `origin/main` |
| `--fail-under <number>`     | Exit code 1 if coverage/quality % is below threshold                 | `0`           |
| `--include <glob...>`       | Only include matching files                                          |               |
| `--exclude <glob...>`       | Exclude matching files                                               |               |
| `--format <type[:path]>`    | Output format (`console`, `html:path`, `json:path`, `markdown:path`) | `console`     |
| `--diff-range-notation <n>` | Git diff range notation (`...` or `..`)                              | `...`         |
| `--src-roots <paths>`       | Comma-separated source roots (for monorepos)                         |               |
| `--config-file <path>`      | TOML configuration file                                              |               |
| `--quiet`                   | Suppress non-error output                                            | `false`       |

## Configuration File

Options can be set in a TOML file:

```toml
[tool.diff_cover]
compare_branch = "origin/develop"
fail_under = 80

[tool.diff_quality]
violations = "eslint"
fail_under = 90
```

```bash
diff-cover coverage.xml --config-file pyproject.toml
```

## Programmatic API

```typescript
import { runDiffCover, runDiffQuality } from 'diff-cover-ts'

const { report, exitCode } = await runDiffCover({
  coverageFiles: ['coverage/lcov.info'],
  compareBranch: 'origin/main',
  failUnder: 80,
  include: [],
  exclude: [],
  formats: [],
  diffRangeNotation: '...',
  quiet: false,
  srcRoots: [],
})

console.log(`Coverage: ${report.percentCovered}%`)
```

```typescript
import { runDiffQuality } from 'diff-cover-ts'

const { report, exitCode } = await runDiffQuality({
  violations: 'eslint',
  inputFiles: [], // empty = run eslint directly
  compareBranch: 'origin/main',
  failUnder: 90,
  include: ['src/**/*.ts'],
  exclude: [],
  formats: [{ type: 'json', path: 'quality.json' }],
  diffRangeNotation: '...',
  quiet: false,
  srcRoots: [],
})

for (const file of report.files) {
  if (file.violations.length > 0) {
    console.log(`${file.path}: ${file.violations.length} violation(s)`)
  }
}
process.exit(exitCode)
```

## Troubleshooting

**`diff-cover` reports 0 changed lines**

- Make sure you have uncommitted changes or commits that differ from `--compare-branch`.
- Try `git diff origin/main...HEAD` to verify the diff manually.
- Check that the coverage file paths match the git-relative paths in the diff.

**Coverage file not found / not parsed**

- LCOV files must end in `.info` or `.lcov`, or be passed by explicit path.
- XML files are auto-detected (Cobertura, Clover, JaCoCo). Verify with `head -5 <file>`.
- For monorepos, use `--src-roots` to strip path prefixes in coverage reports.

**ESLint / Stylelint not found**

- The quality drivers run `npx eslint` / `npx stylelint` and require those packages in your project.
- Alternatively, pre-generate a report and pass it via `--input`.

**`--fail-under` is always 0**

- If no changed lines are measurable (no coverage data matched), the percent is `null` and the threshold is not applied — this is intentional.

## Credits

This project is inspired by and based on the design of [diff_cover](https://github.com/Bachmann1234/diff_cover) by [Matt Bachmann](https://github.com/Bachmann1234). All credit for the original concept goes to that project.

## License

MIT
