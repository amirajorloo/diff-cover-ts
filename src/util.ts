import { execFile } from 'node:child_process'
import path from 'node:path'

/** Normalize a path to unix-style forward slashes */
export function toUnixPath(p: string): string {
  return p.replace(/\\/g, '/')
}

/** Execute a command and return stdout/stderr/code */
export function executeCommand(
  command: string,
  args: string[],
  acceptedCodes: number[] = [0],
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      { maxBuffer: 50 * 1024 * 1024, encoding: 'utf-8' },
      (error, stdout, stderr) => {
        const code = error?.code === undefined ? (error ? 1 : 0) : 0
        const exitCode =
          typeof (error as NodeJS.ErrnoException & { status?: number })?.status === 'number'
            ? (error as NodeJS.ErrnoException & { status?: number }).status!
            : code

        if (error && !acceptedCodes.includes(exitCode)) {
          reject(
            new Error(`Command failed: ${command} ${args.join(' ')}\n${stderr || error.message}`),
          )
          return
        }
        resolve({ stdout: stdout || '', stderr: stderr || '', code: exitCode })
      },
    )
  })
}

/** Get the git repository root */
export async function resolveGitRoot(): Promise<string> {
  const { stdout } = await executeCommand('git', ['rev-parse', '--show-toplevel'])
  return stdout.trim()
}

/**
 * Group consecutive line numbers into ranges.
 * e.g., [1, 2, 3, 5, 7, 8] -> "1-3, 5, 7-8"
 */
export function groupConsecutiveLines(lines: number[]): string {
  if (lines.length === 0) return ''
  const sorted = [...lines].sort((a, b) => a - b)
  const ranges: string[] = []
  let start = sorted[0]
  let end = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i]
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`)
      start = sorted[i]
      end = sorted[i]
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`)
  return ranges.join(', ')
}

/**
 * Resolve a file path from coverage report against src roots.
 * Tries to match the coverage path to a git-relative path.
 */
export function resolveFilePath(filePath: string, gitRoot: string, srcRoots: string[]): string {
  let normalized = toUnixPath(filePath)

  // If absolute, make relative to git root
  if (path.isAbsolute(normalized)) {
    const gitRootUnix = toUnixPath(gitRoot)
    if (normalized.startsWith(gitRootUnix)) {
      normalized = normalized.slice(gitRootUnix.length).replace(/^\//, '')
    }
  }

  // Try stripping src roots
  if (srcRoots.length > 0) {
    for (const root of srcRoots) {
      const rootUnix = toUnixPath(root).replace(/\/$/, '') + '/'
      if (normalized.startsWith(rootUnix)) {
        normalized = normalized.slice(rootUnix.length)
        break
      }
    }
  }

  return normalized
}
