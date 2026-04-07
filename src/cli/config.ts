import { readFileSync, existsSync } from 'node:fs'
import { parse as parseToml } from 'smol-toml'

/**
 * Load the `[tool.<toolName>]` section from a TOML config file and return
 * its key/value pairs with keys converted from snake_case to camelCase.
 *
 * Returns an empty object if the file has no matching section.
 * Throws if the file path is provided but does not exist.
 */
export function loadConfig(
  configPath: string | undefined,
  toolName: 'diff_cover' | 'diff_quality',
): Record<string, unknown> {
  if (!configPath) return {}

  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`)
  }

  const content = readFileSync(configPath, 'utf-8')
  const parsed = parseToml(content) as Record<string, unknown>

  const tool = parsed.tool as Record<string, unknown> | undefined
  if (!tool) return {}

  const section = tool[toolName] as Record<string, unknown> | undefined
  if (!section) return {}

  // Convert snake_case keys to camelCase
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(section)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    result[camelKey] = value
  }

  return result
}
