import assert from 'node:assert';
import { formatCurrency, formatDate, getTranslation } from './dist/index.js';

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

console.log('✓ All shared tests passed successfully!');
