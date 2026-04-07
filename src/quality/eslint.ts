import type { Violation } from '../types.js'
import { executeCommand, toUnixPath } from '../util.js'
import type { QualityDriver } from './types.js'

/** Compact ESLint output line: "path/to/file.ts: line N, col N, message" */
const LINE_RE = /^(.+): line (\d+), col \d+, (.+)$/

/**
 * ESLint quality driver.
 *
 * Runs `npx eslint --format=compact` and parses its output.
 * Exit codes 0 (no violations) and 1 (violations found) are both accepted.
 */
export const eslintDriver: QualityDriver = {
  name: 'eslint',

  async run(files: string[]): Promise<string> {
    const { stdout } = await executeCommand('npx', ['eslint', '--format=compact', ...files], [0, 1])
    return stdout
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
