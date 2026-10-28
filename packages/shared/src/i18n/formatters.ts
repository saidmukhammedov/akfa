import { Language } from '../types/auth.js';

/**
 * Formats a monetary amount into Uzbek So'm string with language specific currency label
 * Example: 1500000 -> "1 500 000 so'm" (uz) or "1 500 000 сум" (ru)
 */
export function formatCurrency(amount: number, lang: Language = 'uz'): string {
  const rounded = Math.round(amount || 0);
  const formattedNumber = new Intl.NumberFormat('ru-RU').format(rounded).replace(/\s/g, ' ');
  const suffix = lang === 'uz' ? "so'm" : 'сум';
  return `${formattedNumber} ${suffix}`;
}

const UZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
];

const RU_MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

const UZ_WEEKDAYS = [
  'Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'
];

const RU_WEEKDAYS = [
  'Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'
];

/**
 * Formats a date string (YYYY-MM-DD or ISO) into a localized friendly string
 */
export function formatDate(
  input: string | Date,
  lang: Language = 'uz',
  style: 'short' | 'medium' | 'full' = 'medium'
): string {
  const date = typeof input === 'string' ? new Date(input.includes('T') ? input : `${input}T00:00:00`) : input;
  
  if (isNaN(date.getTime())) {
    return String(input);
  }

  const day = date.getDate();
  const monthIdx = date.getMonth();
  const year = date.getFullYear();
  const weekdayIdx = date.getDay();

  if (style === 'short') {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(day)}.${pad(monthIdx + 1)}.${year}`;
  }

  if (style === 'full') {
    const weekday = lang === 'uz' ? UZ_WEEKDAYS[weekdayIdx] : RU_WEEKDAYS[weekdayIdx];
    const month = lang === 'uz' ? UZ_MONTHS[monthIdx] : RU_MONTHS[monthIdx];
    return `${weekday}, ${day}-${month}, ${year}`;
  }

  // Medium (default)
  if (lang === 'uz') {
    return `${day}-${UZ_MONTHS[monthIdx]}, ${year}`;
  } else {
    return `${day} ${RU_MONTHS[monthIdx]} ${year} г.`;
  }
}

/**
 * Returns today's ISO date string (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Formats a standard Uzbek phone number to "+998 (90) 123-45-67"
 */
export function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `+998 (${cleaned.slice(0, 2)}) ${cleaned.slice(2, 5)}-${cleaned.slice(5, 7)}-${cleaned.slice(7, 9)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('998')) {
    return `+998 (${cleaned.slice(3, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8, 10)}-${cleaned.slice(10, 12)}`;
  }
  return phone;
}
