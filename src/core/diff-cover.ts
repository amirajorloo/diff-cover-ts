import { getChangedFiles } from '../git/diff-parser.js'
import { parseCoverageFile, mergeCoverageData } from '../coverage/index.js'
import { resolveGitRoot } from '../util.js'
import type { DiffCoverOptions, FileReport, ReportData } from '../types.js'

/**
 * Orchestrate a diff-cover run:
 * 1. Get changed files from git diff
 * 2. Parse and merge all coverage report files
 * 3. Intersect changed lines with coverage data
 * 4. Return a ReportData aggregate and an exit code
 *
 * @returns `report` — full result data, `exitCode` — 0 if threshold met, 1 if not
 */
export async function runDiffCover(options: DiffCoverOptions): Promise<{
  report: ReportData
  exitCode: number
}> {
  const gitRoot = await resolveGitRoot()

  const fileDiffs = await getChangedFiles({
    compareBranch: options.compareBranch,
    diffRangeNotation: options.diffRangeNotation,
    include: options.include,
    exclude: options.exclude,
    srcRoots: options.srcRoots,
  })

  // Parse all coverage files and merge
  const coverageReports = options.coverageFiles.map((f) =>
    parseCoverageFile(f, gitRoot, options.srcRoots),
  )
  const coverage = mergeCoverageData(coverageReports)

  const diffName = `${options.compareBranch}${options.diffRangeNotation}HEAD`
  const files: FileReport[] = []
  let totalLines = 0
  let totalCovered = 0

  for (const diff of fileDiffs) {
    const fileCoverage = coverage.get(diff.path)

    if (!fileCoverage) {
      // No coverage data for this file — report as not measurable
      files.push({
        path: diff.path,
        totalLines: 0,
        coveredLines: 0,
        uncoveredLines: [],
        violations: [],
        percentCovered: null,
      })
      continue
    }

    // Intersect changed lines with measured lines
    const measuredChanged = diff.addedLines.filter((line) => fileCoverage.measuredLines.has(line))
    const coveredChanged = measuredChanged.filter((line) => fileCoverage.coveredLines.has(line))
    const uncoveredChanged = measuredChanged.filter((line) => !fileCoverage.coveredLines.has(line))

    const measuredCount = measuredChanged.length
    const coveredCount = coveredChanged.length
    const percent = measuredCount > 0 ? (coveredCount / measuredCount) * 100 : null

    totalLines += measuredCount
    totalCovered += coveredCount

    files.push({
      path: diff.path,
      totalLines: measuredCount,
      coveredLines: coveredCount,
      uncoveredLines: uncoveredChanged,
      violations: [],
      percentCovered: percent,
    })
  }

  // Sort files alphabetically
  files.sort((a, b) => a.path.localeCompare(b.path))

  const totalPercent = totalLines > 0 ? (totalCovered / totalLines) * 100 : null

  const report: ReportData = {
    diffName,
    files,
    totalLines,
    totalCovered,
    totalUncovered: totalLines - totalCovered,
    percentCovered: totalPercent,
  }

  const exitCode = totalPercent !== null && totalPercent < options.failUnder ? 1 : 0

  return { report, exitCode }
}
