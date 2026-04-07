import { readFileSync } from 'node:fs'
import { parseClover } from './clover.js'
import { parseCobertura } from './cobertura.js'
import { parseJacoco } from './jacoco.js'
import { parseLcov } from './lcov.js'
import type { CoverageData } from './types.js'

export type { CoverageData } from './types.js'

/**
 * Auto-detect the coverage format and parse the file.
 *
 * Detection logic:
 * - If content starts with '<' (after trimming), it's XML:
 *   - Root "coverage" with <packages> child -> Cobertura
 *   - Root "coverage" with <project> child -> Clover
 *   - Root "report" -> JaCoCo
 * - Otherwise -> LCOV
 */
export function parseCoverageFile(
  filePath: string,
  gitRoot: string,
  srcRoots: string[],
): CoverageData {
  const content = readFileSync(filePath, 'utf-8')
  const trimmed = content.trimStart()

  if (trimmed.startsWith('<')) {
    // XML-based format — detect by inspecting raw content
    if (/<report[\s>]/i.test(trimmed)) {
      return parseJacoco(content, gitRoot, srcRoots)
    }
    if (/<coverage[\s>]/i.test(trimmed)) {
      if (/<project[\s>]/i.test(trimmed)) {
        return parseClover(content, gitRoot, srcRoots)
      }
      return parseCobertura(content, gitRoot, srcRoots)
    }
    // Fallback for unrecognized XML — try Cobertura
    return parseCobertura(content, gitRoot, srcRoots)
  }

  return parseLcov(content, gitRoot, srcRoots)
}

/**
 * Merge multiple coverage reports.
 *
 * For each file path present in any report:
 * - measuredLines = union across all reports
 * - A line is uncovered only if it is uncovered in ALL reports that mention it
 * - coveredLines = measuredLines minus lines uncovered in every report
 */
export function mergeCoverageData(reports: CoverageData[]): CoverageData {
  if (reports.length === 0) return new Map()
  if (reports.length === 1) return reports[0]

  const merged: CoverageData = new Map()

  // Collect all file paths
  const allFiles = new Set<string>()
  for (const report of reports) {
    for (const key of report.keys()) {
      allFiles.add(key)
    }
  }

  for (const filePath of allFiles) {
    const measuredLines = new Set<number>()
    // Track which lines are uncovered in every report that mentions them
    let uncoveredInAll: Set<number> | null = null

    for (const report of reports) {
      const entry = report.get(filePath)
      if (!entry) continue

      for (const l of entry.measuredLines) measuredLines.add(l)

      const uncoveredInThis = new Set<number>()
      for (const l of entry.measuredLines) {
        if (!entry.coveredLines.has(l)) {
          uncoveredInThis.add(l)
        }
      }

      if (uncoveredInAll === null) {
        uncoveredInAll = uncoveredInThis
      } else {
        // Intersection: keep only lines uncovered in both
        for (const l of uncoveredInAll) {
          if (!uncoveredInThis.has(l)) {
            uncoveredInAll.delete(l)
          }
        }
      }
    }

    const coveredLines = new Set<number>()
    for (const l of measuredLines) {
      if (!uncoveredInAll || !uncoveredInAll.has(l)) {
        coveredLines.add(l)
      }
    }

    merged.set(filePath, { coveredLines, measuredLines })
  }

  return merged
}
