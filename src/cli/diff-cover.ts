#!/usr/bin/env node
import { Command } from 'commander'
import { runDiffCover } from '../core/diff-cover.js'
import { writeReports } from '../reports/index.js'
import { addSharedOptions, resolveOptions } from './shared.js'
import type { DiffCoverOptions } from '../types.js'

const program = new Command('diff-cover')
  .description(
    'Find changed lines missing test coverage. Compares git diff against coverage reports.',
  )
  .argument(
    '<coverage-files...>',
    'Coverage report files (LCOV, Cobertura XML, Clover XML, JaCoCo XML)',
  )
  .version('0.1.0')

addSharedOptions(program)

program.action(async (coverageFiles: string[]) => {
  try {
    const opts = program.opts()
    const shared = resolveOptions(opts, 'diff_cover')

    const options: DiffCoverOptions = {
      ...shared,
      coverageFiles,
    }

    const { report, exitCode } = await runDiffCover(options)
    await writeReports(report, options.formats, options.quiet)
    process.exit(exitCode)
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(2)
  }
})

program.parse()
