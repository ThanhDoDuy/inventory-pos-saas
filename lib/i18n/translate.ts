import type { Messages } from './messages/types';

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

export function translateParams(
  messages: Messages,
  key: string,
  params?: Record<string, string | number>,
): string {
  let text = translate(messages, key);
  if (!params) return text;

  for (const [name, value] of Object.entries(params)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}
