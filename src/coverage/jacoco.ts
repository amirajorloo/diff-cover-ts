import { XMLParser } from 'fast-xml-parser'
import { resolveFilePath } from '../util.js'
import type { CoverageData } from './types.js'

function asArray<T>(val: T | T[] | undefined): T[] {
  if (val === undefined || val === null) return []
  return Array.isArray(val) ? val : [val]
}

/**
 * Parse JaCoCo XML coverage data.
 *
 * XML structure:
 * <report> -> <package name="com/foo"> -> <sourcefile name="Foo.java">
 *   -> <line nr="N" mi="M" ci="C"/>
 *
 * ci > 0 means covered. mi + ci > 0 means measured.
 * Full path: packageName.replace(/\./g, "/") + "/" + sourcefileName
 */
export function parseJacoco(content: string, gitRoot: string, srcRoots: string[]): CoverageData {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  })
  const xml = parser.parse(content)
  const data: CoverageData = new Map()

  const report = xml.report
  if (!report) return data

  for (const pkg of asArray(report.package)) {
    const pkgName = (pkg?.['@_name'] || '').replace(/\./g, '/')

    for (const srcFile of asArray(pkg?.sourcefile)) {
      const fileName = srcFile?.['@_name']
      if (!fileName) continue

      const fullPath = pkgName ? pkgName + '/' + fileName : fileName
      const resolvedPath = resolveFilePath(fullPath, gitRoot, srcRoots)
      const coveredLines = new Set<number>()
      const measuredLines = new Set<number>()

      for (const line of asArray(srcFile?.line)) {
        const nr = parseInt(line?.['@_nr'], 10)
        const mi = parseInt(line?.['@_mi'], 10) || 0
        const ci = parseInt(line?.['@_ci'], 10) || 0
        if (isNaN(nr)) continue

        if (mi + ci > 0) {
          measuredLines.add(nr)
          if (ci > 0) coveredLines.add(nr)
        }
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
