import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  listMcpPresets,
  getMcpPreset,
  parseMcpPresets,
  validateMcpPresets,
  getMcpServerName,
} from '../../src/core/mcp-presets/index.js';
import { ensureMcpPreset, ensureMcpPresets } from '../../src/core/claude-config.js';

describe('MCP Presets', () => {
  describe('listMcpPresets', () => {
    it('returns codex and gemini presets', () => {
      const presets = listMcpPresets();
      assert.ok(presets.length >= 2, 'Should have at least 2 presets');
      const keys = presets.map((p) => p.key);
      assert.ok(keys.includes('codex'), 'Should include codex preset');
      assert.ok(keys.includes('gemini'), 'Should include gemini preset');
    });
  });

  describe('getMcpPreset', () => {
    it('returns codex preset with correct structure', () => {
      const preset = getMcpPreset('codex');
      assert.ok(preset, 'Codex preset should exist');
      assert.strictEqual(preset.key, 'codex');
      assert.strictEqual(preset.server.command, 'uvx');
      assert.deepStrictEqual(preset.server.args, ['codex-as-mcp@latest']);
      assert.ok(preset.warning, 'Codex should have a warning');
    });

    it('returns gemini preset with correct structure', () => {
      const preset = getMcpPreset('gemini');
      assert.ok(preset, 'Gemini preset should exist');
      assert.strictEqual(preset.key, 'gemini');
      assert.strictEqual(preset.server.command, 'npx');
      assert.deepStrictEqual(preset.server.args, ['-y', 'gemini-mcp-tool']);
    });

    it('returns undefined for unknown preset', () => {
      const preset = getMcpPreset('unknown-preset');
      assert.strictEqual(preset, undefined);
    });
  });

  describe('parseMcpPresets', () => {
    it('parses comma-separated preset keys', () => {
      const presets = parseMcpPresets('codex,gemini');
      assert.deepStrictEqual(presets, ['codex', 'gemini']);
    });

    it('handles whitespace', () => {
      const presets = parseMcpPresets('codex , gemini');
      assert.deepStrictEqual(presets, ['codex', 'gemini']);
    });

    it('filters out unknown presets', () => {
      const presets = parseMcpPresets('codex,unknown,gemini');
      assert.deepStrictEqual(presets, ['codex', 'gemini']);
    });

    it('returns empty array for undefined input', () => {
      const presets = parseMcpPresets(undefined);
      assert.deepStrictEqual(presets, []);
    });

    it('returns empty array for empty string', () => {
      const presets = parseMcpPresets('');
      assert.deepStrictEqual(presets, []);
    });
  });

  describe('validateMcpPresets', () => {
    it('separates valid and unknown presets', () => {
      const result = validateMcpPresets(['codex', 'unknown', 'gemini', 'invalid']);
      assert.deepStrictEqual(result.valid, ['codex', 'gemini']);
      assert.deepStrictEqual(result.unknown, ['unknown', 'invalid']);
    });

    it('returns all valid for known presets', () => {
      const result = validateMcpPresets(['codex', 'gemini']);
      assert.deepStrictEqual(result.valid, ['codex', 'gemini']);
      assert.deepStrictEqual(result.unknown, []);
    });
  });

  describe('getMcpServerName', () => {
    it('returns codex-subagent for codex', () => {
      assert.strictEqual(getMcpServerName('codex'), 'codex-subagent');
    });

    it('returns gemini-cli for gemini', () => {
      assert.strictEqual(getMcpServerName('gemini'), 'gemini-cli');
    });

    it('returns key as-is for unknown preset', () => {
      assert.strictEqual(getMcpServerName('unknown'), 'unknown');
    });
  });
});

describe('ensureMcpPreset', () => {
  let tempDir: string;
  let configDir: string;

  before(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-preset-test-'));
    configDir = path.join(tempDir, 'config');
    fs.mkdirSync(configDir, { recursive: true });
  });

  after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('adds codex MCP server to .claude.json', () => {
    const result = ensureMcpPreset(configDir, 'codex');
    assert.strictEqual(result, true, 'Should return true when adding new server');

    const configPath = path.join(configDir, '.claude.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    assert.ok(config.mcpServers, 'Should have mcpServers');
    assert.ok(config.mcpServers['codex-subagent'], 'Should have codex-subagent server');
    assert.strictEqual(config.mcpServers['codex-subagent'].command, 'uvx');
    assert.deepStrictEqual(config.mcpServers['codex-subagent'].args, ['codex-as-mcp@latest']);
  });

  it('adds gemini MCP server to .claude.json', () => {
    const result = ensureMcpPreset(configDir, 'gemini');
    assert.strictEqual(result, true, 'Should return true when adding new server');

    const configPath = path.join(configDir, '.claude.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    assert.ok(config.mcpServers['gemini-cli'], 'Should have gemini-cli server');
    assert.strictEqual(config.mcpServers['gemini-cli'].command, 'npx');
    assert.deepStrictEqual(config.mcpServers['gemini-cli'].args, ['-y', 'gemini-mcp-tool']);
  });

  it('returns false if server already exists', () => {
    const result = ensureMcpPreset(configDir, 'codex');
    assert.strictEqual(result, false, 'Should return false for existing server');
  });

  it('returns false for unknown preset', () => {
    const result = ensureMcpPreset(configDir, 'unknown-preset');
    assert.strictEqual(result, false, 'Should return false for unknown preset');
  });
});

describe('ensureMcpPresets', () => {
  let tempDir: string;
  let configDir: string;

  before(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-presets-test-'));
    configDir = path.join(tempDir, 'config');
    fs.mkdirSync(configDir, { recursive: true });
  });

  after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('adds multiple MCP servers', () => {
    const added = ensureMcpPresets(configDir, ['codex', 'gemini']);
    assert.deepStrictEqual(added, ['codex', 'gemini']);

    const configPath = path.join(configDir, '.claude.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    assert.ok(config.mcpServers['codex-subagent'], 'Should have codex-subagent');
    assert.ok(config.mcpServers['gemini-cli'], 'Should have gemini-cli');
  });

  it('returns only newly added presets', () => {
    // Try to add again - should return empty since already added
    const added = ensureMcpPresets(configDir, ['codex', 'gemini']);
    assert.deepStrictEqual(added, []);
  });
});
