import { writeFileSync } from 'node:fs'
import type { ReportData, OutputFormat } from '../types.js'
import { generateConsoleReport } from './console.js'
import { generateHtmlReport } from './html.js'
import { generateJsonReport } from './json.js'
import { generateMarkdownReport } from './markdown.js'

export { generateConsoleReport } from './console.js'
export { generateHtmlReport } from './html.js'
export { generateJsonReport } from './json.js'
export { generateMarkdownReport } from './markdown.js'

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
