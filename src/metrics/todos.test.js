import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findTodos } from './todos.js';

describe('findTodos', () => {
  it('finds TODO comments', () => {
    const code = '// TODO: fix this later\nconst x = 1;';
    const result = findTodos(code);
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'TODO');
    assert.equal(result[0].text, 'fix this later');
    assert.equal(result[0].line, 1);
  });

  it('finds FIXME with assignee', () => {
    const code = '# FIXME(john): broken logic';
    const result = findTodos(code);
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'FIXME');
    assert.equal(result[0].assignee, 'john');
  });

  it('finds HACK comments', () => {
    const code = '// HACK: temporary workaround\n// TODO: remove after fix';
    const result = findTodos(code);
    assert.equal(result.length, 2);
    assert.equal(result[0].type, 'HACK');
    assert.equal(result[1].type, 'TODO');
  });

  it('returns empty for no todos', () => {
    const code = 'const x = 1;\nconsole.log(x);';
    const result = findTodos(code);
    assert.equal(result.length, 0);
  });
});
