export { runDiffCover } from './core/diff-cover'
export { runDiffQuality } from './core/diff-quality'
export { parseCoverageFile, mergeCoverageData } from './coverage/index'
export { getChangedFiles } from './git/diff-parser'
export type {
  ReportData,
  FileReport,
  Violation,
  FileDiff,
  DiffCoverOptions,
  DiffQualityOptions,
  OutputFormat,
  SharedOptions,
} from './types'
