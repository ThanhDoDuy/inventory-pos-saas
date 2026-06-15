import type { Messages } from './types';

export function translate(messages: Messages, key: string): string {
  const parts = key.split('.');
  let current: unknown = messages;

  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return key;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : key;
}
