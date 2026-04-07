import { describe, it, expect } from 'vitest'
import { getQualityDriver } from '../quality/index'

describe('ESLint driver', () => {
  it('parses compact format output', () => {
    const driver = getQualityDriver('eslint')
    const output = `src/foo.ts: line 10, col 5, Error - no-unused-vars
src/foo.ts: line 15, col 1, Warning - no-console
src/bar.ts: line 3, col 10, Error - no-undef`

    const violations = driver.parseReport(output)

    expect(violations.get('src/foo.ts')).toHaveLength(2)
    expect(violations.get('src/bar.ts')).toHaveLength(1)
    expect(violations.get('src/foo.ts')![0]).toEqual({
      line: 10,
      message: 'Error - no-unused-vars',
    })
  })
})

describe('Generic driver', () => {
  it('parses file:line:message format', () => {
    const driver = getQualityDriver('generic')
    const output = `src/foo.ts:10:5: some warning
src/bar.ts:20: another issue`

    const violations = driver.parseReport(output)

    expect(violations.get('src/foo.ts')).toHaveLength(1)
    expect(violations.get('src/foo.ts')![0].line).toBe(10)
    expect(violations.get('src/bar.ts')).toHaveLength(1)
    expect(violations.get('src/bar.ts')![0].line).toBe(20)
  })
})

describe('getQualityDriver', () => {
  it("returns eslint driver for 'eslint'", () => {
    expect(getQualityDriver('eslint').name).toBe('eslint')
  })

  it("returns stylelint driver for 'stylelint'", () => {
    expect(getQualityDriver('stylelint').name).toBe('stylelint')
  })

  it('returns generic driver for unknown tool', () => {
    expect(getQualityDriver('unknown').name).toBe('generic')
  })
})
