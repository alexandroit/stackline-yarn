/* @flow */
const micromatch = require('micromatch');

// Yarn Classic documents bare alternation (for example gulp|grunt) in --pattern.
// micromatch 4 requires an explicit group to keep that matching behavior.
export default function contains(name: string, pattern: string): boolean {
  return micromatch.contains(name, pattern.includes('|') ? `(${pattern})` : pattern);
}
