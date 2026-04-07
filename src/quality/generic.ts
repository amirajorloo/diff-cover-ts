import type { Violation } from '../types.js'
import { toUnixPath } from '../util.js'
import type { QualityDriver } from './types.js'

/** Generic output line: "file:line[:col] message" */
const LINE_RE = /^(.+?):(\d+)(?::\d+)?[:\s]+(.+)$/

/**
 * Generic quality driver.
 *
 * Parses any tool output that follows the `file:line:message` convention.
 * Cannot run tools directly — always requires `--input` pre-generated files.
 */
export const genericDriver: QualityDriver = {
  name: 'generic',

  async run(_files: string[]): Promise<string> {
    throw new Error('Generic driver requires --input files, cannot run tools directly')
  },

  parseReport(content: string): Map<string, Violation[]> {
    const result = new Map<string, Violation[]>()
    for (const line of content.split('\n')) {
      const match = LINE_RE.exec(line)
      if (!match) continue
      const file = toUnixPath(match[1])
      const violation: Violation = {
        line: Number(match[2]),
        message: match[3],
      }
      const existing = result.get(file)
      if (existing) {
        existing.push(violation)
      } else {
        result.set(file, [violation])
      }
    }
    return result
  },
}
