import { XMLParser } from 'fast-xml-parser'
import { resolveFilePath, toUnixPath } from '../util'
import type { CoverageData } from './types'

function asArray<T>(val: T | T[] | undefined): T[] {
  if (val === undefined || val === null) return []
  return Array.isArray(val) ? val : [val]
}

/**
 * Parse Cobertura XML coverage data.
 *
 * XML structure:
 * <coverage> -> <packages> -> <package> -> <classes> -> <class filename="...">
 *   -> <lines> -> <line number="N" hits="H"/>
 *
 * Optional <sources> -> <source> provides path prefixes.
 */
export function parseCobertura(content: string, gitRoot: string, srcRoots: string[]): CoverageData {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  })
  const xml = parser.parse(content)
  const data: CoverageData = new Map()

  const coverage = xml.coverage
  if (!coverage) return data

  // Collect source paths from <sources>
  const sourcePaths: string[] = []
  if (coverage.sources) {
    for (const src of asArray(coverage.sources.source)) {
      if (typeof src === 'string' && src.trim()) {
        sourcePaths.push(toUnixPath(src.trim()).replace(/\/$/, ''))
      }
    }
  }

  for (const pkg of asArray(coverage.packages?.package)) {
    for (const cls of asArray(pkg?.classes?.class)) {
      const filename = cls?.['@_filename']
      if (!filename) continue

      // Try prepending source paths to resolve the file
      let resolvedPath: string | null = null
      if (sourcePaths.length > 0) {
        for (const srcPath of sourcePaths) {
          const candidate = srcPath + '/' + toUnixPath(filename)
          resolvedPath = resolveFilePath(candidate, gitRoot, srcRoots)
          break
        }
      }
      if (!resolvedPath) {
        resolvedPath = resolveFilePath(filename, gitRoot, srcRoots)
      }

      const coveredLines = new Set<number>()
      const measuredLines = new Set<number>()

      for (const line of asArray(cls?.lines?.line)) {
        const num = parseInt(line?.['@_number'], 10)
        const hits = parseInt(line?.['@_hits'], 10)
        if (isNaN(num)) continue
        measuredLines.add(num)
        if (hits > 0) coveredLines.add(num)
      }

      const existing = data.get(resolvedPath)
      if (existing) {
        for (const l of measuredLines) existing.measuredLines.add(l)
        for (const l of coveredLines) existing.coveredLines.add(l)
      } else {
        data.set(resolvedPath, { coveredLines, measuredLines })
      }
    }
  }

  return data
}
