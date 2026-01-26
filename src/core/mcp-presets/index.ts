/**
 * MCP Presets - Pre-configured MCP servers for consultation tools
 *
 * These presets allow Claude to delegate tasks to other AI models
 * for quota management or getting different perspectives.
 */

export interface McpPreset {
  /** Unique identifier for the preset */
  key: string;
  /** Human-readable name */
  label: string;
  /** Description of what this MCP server provides */
  description: string;
  /** MCP server configuration */
  server: McpServerConfig;
  /** Prerequisites for using this preset */
  prerequisites: string[];
  /** Warning about permissions/security */
  warning?: string;
}

export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/**
 * Codex MCP preset - delegates tasks to OpenAI Codex CLI
 *
 * Tools exposed:
 * - spawn_agent(prompt) - Launch single autonomous Codex subagent
 * - spawn_agents_parallel(agents) - Run multiple Codex subagents simultaneously
 *
 * @see https://github.com/evilpsycho42/codex-as-mcp
 */
const CODEX_PRESET: McpPreset = {
  key: 'codex',
  label: 'Codex Subagent',
  description: 'Delegate coding tasks to OpenAI Codex CLI with spawn_agent and spawn_agents_parallel tools',
  server: {
    command: 'uvx',
    args: ['codex-as-mcp@latest'],
  },
  prerequisites: [
    'Codex CLI v0.46.0+ installed',
    'Non-interactive auth configured in ~/.codex/config.toml',
  ],
  warning: 'Uses --full-auto flag granting command execution and file editing permissions',
};

/**
 * Gemini MCP preset - delegates tasks to Google Gemini CLI
 *
 * Tools exposed:
 * - ask-gemini - Analyze files/directories or answer questions using large context window
 * - sandbox-test - Execute code in isolated Gemini sandbox
 *
 * @see https://github.com/jamubc/gemini-mcp-tool
 */
const GEMINI_PRESET: McpPreset = {
  key: 'gemini',
  label: 'Gemini CLI',
  description: 'Query Google Gemini for large file analysis (1M+ tokens) and sandboxed code execution',
  server: {
    command: 'npx',
    args: ['-y', 'gemini-mcp-tool'],
  },
  prerequisites: [
    'Node.js v16.0.0+',
    'Google Gemini CLI installed and configured',
  ],
};

/**
 * All available MCP presets
 */
const MCP_PRESETS: McpPreset[] = [CODEX_PRESET, GEMINI_PRESET];

/**
 * Get all available MCP presets
 */
export function listMcpPresets(): McpPreset[] {
  return [...MCP_PRESETS];
}

/**
 * Get a specific MCP preset by key
 */
export function getMcpPreset(key: string): McpPreset | undefined {
  return MCP_PRESETS.find((p) => p.key === key);
}

/**
 * Parse comma-separated preset keys into validated preset list
 */
export function parseMcpPresets(input: string | undefined): string[] {
  if (!input) return [];
  return input
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter((k) => getMcpPreset(k) !== undefined);
}

/**
 * Validate preset keys and return unknown ones
 */
export function validateMcpPresets(keys: string[]): { valid: string[]; unknown: string[] } {
  const valid: string[] = [];
  const unknown: string[] = [];
  for (const key of keys) {
    if (getMcpPreset(key)) {
      valid.push(key);
    } else {
      unknown.push(key);
    }
  }
  return { valid, unknown };
}

/**
 * Get MCP server name for .claude.json (used as key in mcpServers object)
 */
export function getMcpServerName(presetKey: string): string {
  const preset = getMcpPreset(presetKey);
  if (!preset) return presetKey;
  // Use a clean identifier
  switch (presetKey) {
    case 'codex':
      return 'codex-subagent';
    case 'gemini':
      return 'gemini-cli';
    default:
      return presetKey;
  }
}
