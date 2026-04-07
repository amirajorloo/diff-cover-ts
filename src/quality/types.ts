import type { Violation } from '../types'

/**
 * Interface that every quality driver must implement.
 *
 * A driver knows how to:
 * - Run a quality tool on a set of files and return its raw stdout (`run`)
 * - Parse that output (or a pre-generated report file) into a violation map (`parseReport`)
 */
export interface QualityDriver {
  name: string
  /** Parse violations from tool output */
  parseReport(content: string): Map<string, Violation[]>
  /** Run the tool on given files and return raw output */
  run(files: string[]): Promise<string>
}
