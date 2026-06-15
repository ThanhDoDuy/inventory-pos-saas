import { en } from './en';
import { vi } from './vi';
import type { Messages } from './types';

export type Locale = 'vi' | 'en';

export const MESSAGES: Record<Locale, Messages> = { vi, en };

export { vi, en };
