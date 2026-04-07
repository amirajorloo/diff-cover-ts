import chalk from 'chalk'
import type { ReportData } from '../types'
import { groupConsecutiveLines } from '../util'

/**
 * Render a ReportData as a coloured console string.
 *
 * Each file is printed on one line with its coverage percentage and,
 * when applicable, a compact list of missing line ranges (e.g. "42-43, 51").
 * Fully-covered files are green; anything else is red.
 * The summary line is yellow when coverage is below 100%.
 */
export function generateConsoleReport(data: ReportData): string {
  const lines: string[] = []
  lines.push(`Diff: ${data.diffName}, src Coverage`)
  lines.push('')

  const sorted = [...data.files].sort((a, b) => a.path.localeCompare(b.path))

  for (const file of sorted) {
    const pct = file.percentCovered !== null ? `${file.percentCovered.toFixed(1)}%` : 'N/A'
    const missing =
      file.uncoveredLines.length > 0
        ? `: Missing lines ${groupConsecutiveLines(file.uncoveredLines)}`
        : ''
    const label = `  ${file.path} (${pct})${missing}`

    if (file.percentCovered === 100) {
      lines.push(chalk.green(label))
    } else {
      lines.push(chalk.red(label))
    }
  }

  lines.push('')

  const totalLine = `Total:   ${data.totalLines} lines   ${data.totalUncovered} missing   ${data.percentCovered !== null ? `${data.percentCovered.toFixed(1)}%` : 'N/A'} covered`

  if (data.percentCovered !== null && data.percentCovered < 100) {
    lines.push(chalk.yellow(totalLine))
  } else {
    lines.push(totalLine)
  }

  return lines.join('\n') + '\n'
}
