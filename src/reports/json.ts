import type { ReportData } from '../types.js'

/**
 * Render a ReportData as a JSON string.
 *
 * The JSON uses snake_case keys for compatibility with the original diff_cover
 * Python tool's output schema.
 */
export function generateJsonReport(data: ReportData): string {
  const output = {
    diff_name: data.diffName,
    total_percent_covered: data.percentCovered,
    total_lines: data.totalLines,
    total_covered: data.totalCovered,
    total_uncovered: data.totalUncovered,
    files: data.files.map((file) => ({
      path: file.path,
      percent_covered: file.percentCovered,
      total_lines: file.totalLines,
      covered_lines: file.coveredLines,
      missing_lines: file.uncoveredLines,
    })),
  }

  return JSON.stringify(output, null, 2) + '\n'
}
