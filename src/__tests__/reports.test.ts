import { describe, it, expect } from 'vitest'
import { generateJsonReport } from '../reports/json.js'
import { generateMarkdownReport } from '../reports/markdown.js'
import type { ReportData } from '../types.js'

const sampleReport: ReportData = {
  diffName: 'origin/main...HEAD',
  files: [
    {
      path: 'src/bar.ts',
      totalLines: 3,
      coveredLines: 3,
      uncoveredLines: [],
      violations: [],
      percentCovered: 100,
    },
    {
      path: 'src/foo.ts',
      totalLines: 6,
      coveredLines: 3,
      uncoveredLines: [3, 5, 6],
      violations: [],
      percentCovered: 50,
    },
  ],
  totalLines: 9,
  totalCovered: 6,
  totalUncovered: 3,
  percentCovered: 66.7,
}

describe('JSON reporter', () => {
  it('generates valid JSON with correct structure', () => {
    const output = generateJsonReport(sampleReport)
    const parsed = JSON.parse(output)

    expect(parsed.diff_name).toBe('origin/main...HEAD')
    expect(parsed.total_percent_covered).toBe(66.7)
    expect(parsed.files).toHaveLength(2)
    expect(parsed.files[1].missing_lines).toEqual([3, 5, 6])
  })
})

describe('Markdown reporter', () => {
  it('generates a markdown table', () => {
    const output = generateMarkdownReport(sampleReport)

    expect(output).toContain('## Diff Coverage')
    expect(output).toContain('| src/foo.ts |')
    expect(output).toContain('50.0%')
    expect(output).toContain('3, 5-6')
    expect(output).toContain('**Total:')
  })
})
