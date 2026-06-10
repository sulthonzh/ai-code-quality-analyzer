import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { measureComplexity } from './complexity.js';

describe('measureComplexity', () => {
  it('returns base complexity for simple code', () => {
    const code = 'const x = 1;\nconsole.log(x);';
    const result = measureComplexity(code);
    assert.ok(result.total >= 1);
    assert.equal(result.functions, 0);
  });

  it('counts if/else branches', () => {
    const code = 'if (a) {}\nelse if (b) {}\nelse {}';
    const result = measureComplexity(code);
    assert.ok(result.total >= 3);
  });

  it('counts logical operators', () => {
    const code = 'if (a && b || c) {}';
    const result = measureComplexity(code);
    assert.ok(result.total >= 4); // if + && + ||
  });

  it('counts functions', () => {
    const code = 'function foo() {}\nconst bar = () => {}';
    const result = measureComplexity(code);
    assert.ok(result.functions >= 2);
  });

  it('counts loops', () => {
    const code = 'for (let i = 0; i < 10; i++) {}\nwhile (true) {}';
    const result = measureComplexity(code);
    assert.ok(result.total >= 3);
  });
});
