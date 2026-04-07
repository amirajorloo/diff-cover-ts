/**
 * Coverage data for all files in a report.
 *
 * Maps a git-relative file path to its line coverage sets:
 * - `measuredLines`: all line numbers that the coverage tool tracked
 * - `coveredLines`: subset of measuredLines that were executed at least once
 */
export type CoverageData = Map<
  string,
  {
    coveredLines: Set<number>
    measuredLines: Set<number>
  }
>
