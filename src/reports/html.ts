import type { ReportData } from '../types.js'
import { groupConsecutiveLines } from '../util.js'

/** Map a coverage percentage to a traffic-light colour for HTML display */
function coverageColor(pct: number | null): string {
  if (pct === null) return '#999'
  if (pct >= 100) return '#2e7d32'
  if (pct >= 80) return '#f9a825'
  return '#c62828'
}

/** Escape special HTML characters in a string */
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Render a ReportData as a self-contained HTML page.
 *
 * Includes inline CSS with a traffic-light colour scheme:
 * green ≥100%, yellow ≥80%, red <80%.
 */
export function generateHtmlReport(data: ReportData): string {
  const sorted = [...data.files].sort((a, b) => a.path.localeCompare(b.path))
  const totalPct = data.percentCovered !== null ? `${data.percentCovered.toFixed(1)}%` : 'N/A'

  const rows = sorted
    .map((file, i) => {
      const pct = file.percentCovered !== null ? `${file.percentCovered.toFixed(1)}%` : 'N/A'
      const color = coverageColor(file.percentCovered)
      const missing =
        file.uncoveredLines.length > 0 ? groupConsecutiveLines(file.uncoveredLines) : ''
      const bg = i % 2 === 0 ? '#fff' : '#f9f9f9'
      return `      <tr style="background:${bg}">
        <td>${escapeHtml(file.path)}</td>
        <td style="color:${color};font-weight:bold">${pct}</td>
        <td>${file.totalLines}</td>
        <td>${escapeHtml(missing)}</td>
      </tr>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diff Coverage Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 2rem; color: #333; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .summary { padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem; font-size: 1.1rem; font-weight: bold; color: #fff; background: ${coverageColor(data.percentCovered)}; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.6rem 1rem; text-align: left; border: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: 600; }
  </style>
</head>
<body>
  <h1>Diff Coverage Report</h1>
  <div class="summary">Total Coverage: ${totalPct} &mdash; ${data.totalLines} lines, ${data.totalUncovered} missing</div>
  <table>
    <thead>
      <tr><th>File</th><th>Coverage %</th><th>Lines</th><th>Missing</th></tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</body>
</html>
`
}
