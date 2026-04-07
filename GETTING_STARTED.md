# Getting Started with diff-cover-ts

This guide walks you through using `diff-cover-ts` for the first time, from generating a coverage report to enforcing coverage thresholds in CI.

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Running diff-cover with an LCOV report](#2-running-diff-cover-with-an-lcov-report)
3. [Running diff-cover with a Cobertura report](#3-running-diff-cover-with-a-cobertura-report)
4. [Running diff-quality with ESLint](#4-running-diff-quality-with-eslint)
5. [Setting up a TOML configuration file](#5-setting-up-a-toml-configuration-file)
6. [Using diff-cover-ts in GitHub Actions](#6-using-diff-cover-ts-in-github-actions)
7. [Understanding the output](#7-understanding-the-output)

---

## 1. Prerequisites

- **Node.js 20+** (check with `node --version`)
- A **git repository** with at least one branch to compare against (usually `origin/main`)
- A **test runner** that can emit coverage reports (Jest, Vitest, NYC/Istanbul, etc.)

No global install is needed — all examples below use `npx` to run on demand.

---

## 2. Running diff-cover with an LCOV report

### Step 1 — Generate an LCOV coverage report

**Jest:**

```bash
npx jest --coverage --coverageReporters=lcov
# Output: coverage/lcov.info
```

**Vitest:**

```bash
npx vitest run --coverage --coverage.reporter=lcov
# Output: coverage/lcov.info
```

**NYC (Istanbul):**

```bash
npx nyc --reporter=lcov npx mocha
# Output: coverage/lcov.info
```

### Step 2 — Run diff-cover

```bash
npx diff-cover-ts coverage/lcov.info
```

Sample output:

```
Diff: origin/main...HEAD, src Coverage

  src/auth/login.ts (75.0%): Missing lines 42-43, 51
  src/utils/format.ts (100%)
  src/api/users.ts (N/A)

Total:   12 lines   3 missing   75.0% covered
```

Lines colored **green** are fully covered; **red** have missing coverage; `N/A` means the file had no measurable lines in the coverage report (e.g., config or type-only files).

### Step 3 — Enforce a minimum threshold

```bash
npx diff-cover-ts coverage/lcov.info --fail-under 80
# Exit code 0 if ≥80% covered, exit code 1 if below threshold
```

---

## 3. Running diff-cover with a Cobertura report

Cobertura XML is commonly produced by Java (Maven/Gradle), Python (pytest-cov), and some JS tools.

```bash
# Generate (example: pytest)
pytest --cov=mypackage --cov-report=xml

# Run diff-cover
npx diff-cover-ts coverage.xml --fail-under 75
```

The format is auto-detected — just pass the file path. Clover XML and JaCoCo XML work the same way.

**Multiple coverage files** (e.g., unit + integration tests):

```bash
npx diff-cover-ts coverage/unit.lcov coverage/integration.xml --fail-under 80
```

When multiple files are provided, they are merged: a line is considered covered if it is covered in _any_ of the reports.

---

## 4. Running diff-quality with ESLint

### Step 1 — Make sure ESLint is installed

```bash
npm install -D eslint
# or
bun add -d eslint
```

### Step 2 — Run diff-quality

```bash
npx diff-cover-ts diff-quality --violations eslint
```

`diff-quality` will automatically run `npx eslint --format=compact` on only the files that appear in the git diff, then filter violations to changed lines only.

### Step 3 — Enforce a quality threshold

```bash
npx diff-cover-ts diff-quality --violations eslint --fail-under 90
# Exit code 1 if more than 10% of changed lines have violations
```

### Using a pre-generated ESLint report

If your CI pipeline already runs ESLint and saves the output, you can pass it directly instead of re-running the tool:

```bash
# Generate the report separately
npx eslint --format=compact src/ > eslint-output.txt

# Pass it to diff-quality
npx diff-cover-ts diff-quality --violations eslint --input eslint-output.txt
```

### Stylelint

```bash
npx diff-cover-ts diff-quality --violations stylelint --fail-under 85
```

### Generic (any linter)

Any tool that emits output in `file:line:message` format can be used with the `generic` driver:

```bash
my-custom-linter src/ > lint-output.txt
npx diff-cover-ts diff-quality --violations generic --input lint-output.txt
```

---

## 5. Setting up a TOML configuration file

Instead of repeating CLI flags in every command, you can store options in a TOML file. This works with existing `pyproject.toml` files (making it easy to share config between `diff_cover` and `diff-cover-ts`).

Create or edit `pyproject.toml` (or any `.toml` file):

```toml
[tool.diff_cover]
compare_branch = "origin/develop"
fail_under = 80
include = ["src/**/*.ts"]
exclude = ["src/**/*.test.ts", "src/**/*.spec.ts"]
src_roots = "src"

[tool.diff_quality]
violations = "eslint"
fail_under = 90
compare_branch = "origin/develop"
```

Run with the config file:

```bash
npx diff-cover-ts coverage/lcov.info --config-file pyproject.toml
npx diff-cover-ts diff-quality --config-file pyproject.toml
```

> CLI flags override config file settings — you can always pass `--fail-under 100` on the command line to temporarily tighten the threshold.

---

## 6. Using diff-cover-ts in GitHub Actions

Here is a complete GitHub Actions workflow that:

- Runs tests and generates an LCOV coverage report
- Runs `diff-cover` and fails the PR if coverage drops below 80%
- Runs `diff-quality` with ESLint and fails if quality drops below 90%
- Posts a Markdown summary to the GitHub Actions job summary

```yaml
# .github/workflows/diff-cover.yml
name: Diff Coverage & Quality

on:
  pull_request:
    branches: [main, develop]

jobs:
  diff-cover:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          # Fetch full history so the diff range works correctly
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npx vitest run --coverage --coverage.reporter=lcov

      - name: Check diff coverage
        run: |
          npx diff-cover-ts coverage/lcov.info \
            --compare-branch origin/${{ github.base_ref }} \
            --fail-under 80 \
            --format markdown:coverage-report.md
        # Continues even on failure so we can upload the report
        continue-on-error: true

      - name: Check diff quality (ESLint)
        run: |
          npx diff-cover-ts diff-quality \
            --violations eslint \
            --compare-branch origin/${{ github.base_ref }} \
            --fail-under 90 \
            --format markdown:quality-report.md
        continue-on-error: true

      - name: Post reports to job summary
        run: |
          echo "## Coverage Report" >> $GITHUB_STEP_SUMMARY
          cat coverage-report.md >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "## Quality Report" >> $GITHUB_STEP_SUMMARY
          cat quality-report.md >> $GITHUB_STEP_SUMMARY

      - name: Fail if thresholds not met
        run: |
          npx diff-cover-ts coverage/lcov.info \
            --compare-branch origin/${{ github.base_ref }} \
            --fail-under 80 --quiet
          npx diff-cover-ts diff-quality \
            --violations eslint \
            --compare-branch origin/${{ github.base_ref }} \
            --fail-under 90 --quiet
```

### Key CI tips

- Always use `fetch-depth: 0` so `git diff` has full history to compare against.
- Use `origin/${{ github.base_ref }}` instead of `origin/main` to handle PRs targeting different branches.
- Run `--quiet` for the final enforcement step to avoid duplicate console output.
- Save HTML or JSON reports as artifacts if you want downloadable reports:

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: coverage-reports
    path: |
      coverage-report.md
      quality-report.md
```

---

## 7. Understanding the output

### Console output

```
Diff: origin/main...HEAD, src Coverage

  src/auth/login.ts (75.0%): Missing lines 42-43, 51
  src/utils/format.ts (100%)
  src/api/users.ts (N/A)

Total:   12 lines   3 missing   75.0% covered
```

| Column          | Meaning                                                   |
| --------------- | --------------------------------------------------------- |
| File path       | Git-relative path of the changed file                     |
| `(75.0%)`       | Percentage of _changed_ measurable lines that are covered |
| `Missing lines` | Specific line numbers (or ranges) lacking coverage        |
| `N/A`           | No measurable lines in coverage data for this file        |
| Total           | Aggregate across all changed files                        |

### HTML report (`--format html:report.html`)

A self-contained HTML file with a color-coded table. Green ≥100%, yellow ≥80%, red <80%.

### JSON report (`--format json:report.json`)

```json
{
  "diff_name": "origin/main...HEAD",
  "total_percent_covered": 75.0,
  "total_lines": 12,
  "total_covered": 9,
  "total_uncovered": 3,
  "files": [
    {
      "path": "src/auth/login.ts",
      "percent_covered": 75.0,
      "total_lines": 8,
      "covered_lines": 6,
      "missing_lines": [42, 43, 51]
    }
  ]
}
```

### Markdown report (`--format markdown:coverage.md`)

A GitHub-flavored Markdown table — ideal for pasting into PR comments or job summaries.

### Exit codes

| Code | Meaning                                                                     |
| ---- | --------------------------------------------------------------------------- |
| `0`  | Success — threshold met (or no threshold set)                               |
| `1`  | Threshold not met (`--fail-under` was set and coverage/quality is below it) |
| `2`  | Error — bad arguments, file not found, git failure, etc.                    |
