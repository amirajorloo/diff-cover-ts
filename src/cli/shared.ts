import { Command } from 'commander'
import type { OutputFormat, SharedOptions } from '../types.js'
import { loadConfig } from './config.js'

/** Parse a --format value like "html:report.html" into OutputFormat */
function parseFormatArg(value: string): OutputFormat {
  const colonIdx = value.indexOf(':')
  if (colonIdx === -1) {
    return { type: value as OutputFormat['type'] }
  }
  const type = value.slice(0, colonIdx) as OutputFormat['type']
  const path = value.slice(colonIdx + 1)
  return { type, path }
}

/** Collect repeated --format flags */
function collectFormat(value: string, previous: OutputFormat[]): OutputFormat[] {
  return [...previous, parseFormatArg(value)]
}

/** Add shared options to a commander Command */
export function addSharedOptions(cmd: Command): Command {
  return cmd
    .option('--compare-branch <branch>', 'Branch to compare against', 'origin/main')
    .option('--fail-under <number>', 'Fail if coverage/quality % is below threshold', '0')
    .option('--include <glob...>', 'Only include matching files')
    .option('--exclude <glob...>', 'Exclude matching files')
    .option(
      '--format <type[:path]>',
      'Output format (console, html:path, json:path, markdown:path)',
      collectFormat,
      [] as OutputFormat[],
    )
    .option('--diff-range-notation <notation>', 'Git diff range notation', '...')
    .option('--quiet', 'Suppress non-error output', false)
    .option('--src-roots <paths>', 'Comma-separated source roots for monorepos')
    .option('--config-file <path>', 'TOML configuration file')
}

/** Merge CLI options with config file, returning SharedOptions */
export function resolveOptions(
  cliOpts: Record<string, unknown>,
  toolName: 'diff_cover' | 'diff_quality',
): SharedOptions {
  const configOpts = loadConfig(cliOpts.configFile as string | undefined, toolName)

  // CLI takes precedence over config
  const merged = { ...configOpts, ...stripUndefined(cliOpts) }

  const srcRootsRaw = (merged.srcRoots as string) || ''
  const srcRoots = srcRootsRaw ? srcRootsRaw.split(',').map((s: string) => s.trim()) : []

  return {
    compareBranch: (merged.compareBranch as string) || 'origin/main',
    failUnder: parseFloat((merged.failUnder as string) || '0'),
    include: (merged.include as string[]) || [],
    exclude: (merged.exclude as string[]) || [],
    formats: (merged.format as OutputFormat[]) || [],
    diffRangeNotation: (merged.diffRangeNotation as '...' | '..') || '...',
    quiet: Boolean(merged.quiet),
    srcRoots,
  }
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) result[k] = v
  }
  return result
}
