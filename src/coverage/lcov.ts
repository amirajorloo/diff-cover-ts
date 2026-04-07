import { resolveFilePath } from '../util'
import type { CoverageData } from './types'

/**
 * Parse LCOV format coverage data.
 *
 * Key directives:
 * - SF:<path>        start of file section
 * - DA:<line>,<hits> line data
 * - end_of_record    end of section
 */
export function parseLcov(content: string, gitRoot: string, srcRoots: string[]): CoverageData {
  const data: CoverageData = new Map()
  let currentFile: string | null = null
  let coveredLines: Set<number> | null = null
  let measuredLines: Set<number> | null = null

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()

    if (line.startsWith('SF:')) {
      currentFile = resolveFilePath(line.slice(3), gitRoot, srcRoots)
      coveredLines = new Set()
      measuredLines = new Set()
    } else if (line.startsWith('DA:') && currentFile !== null) {
      const [lineNumStr, hitCountStr] = line.slice(3).split(',')
      const lineNum = parseInt(lineNumStr, 10)
      const hitCount = parseInt(hitCountStr, 10)
      if (!isNaN(lineNum)) {
        measuredLines!.add(lineNum)
        if (hitCount > 0) {
          coveredLines!.add(lineNum)
        }
      }
    } else if (line === 'end_of_record' && currentFile !== null) {
      const existing = data.get(currentFile)
      if (existing) {
        for (const l of measuredLines!) existing.measuredLines.add(l)
        for (const l of coveredLines!) existing.coveredLines.add(l)
      } else {
        data.set(currentFile, {
          coveredLines: coveredLines!,
          measuredLines: measuredLines!,
        })
      }
      currentFile = null
      coveredLines = null
      measuredLines = null
    }
  }

  return data
}
