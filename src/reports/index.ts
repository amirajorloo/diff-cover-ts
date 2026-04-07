import { writeFileSync } from 'node:fs'
import type { ReportData, OutputFormat } from '../types'
import { generateConsoleReport } from './console'
import { generateHtmlReport } from './html'
import { generateJsonReport } from './json'
import { generateMarkdownReport } from './markdown'

export { generateConsoleReport } from './console'
export { generateHtmlReport } from './html'
export { generateJsonReport } from './json'
export { generateMarkdownReport } from './markdown'

const generators: Record<OutputFormat['type'], (data: ReportData) => string> = {
  console: generateConsoleReport,
  html: generateHtmlReport,
  json: generateJsonReport,
  markdown: generateMarkdownReport,
}

/**
 * Write report(s) to stdout and/or files based on `formats`.
 *
 * Default behaviour (no formats specified, quiet=false): write console report to stdout.
 * If a "console" format is explicitly included, it is written to stdout.
 * All other formats with a `path` are written to disk.
 */
export async function writeReports(
  data: ReportData,
  formats: OutputFormat[],
  quiet: boolean,
): Promise<void> {
  const hasConsole = formats.some((f) => f.type === 'console')

  if (!quiet && !hasConsole) {
    process.stdout.write(generateConsoleReport(data))
  }

  for (const fmt of formats) {
    const content = generators[fmt.type](data)

    if (fmt.type === 'console' || !fmt.path) {
      process.stdout.write(content)
    } else {
      writeFileSync(fmt.path, content, 'utf-8')
    }
  }
}
