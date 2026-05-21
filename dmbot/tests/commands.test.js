import { describe, it, expect } from 'vitest';
import { parseCommand } from '../lib/commands.js';

describe('parseCommand', () => {
  it('treats messages without ! prefix as general input', () => {
    const result = parseCommand('hello world');
    expect(result.command).toBe('general');
    expect(result.input).toBe('hello world');
    expect(result.isCommand).toBe(false);
  });

  it('parses a command without arguments', () => {
    const result = parseCommand('!help');
    expect(result.command).toBe('help');
    expect(result.input).toBe('');
    expect(result.isCommand).toBe(true);
  });

  it('parses a command with arguments', () => {
    const result = parseCommand('!code how to reverse a string');
    expect(result.command).toBe('code');
    expect(result.input).toBe('how to reverse a string');
    expect(result.isCommand).toBe(true);
  });

  it('normalises commands to lowercase', () => {
    const result = parseCommand('!CODE hello');
    expect(result.command).toBe('code');
    expect(result.input).toBe('hello');
  });

  it('handles multiple consecutive spaces', () => {
    const result = parseCommand('!code   multiple   spaces');
    expect(result.command).toBe('code');
    expect(result.input).toBe('multiple   spaces');
  });

  it('handles empty string as general input', () => {
    const result = parseCommand('');
    expect(result.command).toBe('general');
    expect(result.isCommand).toBe(false);
  });

  it('handles whitespace-only string as general input', () => {
    const result = parseCommand('   ');
    expect(result.command).toBe('general');
    expect(result.isCommand).toBe(false);
  });

  it('preserves unicode and special characters in input', () => {
    const result = parseCommand('!translate café résumé naïve');
    expect(result.command).toBe('translate');
    expect(result.input).toBe('café résumé naïve');
  });

  it('preserves original message in input when no command prefix', () => {
    const result = parseCommand('Hello bot!');
    expect(result.command).toBe('general');
    expect(result.input).toBe('Hello bot!');
  });

  it('handles command with leading whitespace before !', () => {
    const result = parseCommand('  !help');
    expect(result.command).toBe('help');
    expect(result.input).toBe('');
    expect(result.isCommand).toBe(true);
  });

  it('handles command with trailing whitespace after arguments', () => {
    const result = parseCommand('!code hello   ');
    expect(result.command).toBe('code');
    expect(result.input).toBe('hello');
  });

  it('returns empty input for a lone exclamation mark', () => {
    const result = parseCommand('!');
    expect(result.command).toBe('');
    expect(result.input).toBe('');
    expect(result.isCommand).toBe(true);
  });

  it('handles commands with pipe and redirect characters', () => {
    const result = parseCommand('!analyze cat file.txt | grep foo > output.txt');
    expect(result.command).toBe('analyze');
    expect(result.input).toBe('cat file.txt | grep foo > output.txt');
  });

  it('handles very long input without error', () => {
    const longInput = 'a'.repeat(10000);
    const result = parseCommand(`!code ${longInput}`);
    expect(result.command).toBe('code');
    expect(result.input).toBe(longInput);
  });

  it('handles simultaneous-like rapid command variations independently', () => {
    const inputs = [
      '!help',
      '!help me',
      '!code',
      '!code test',
      '!translate',
      '!translate hello',
      '!clear',
      '!clear all'
    ];
    const results = inputs.map(parseCommand);
    expect(results.every(r => r.isCommand)).toBe(true);
    expect(results[0].command).toBe('help');
    expect(results[1].command).toBe('help');
    expect(results[1].input).toBe('me');
    expect(results[2].command).toBe('code');
    expect(results[3].command).toBe('code');
    expect(results[3].input).toBe('test');
  });
});
