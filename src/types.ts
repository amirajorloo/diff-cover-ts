/** A single violation (uncovered line or quality issue) */
export interface Violation {
  /** 1-based line number of the violation */
  line: number
  /** Human-readable description, or null for coverage violations */
  message: string | null
}

/** Per-file diff information: which lines were added/deleted */
export interface FileDiff {
  /** File path relative to the git root, using forward slashes */
  path: string
  /** Sorted line numbers present in the new version of the file */
  addedLines: number[]
  /** Sorted line numbers removed from the old version of the file */
  deletedLines: number[]
}

/** Per-file coverage/quality result after intersecting with diff */
export interface FileReport {
  path: string
  /** Number of changed lines that appear in the coverage/quality data */
  totalLines: number
  /** Number of totalLines that are covered (no violations) */
  coveredLines: number
  /** Changed line numbers that lack coverage or have violations */
  uncoveredLines: number[]
  /** Detailed violation objects (populated by diff-quality, empty for diff-cover) */
  violations: Violation[]
  /** Percentage covered, or null when totalLines === 0 (unmeasured file) */
  percentCovered: number | null
}

/** Aggregated report data */
export interface ReportData {
  /** Human-readable git diff range, e.g. "origin/main...HEAD" */
  diffName: string
  files: FileReport[]
  totalLines: number
  totalCovered: number
  totalUncovered: number
  /** Overall percentage, or null when no measurable lines exist */
  percentCovered: number | null
}

/** Output format specification */
export interface OutputFormat {
  type: 'console' | 'html' | 'json' | 'markdown'
  /** File path to write to; omit for stdout */
  path?: string
}

/** Parsed CLI options shared by both commands */
export interface SharedOptions {
  /** Branch to diff against, e.g. "origin/main" */
  compareBranch: string
  /** Exit with code 1 if percentCovered is below this value */
  failUnder: number
  /** Glob patterns — only include matching files */
  include: string[]
  /** Glob patterns — exclude matching files */
  exclude: string[]
  formats: OutputFormat[]
  /** `...` (three-dot, merge-base diff) or `..` (two-dot, direct diff) */
  diffRangeNotation: '...' | '..'
  /** Suppress non-error console output */
  quiet: boolean
  /** Comma-separated source roots used to strip path prefixes in coverage files */
  srcRoots: string[]
}

export interface DiffCoverOptions extends SharedOptions {
  /** Paths to coverage report files (LCOV, Cobertura, Clover, JaCoCo) */
  coverageFiles: string[]
}

export interface DiffQualityOptions extends SharedOptions {
  /** Quality driver name: "eslint" | "stylelint" | "generic" */
  violations: string
  /** Pre-generated report files to parse instead of running the tool */
  inputFiles: string[]
}
