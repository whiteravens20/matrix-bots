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
    const result = parseCommand('!moderate off-topic discussion');
    expect(result.command).toBe('moderate');
    expect(result.input).toBe('off-topic discussion');
    expect(result.isCommand).toBe(true);
  });

  it('normalises commands to lowercase', () => {
    const result = parseCommand('!MODERATE spam');
    expect(result.command).toBe('moderate');
    expect(result.input).toBe('spam');
  });

  it('handles multiple consecutive spaces', () => {
    const result = parseCommand('!announce   important   update');
    expect(result.command).toBe('announce');
    expect(result.input).toBe('important   update');
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
    const result = parseCommand('!announce événement spécial');
    expect(result.command).toBe('announce');
    expect(result.input).toBe('événement spécial');
  });

  it('preserves original message in input when no command prefix', () => {
    const result = parseCommand('Hello everyone!');
    expect(result.command).toBe('general');
    expect(result.input).toBe('Hello everyone!');
  });

  it('handles command with leading whitespace before !', () => {
    const result = parseCommand('  !help');
    expect(result.command).toBe('help');
    expect(result.input).toBe('');
    expect(result.isCommand).toBe(true);
  });

  it('handles command with trailing whitespace after arguments', () => {
    const result = parseCommand('!announce hello   ');
    expect(result.command).toBe('announce');
    expect(result.input).toBe('hello');
  });

  it('returns empty input for a lone exclamation mark', () => {
    const result = parseCommand('!');
    expect(result.command).toBe('');
    expect(result.input).toBe('');
    expect(result.isCommand).toBe(true);
  });

  it('handles commands with special characters in arguments', () => {
    const result = parseCommand('!moderate @user please stop spamming #general');
    expect(result.command).toBe('moderate');
    expect(result.input).toBe('@user please stop spamming #general');
  });

  it('handles very long input without error', () => {
    const longInput = 'a'.repeat(10000);
    const result = parseCommand(`!announce ${longInput}`);
    expect(result.command).toBe('announce');
    expect(result.input).toBe(longInput);
  });

  it('handles simultaneous-like rapid command variations independently', () => {
    const inputs = [
      '!help',
      '!help me',
      '!moderate',
      '!moderate spam',
      '!announce',
      '!announce hello',
      '!clear',
      '!clear all'
    ];
    const results = inputs.map(parseCommand);
    expect(results.every(r => r.isCommand)).toBe(true);
    expect(results[0].command).toBe('help');
    expect(results[1].command).toBe('help');
    expect(results[1].input).toBe('me');
    expect(results[2].command).toBe('moderate');
    expect(results[3].command).toBe('moderate');
    expect(results[3].input).toBe('spam');
  });
});
