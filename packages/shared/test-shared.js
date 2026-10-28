import assert from 'node:assert';
import { formatCurrency, formatDate, getTranslation, workerCreateSchema } from './dist/index.js';

// Test Uzbek currency formatting
assert.strictEqual(formatCurrency(1500000, 'uz'), "1 500 000 so'm");
assert.strictEqual(formatCurrency(250000, 'ru'), "250 000 сум");

// Test localized dates
const d = '2026-10-28';
assert.ok(formatDate(d, 'uz', 'medium').includes('oktabr'));
assert.ok(formatDate(d, 'ru', 'medium').includes('октября'));

// Test translations
const tUz = getTranslation('uz');
assert.strictEqual(tUz.nav.davomat, 'Davomat');
assert.strictEqual(tUz.roles.usta, 'Bosh usta');

const tRu = getTranslation('ru');
assert.strictEqual(tRu.nav.davomat, 'Посещаемость');
assert.strictEqual(tRu.roles.usta, 'Главный мастер');

// Test phone validation with user's scenario
const userCase = workerCreateSchema.safeParse({
  name: 'Fund nk8c',
  phone: '9999999',
  role: 'usta',
  dailyRate: 200000,
});
assert.strictEqual(userCase.success, true, '7-digit phone number (9999999) must be accepted');

const fullPhoneCase = workerCreateSchema.safeParse({
  name: 'Sardor Aliyev',
  phone: '+998 90 123 45 67',
  role: 'usta',
  dailyRate: 250000,
});
assert.strictEqual(fullPhoneCase.success, true, 'Full international phone must be accepted');

const emptyPhoneCase = workerCreateSchema.safeParse({
  name: 'Vali Bek',
  phone: '',
  role: 'shogird',
  dailyRate: 150000,
});
assert.strictEqual(emptyPhoneCase.success, true, 'Empty phone must be accepted');

const invalidPhoneCase = workerCreateSchema.safeParse({
  name: 'Test',
  phone: '123',
  role: 'usta',
  dailyRate: 100000,
});
assert.strictEqual(invalidPhoneCase.success, false, 'Phone < 7 digits must fail');
assert.ok(invalidPhoneCase.error.errors[0].message.includes('Telefon raqami noto'), 'Must contain friendly Uzbek message');

console.log('✓ All shared tests passed successfully!');
