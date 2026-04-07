import { readFileSync } from 'node:fs'
import { getChangedFiles } from '../git/diff-parser.js'
import { getQualityDriver } from '../quality/index.js'
import type { DiffQualityOptions, FileReport, ReportData, Violation } from '../types.js'

/**
 * Orchestrate a diff-quality run:
 * 1. Get changed files from git diff
 * 2. Either run the quality tool on changed files OR parse pre-generated reports
 * 3. Filter violations to only those on changed lines
 * 4. Return a ReportData aggregate and an exit code
 *
 * @returns `report` — full result data, `exitCode` — 0 if threshold met, 1 if not
 */
export async function runDiffQuality(options: DiffQualityOptions): Promise<{
  report: ReportData
  exitCode: number
}> {
  const fileDiffs = await getChangedFiles({
    compareBranch: options.compareBranch,
    diffRangeNotation: options.diffRangeNotation,
    include: options.include,
    exclude: options.exclude,
    srcRoots: options.srcRoots,
  })

  const driver = getQualityDriver(options.violations)

  // Get violations either from input files or by running the tool
  let allViolations: Map<string, Violation[]>

  if (options.inputFiles.length > 0) {
    // Parse pre-generated reports
    const merged = new Map<string, Violation[]>()
    for (const inputFile of options.inputFiles) {
      const content = readFileSync(inputFile, 'utf-8')
      const parsed = driver.parseReport(content)
      for (const [file, violations] of parsed) {
        const existing = merged.get(file) || []
        existing.push(...violations)
        merged.set(file, existing)
      }
    }
    allViolations = merged
  } else {
    // Run the tool on changed files
    const changedPaths = fileDiffs.map((d) => d.path)
    if (changedPaths.length === 0) {
      allViolations = new Map()
    } else {
      const output = await driver.run(changedPaths)
      allViolations = driver.parseReport(output)
    }
  }

  const diffName = `${options.compareBranch}${options.diffRangeNotation}HEAD`
  const files: FileReport[] = []
  let totalLines = 0
  let totalViolationLines = 0

  for (const diff of fileDiffs) {
    const fileViolations = allViolations.get(diff.path) || []

    // Filter violations to only those on changed lines
    const addedSet = new Set(diff.addedLines)
    const relevantViolations = fileViolations.filter((v) => addedSet.has(v.line))

    const lineCount = diff.addedLines.length
    const violationLineCount = new Set(relevantViolations.map((v) => v.line)).size
    const coveredCount = lineCount - violationLineCount
    const percent = lineCount > 0 ? (coveredCount / lineCount) * 100 : null

    totalLines += lineCount
    totalViolationLines += violationLineCount

    files.push({
      path: diff.path,
      totalLines: lineCount,
      coveredLines: coveredCount,
      uncoveredLines: [...new Set(relevantViolations.map((v) => v.line))].sort((a, b) => a - b),
      violations: relevantViolations,
      percentCovered: percent,
    })
  }

  files.sort((a, b) => a.path.localeCompare(b.path))

  const totalCovered = totalLines - totalViolationLines
  const totalPercent = totalLines > 0 ? (totalCovered / totalLines) * 100 : null

  const report: ReportData = {
    diffName,
    files,
    totalLines,
    totalCovered,
    totalUncovered: totalViolationLines,
    percentCovered: totalPercent,
  }

  const exitCode = totalPercent !== null && totalPercent < options.failUnder ? 1 : 0

  return { report, exitCode }
}
