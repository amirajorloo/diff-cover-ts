#!/usr/bin/env node
import { Command } from 'commander'
import { runDiffQuality } from '../core/diff-quality'
import { writeReports } from '../reports/index'
import { addSharedOptions, resolveOptions } from './shared'
import type { DiffQualityOptions } from '../types'

const program = new Command('diff-quality')
  .description(
    'Find code quality violations on changed lines. Compares git diff against quality tool output.',
  )
  .option('--violations <tool>', 'Quality tool: eslint, stylelint, or generic', 'eslint')
  .option('--input <files...>', 'Pre-generated violation report files')
  .version('0.1.0')

addSharedOptions(program)

program.action(async () => {
  try {
    const opts = program.opts()
    const shared = resolveOptions(opts, 'diff_quality')

    const options: DiffQualityOptions = {
      ...shared,
      violations: opts.violations as string,
      inputFiles: (opts.input as string[]) || [],
    }

    const { report, exitCode } = await runDiffQuality(options)
    await writeReports(report, options.formats, options.quiet)
    process.exit(exitCode)
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(2)
  }
})

program.parse()
