export { runDiffCover } from './core/diff-cover.js'
export { runDiffQuality } from './core/diff-quality.js'
export { parseCoverageFile, mergeCoverageData } from './coverage/index.js'
export { getChangedFiles } from './git/diff-parser.js'
export type {
  ReportData,
  FileReport,
  Violation,
  FileDiff,
  DiffCoverOptions,
  DiffQualityOptions,
  OutputFormat,
  SharedOptions,
} from './types.js'
