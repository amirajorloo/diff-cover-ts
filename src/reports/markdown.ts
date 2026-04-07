import type { ReportData } from '../types'
import { groupConsecutiveLines } from '../util'

/**
 * Render a ReportData as a GitHub-flavored Markdown table.
 *
 * Suitable for pasting into PR comments or GitHub Actions job summaries.
 */
export function generateMarkdownReport(data: ReportData): string {
  const lines: string[] = []
  lines.push(`## Diff Coverage: ${data.diffName}`)
  lines.push('')
  lines.push('| File | Coverage | Lines | Missing |')
  lines.push('|------|----------|-------|---------|')

  const sorted = [...data.files].sort((a, b) => a.path.localeCompare(b.path))

  for (const file of sorted) {
    const pct = file.percentCovered !== null ? `${file.percentCovered.toFixed(1)}%` : 'N/A'
    const missing = file.uncoveredLines.length > 0 ? groupConsecutiveLines(file.uncoveredLines) : ''
    lines.push(`| ${file.path} | ${pct} | ${file.totalLines} | ${missing} |`)
  }

  lines.push('')
  const totalPct = data.percentCovered !== null ? `${data.percentCovered.toFixed(1)}%` : 'N/A'
  lines.push(
    `**Total: ${data.totalLines} lines, ${data.totalUncovered} missing, ${totalPct} covered**`,
  )
  lines.push('')

  return lines.join('\n')
}
