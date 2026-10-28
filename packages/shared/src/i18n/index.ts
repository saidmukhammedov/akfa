import { uz, TranslationType } from './uz.js';
import { ru } from './ru.js';
import { Language } from '../types/auth.js';

export * from './uz.js';
export * from './ru.js';
export * from './formatters.js';

export const translations: Record<Language, TranslationType> = {
  uz,
  ru,
};

export function getTranslation(lang: Language = 'uz'): TranslationType {
  return translations[lang] || uz;
}
