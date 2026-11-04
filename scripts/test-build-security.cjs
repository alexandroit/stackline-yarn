// Exercise the actual Jest configuration merger with its scoped patched dependency.
'use strict';
const assert = require('node:assert/strict');
const {createRequire} = require('node:module');
const jestRequire = createRequire(require.resolve('jest-config'));
assert.equal(jestRequire('deepmerge/package.json').name, '@stackline/deepmerge');
const {mergeConfig} = require('jest-config');
const defaults = {globals: {flags: {enabled: true}, names: ['left']}, testMatch: ['**/*.test.js']};
const overrides = {globals: {flags: {strict: true}, names: ['right']}};
assert.deepEqual(mergeConfig(defaults, overrides), {
  globals: {flags: {enabled: true, strict: true}, names: ['left', 'right']},
  testMatch: ['**/*.test.js']
});
assert.deepEqual(defaults.globals.names, ['left']);
const source = JSON.parse('{"globals":{"__proto__":{"isAdmin":true},"safe":true}}');
for (const target of [Object.create(null), JSON.parse('{"__proto__":null}'), JSON.parse('{"__proto__":0}')]) {
  const result = mergeConfig({globals: target}, source);
  assert.equal(result.globals.isAdmin, undefined);
  assert.equal(Object.hasOwn(result.globals, '__proto__'), false);
  assert.equal(result.globals.safe, true);
}
assert.equal({}.isAdmin, undefined);
console.log('Jest configuration merges remain compatible and reject CVE-2026-93753.');
