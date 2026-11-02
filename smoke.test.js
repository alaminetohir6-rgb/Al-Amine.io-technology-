import test from 'node:test';
import assert from 'node:assert/strict';
import { safeEqual, sign, verifySigned } from '../src/security.js';

test('safeEqual accepts matching values and rejects different values', () => {
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
});
test('signed session values verify only with the correct secret', () => {
  const token = sign('owner', 'test-secret');
  assert.equal(verifySigned(token, 'test-secret'), 'owner');
  assert.equal(verifySigned(token, 'wrong-secret'), null);
});
