import { describe, it, expect } from 'vitest'
import { toUnixPath, groupConsecutiveLines, resolveFilePath } from '../util'

describe('toUnixPath', () => {
  it('converts backslashes to forward slashes', () => {
    expect(toUnixPath('src\\foo\\bar.ts')).toBe('src/foo/bar.ts')
  })

  it('leaves unix paths unchanged', () => {
    expect(toUnixPath('src/foo/bar.ts')).toBe('src/foo/bar.ts')
  })
})

describe('groupConsecutiveLines', () => {
  it('returns empty string for empty array', () => {
    expect(groupConsecutiveLines([])).toBe('')
  })

  it('groups consecutive lines into ranges', () => {
    expect(groupConsecutiveLines([1, 2, 3, 5, 7, 8])).toBe('1-3, 5, 7-8')
  })

  it('handles single line', () => {
    expect(groupConsecutiveLines([5])).toBe('5')
  })

  it('handles non-consecutive lines', () => {
    expect(groupConsecutiveLines([1, 3, 5])).toBe('1, 3, 5')
  })

  it('handles unsorted input', () => {
    expect(groupConsecutiveLines([3, 1, 2])).toBe('1-3')
  })
})

describe('resolveFilePath', () => {
  it('strips git root from absolute paths', () => {
    expect(resolveFilePath('/home/user/repo/src/foo.ts', '/home/user/repo', [])).toBe('src/foo.ts')
  })

  it('strips src root prefix', () => {
    expect(resolveFilePath('src/main/java/com/Foo.java', '/repo', ['src/main/java'])).toBe(
      'com/Foo.java',
    )
  })

  it('returns relative paths as-is when no roots match', () => {
    expect(resolveFilePath('src/foo.ts', '/repo', [])).toBe('src/foo.ts')
  })
})
