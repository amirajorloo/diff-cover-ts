import type { Violation } from '../types'
import { executeCommand, toUnixPath } from '../util'
import type { QualityDriver } from './types'

/** Compact Stylelint output line: "path/to/file.css: line N, col N, message" */
const LINE_RE = /^(.+): line (\d+), col \d+, (.+)$/

/**
 * Stylelint quality driver.
 *
 * Runs `npx stylelint --formatter=compact` and parses its output.
 * Exit codes 0 (no violations) and 2 (violations found) are both accepted.
 */
export const stylelintDriver: QualityDriver = {
  name: 'stylelint',

  async run(files: string[]): Promise<string> {
    const { stdout } = await executeCommand(
      'npx',
      ['stylelint', '--formatter=compact', ...files],
      [0, 2],
    )
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
