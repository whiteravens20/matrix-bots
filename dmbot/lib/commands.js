export function parseCommand(message) {
  const trimmed = message.trim();

  if (!trimmed.startsWith('!')) {
    return {
      command: 'general',
      input: message,
      isCommand: false
    };
  }

  const firstSpace = trimmed.indexOf(' ');
  if (firstSpace === -1) {
    return {
      command: trimmed.substring(1).toLowerCase(),
      input: '',
      isCommand: true
    };
  }

  const command = trimmed.substring(1, firstSpace).toLowerCase();
  const input = trimmed.substring(firstSpace + 1).trim();

  return {
    command,
    input,
    isCommand: true
  };
}
