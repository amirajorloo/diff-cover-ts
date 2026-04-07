import type { FileDiff } from '../types'
import { toUnixPath, executeCommand } from '../util'

/**
 * Convert a simple glob pattern to a RegExp.
 * Supports `**` (any path), `*` (any segment), and `?` (single char).
 */
function globToRegExp(pattern: string): RegExp {
  let re = ''
  let i = 0
  while (i < pattern.length) {
    const ch = pattern[i]
    if (ch === '*' && pattern[i + 1] === '*') {
      re += '.*'
      i += pattern[i + 2] === '/' ? 3 : 2 // skip optional trailing /
    } else if (ch === '*') {
      re += '[^/]*'
      i++
    } else if (ch === '?') {
      re += '[^/]'
      i++
    } else if ('.+^${}()|[]\\'.includes(ch)) {
      re += '\\' + ch
      i++
    } else {
      re += ch
      i++
    }
  }
  return new RegExp(`^${re}$`)
}

function matchesGlob(filePath: string, pattern: string): boolean {
  return globToRegExp(pattern).test(filePath)
}

/** Parse a hunk header count value; absent count means 1. */
function parseCount(value: string | undefined): number {
  return value === undefined ? 1 : parseInt(value, 10)
}

/** Generate an inclusive range [start, start+count-1] when count > 0. */
function lineRange(start: number, count: number): number[] {
  const lines: number[] = []
  for (let i = 0; i < count; i++) {
    lines.push(start + i)
  }
  return lines
}

/**
 * Parse unified diff text (produced with -U0) into FileDiff entries.
 */
export function parseUnifiedDiff(diffText: string): FileDiff[] {
  if (!diffText) return []

  const results: FileDiff[] = []
  // Split on diff block boundaries, keeping each block
  const blocks = diffText.split(/^(?=diff --git )/m)

  const hunkRe = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/

  for (const block of blocks) {
    if (!block.startsWith('diff --git ')) continue

    const lines = block.split('\n')

    // Extract file path from +++ line (or --- for deleted files)
    let filePath: string | null = null
    for (const line of lines) {
      if (line.startsWith('+++ b/')) {
        filePath = line.slice(6)
        break
      }
      if (line.startsWith('+++ /dev/null')) {
        // Deleted file — fall through to use --- a/ path
        continue
      }
    }
    if (!filePath) {
      // Deleted file: use --- a/ path
      for (const line of lines) {
        if (line.startsWith('--- a/')) {
          filePath = line.slice(6)
          break
        }
      }
    }
    if (!filePath) continue

    filePath = toUnixPath(filePath)

    const addedLines: number[] = []
    const deletedLines: number[] = []

    for (const line of lines) {
      const match = hunkRe.exec(line)
      if (!match) continue

      const oldStart = parseInt(match[1], 10)
      const oldCount = parseCount(match[2])
      const newStart = parseInt(match[3], 10)
      const newCount = parseCount(match[4])

      if (newCount > 0) {
        addedLines.push(...lineRange(newStart, newCount))
      }
      if (oldCount > 0) {
        deletedLines.push(...lineRange(oldStart, oldCount))
      }
    }

    results.push({ path: filePath, addedLines, deletedLines })
  }

  return results
}

/**
 * Run git diff and return structured FileDiff entries for changed files.
 */
export async function getChangedFiles(options: {
  compareBranch: string
  diffRangeNotation: '...' | '..'
  include: string[]
  exclude: string[]
  srcRoots: string[]
}): Promise<FileDiff[]> {
  const { compareBranch, diffRangeNotation, include, exclude, srcRoots } = options

  const diffRange = `${compareBranch}${diffRangeNotation}HEAD`

  const { stdout } = await executeCommand(
    'git',
    [
      '-c',
      'diff.mnemonicprefix=no',
      '-c',
      'diff.noprefix=no',
      'diff',
      '--no-color',
      '--no-ext-diff',
      '-U0',
      diffRange,
    ],
    [0, 1],
  )

  let files = parseUnifiedDiff(stdout)

  // Filter by srcRoots
  if (srcRoots.length > 0) {
    const normalizedRoots = srcRoots.map((r) => toUnixPath(r).replace(/\/$/, ''))
    files = files.filter((f) =>
      normalizedRoots.some((root) => f.path === root || f.path.startsWith(root + '/')),
    )
  }

  // Filter by include patterns
  if (include.length > 0) {
    files = files.filter((f) => include.some((p) => matchesGlob(f.path, p)))
  }

  // Filter by exclude patterns
  if (exclude.length > 0) {
    files = files.filter((f) => !exclude.some((p) => matchesGlob(f.path, p)))
  }

  return files
}
