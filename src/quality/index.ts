import { eslintDriver } from './eslint.js'
import { genericDriver } from './generic.js'
import { stylelintDriver } from './stylelint.js'
import type { QualityDriver } from './types.js'

const drivers: Record<string, QualityDriver> = {
  eslint: eslintDriver,
  stylelint: stylelintDriver,
}

/**
 * Look up a quality driver by name.
 *
 * Known drivers: "eslint", "stylelint".
 * Any other name falls back to the generic driver, which parses
 * `file:line:message` formatted output from `--input` files.
 */
export function getQualityDriver(name: string): QualityDriver {
  return drivers[name] ?? genericDriver
}

export type { QualityDriver } from './types.js'
