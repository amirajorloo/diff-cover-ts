import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseLcov } from '../coverage/lcov'
import { parseCobertura } from '../coverage/cobertura'
import { parseCoverageFile, mergeCoverageData } from '../coverage/index'

const FIXTURES = join(import.meta.dirname, 'fixtures')

describe('LCOV parser', () => {
  it('parses sample LCOV file', () => {
    const content = readFileSync(join(FIXTURES, 'sample.lcov'), 'utf-8')
    const data = parseLcov(content, '/repo', [])

    const foo = data.get('src/foo.ts')
    expect(foo).toBeDefined()
    expect(foo!.measuredLines.size).toBe(6)
    expect(foo!.coveredLines.size).toBe(3) // lines 1, 2, 4

    const bar = data.get('src/bar.ts')
    expect(bar).toBeDefined()
    expect(bar!.measuredLines.size).toBe(3)
    expect(bar!.coveredLines.size).toBe(3)
  })
})

describe('Cobertura parser', () => {
  it('parses sample Cobertura XML', () => {
    const content = readFileSync(join(FIXTURES, 'sample-cobertura.xml'), 'utf-8')
    const data = parseCobertura(content, '/repo', [])

    const foo = data.get('src/foo.ts')
    expect(foo).toBeDefined()
    expect(foo!.measuredLines.size).toBe(5)
    expect(foo!.coveredLines.size).toBe(3) // lines 1, 2, 4

    const bar = data.get('src/bar.ts')
    expect(bar).toBeDefined()
    expect(bar!.coveredLines.size).toBe(3)
  })
})

describe('parseCoverageFile auto-detection', () => {
  it('detects LCOV format', () => {
    const data = parseCoverageFile(join(FIXTURES, 'sample.lcov'), '/repo', [])
    expect(data.has('src/foo.ts')).toBe(true)
  })

  it('detects Cobertura XML format', () => {
    const data = parseCoverageFile(join(FIXTURES, 'sample-cobertura.xml'), '/repo', [])
    expect(data.has('src/foo.ts')).toBe(true)
  })
})

describe('mergeCoverageData', () => {
  it('merges with intersection semantics for uncovered lines', () => {
    // Report 1: line 3 uncovered
    const report1 = new Map([
      [
        'src/foo.ts',
        {
          measuredLines: new Set([1, 2, 3]),
          coveredLines: new Set([1, 2]),
        },
      ],
    ])
    // Report 2: line 3 is covered, line 2 uncovered
    const report2 = new Map([
      [
        'src/foo.ts',
        {
          measuredLines: new Set([1, 2, 3]),
          coveredLines: new Set([1, 3]),
        },
      ],
    ])

    const merged = mergeCoverageData([report1, report2])
    const foo = merged.get('src/foo.ts')!

    // Line 3: uncovered in report1, covered in report2 -> covered (intersection)
    expect(foo.coveredLines.has(3)).toBe(true)
    // Line 2: covered in report1, uncovered in report2 -> covered (intersection)
    expect(foo.coveredLines.has(2)).toBe(true)
    // All 3 lines are measured
    expect(foo.measuredLines.size).toBe(3)
    // All 3 lines are covered (no line is uncovered in ALL reports)
    expect(foo.coveredLines.size).toBe(3)
  })

  it('returns empty map for no reports', () => {
    expect(mergeCoverageData([]).size).toBe(0)
  })
})
