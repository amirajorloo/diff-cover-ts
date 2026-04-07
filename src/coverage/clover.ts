import { XMLParser } from 'fast-xml-parser'
import { resolveFilePath } from '../util.js'
import type { CoverageData } from './types.js'

function asArray<T>(val: T | T[] | undefined): T[] {
  if (val === undefined || val === null) return []
  return Array.isArray(val) ? val : [val]
}

/**
 * Parse Clover XML coverage data.
 *
 * XML structure:
 * <coverage> -> <project> -> <package> -> <file path="..." name="...">
 *   -> <line num="N" count="C" type="stmt|cond|method"/>
 *
 * Only lines with type "stmt" or "cond" are processed.
 */
export function parseClover(content: string, gitRoot: string, srcRoots: string[]): CoverageData {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  })
  const xml = parser.parse(content)
  const data: CoverageData = new Map()

  const project = xml.coverage?.project
  if (!project) return data

  for (const pkg of asArray(project.package)) {
    for (const file of asArray(pkg?.file)) {
      const filePath = file?.['@_path'] || file?.['@_name']
      if (!filePath) continue

      const resolvedPath = resolveFilePath(filePath, gitRoot, srcRoots)
      const coveredLines = new Set<number>()
      const measuredLines = new Set<number>()

      for (const line of asArray(file?.line)) {
        const type = line?.['@_type']
        if (type !== 'stmt' && type !== 'cond') continue

        const num = parseInt(line?.['@_num'], 10)
        const count = parseInt(line?.['@_count'], 10)
        if (isNaN(num)) continue

        measuredLines.add(num)
        if (count > 0) coveredLines.add(num)
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
