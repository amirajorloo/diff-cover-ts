import { describe, it, expect } from 'vitest'
import { parseUnifiedDiff } from '../git/diff-parser.js'

describe('parseUnifiedDiff', () => {
  it('parses added files with line ranges', () => {
    const diffText = `diff --git a/src/foo.ts b/src/foo.ts
index 1234567..abcdefg 100644
--- a/src/foo.ts
+++ b/src/foo.ts
@@ -0,0 +1,6 @@
+line 1
+line 2
+line 3
+line 4
+line 5
+line 6
diff --git a/src/bar.ts b/src/bar.ts
index 1234567..abcdefg 100644
--- a/src/bar.ts
+++ b/src/bar.ts
@@ -0,0 +1,3 @@
+line 1
+line 2
+line 3
`

    const files = parseUnifiedDiff(diffText)

    expect(files).toHaveLength(2)

    const foo = files.find((f) => f.path === 'src/foo.ts')
    expect(foo).toBeDefined()
    expect(foo!.addedLines).toEqual([1, 2, 3, 4, 5, 6])
    expect(foo!.deletedLines).toEqual([])

    const bar = files.find((f) => f.path === 'src/bar.ts')
    expect(bar).toBeDefined()
    expect(bar!.addedLines).toEqual([1, 2, 3])
  })

  it('parses modifications with both additions and deletions', () => {
    const diffText = `diff --git a/src/app.ts b/src/app.ts
index 1234567..abcdefg 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -5,2 +5,3 @@
`

    const files = parseUnifiedDiff(diffText)
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('src/app.ts')
    expect(files[0].addedLines).toEqual([5, 6, 7])
    expect(files[0].deletedLines).toEqual([5, 6])
  })

  it('handles deleted files (to /dev/null)', () => {
    const diffText = `diff --git a/src/old.ts b/src/old.ts
deleted file mode 100644
index 1234567..0000000
--- a/src/old.ts
+++ /dev/null
@@ -1,5 +0,0 @@
`

    const files = parseUnifiedDiff(diffText)
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('src/old.ts')
    expect(files[0].deletedLines).toEqual([1, 2, 3, 4, 5])
    expect(files[0].addedLines).toEqual([])
  })

  it('returns empty array for empty diff', () => {
    expect(parseUnifiedDiff('')).toEqual([])
  })
})
