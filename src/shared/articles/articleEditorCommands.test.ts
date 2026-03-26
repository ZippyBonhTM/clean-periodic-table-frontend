import { describe, expect, it } from 'vitest';

import { applyArticleEditorCommand } from '@/shared/articles/articleEditorCommands';

describe('applyArticleEditorCommand', () => {
  it('wraps selected text in bold markers', () => {
    const result = applyArticleEditorCommand({
      value: 'hello world',
      selectionStart: 6,
      selectionEnd: 11,
      command: 'bold',
    });

    expect(result.value).toBe('hello **world**');
  });

  it('prefixes selected lines as headings', () => {
    const result = applyArticleEditorCommand({
      value: 'line one\nline two',
      selectionStart: 0,
      selectionEnd: 17,
      command: 'h2',
    });

    expect(result.value).toBe('## line one\n## line two');
  });

  it('builds numbered lists line by line', () => {
    const result = applyArticleEditorCommand({
      value: 'alpha\nbeta',
      selectionStart: 0,
      selectionEnd: 10,
      command: 'numbered-list',
    });

    expect(result.value).toBe('1. alpha\n2. beta');
  });

  it('inserts a link template when nothing is selected', () => {
    const result = applyArticleEditorCommand({
      value: '',
      selectionStart: 0,
      selectionEnd: 0,
      command: 'link',
    });

    expect(result.value).toBe('[link text](https://)');
    expect(result.selectionStart).toBe(1);
    expect(result.selectionEnd).toBe(10);
  });

  it('inserts a divider block at the cursor', () => {
    const result = applyArticleEditorCommand({
      value: 'before',
      selectionStart: 6,
      selectionEnd: 6,
      command: 'divider',
    });

    expect(result.value).toBe('before\n\n---\n\n');
  });
});
