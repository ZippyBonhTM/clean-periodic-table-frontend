type ArticleEditorCommand =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bold'
  | 'italic'
  | 'quote'
  | 'bullet-list'
  | 'numbered-list'
  | 'code-block'
  | 'link'
  | 'image'
  | 'divider';

type ApplyArticleEditorCommandInput = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
  command: ArticleEditorCommand;
};

type ApplyArticleEditorCommandResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

function wrapSelection(input: {
  value: string;
  selectionStart: number;
  selectionEnd: number;
  prefix: string;
  suffix: string;
  placeholder: string;
}): ApplyArticleEditorCommandResult {
  const before = input.value.slice(0, input.selectionStart);
  const selected = input.value.slice(input.selectionStart, input.selectionEnd);
  const after = input.value.slice(input.selectionEnd);
  const content = selected.length > 0 ? selected : input.placeholder;
  const value = `${before}${input.prefix}${content}${input.suffix}${after}`;
  const contentStart = before.length + input.prefix.length;
  const contentEnd = contentStart + content.length;

  return {
    value,
    selectionStart: contentStart,
    selectionEnd: contentEnd,
  };
}

function prefixSelectedLines(input: {
  value: string;
  selectionStart: number;
  selectionEnd: number;
  prefix: string | ((lineIndex: number) => string);
  placeholder: string;
}): ApplyArticleEditorCommandResult {
  const selectionLineStart = input.value.lastIndexOf('\n', input.selectionStart - 1) + 1;
  const lineBreakAfterSelection = input.value.indexOf('\n', input.selectionEnd);
  const selectionLineEnd =
    lineBreakAfterSelection === -1 ? input.value.length : lineBreakAfterSelection;
  const before = input.value.slice(0, selectionLineStart);
  const selection = input.value.slice(selectionLineStart, selectionLineEnd);
  const after = input.value.slice(selectionLineEnd);
  const baseLines = selection.length > 0 ? selection.split('\n') : [input.placeholder];
  const nextSelection = baseLines
    .map((line, index) => {
      const prefix = typeof input.prefix === 'function' ? input.prefix(index) : input.prefix;
      return `${prefix}${line}`;
    })
    .join('\n');

  return {
    value: `${before}${nextSelection}${after}`,
    selectionStart: selectionLineStart,
    selectionEnd: selectionLineStart + nextSelection.length,
  };
}

function insertBlock(input: {
  value: string;
  selectionStart: number;
  selectionEnd: number;
  block: string;
  focusOffset: number;
  focusLength?: number;
}): ApplyArticleEditorCommandResult {
  const before = input.value.slice(0, input.selectionStart);
  const after = input.value.slice(input.selectionEnd);
  const value = `${before}${input.block}${after}`;
  const selectionStart = before.length + input.focusOffset;

  return {
    value,
    selectionStart,
    selectionEnd: selectionStart + (input.focusLength ?? 0),
  };
}

function applyArticleEditorCommand(
  input: ApplyArticleEditorCommandInput,
): ApplyArticleEditorCommandResult {
  switch (input.command) {
    case 'h1':
      return prefixSelectedLines({ ...input, prefix: '# ', placeholder: 'Heading' });
    case 'h2':
      return prefixSelectedLines({ ...input, prefix: '## ', placeholder: 'Heading' });
    case 'h3':
      return prefixSelectedLines({ ...input, prefix: '### ', placeholder: 'Heading' });
    case 'bold':
      return wrapSelection({ ...input, prefix: '**', suffix: '**', placeholder: 'bold text' });
    case 'italic':
      return wrapSelection({ ...input, prefix: '*', suffix: '*', placeholder: 'italic text' });
    case 'quote':
      return prefixSelectedLines({ ...input, prefix: '> ', placeholder: 'Quote' });
    case 'bullet-list':
      return prefixSelectedLines({ ...input, prefix: '- ', placeholder: 'List item' });
    case 'numbered-list':
      return prefixSelectedLines({
        ...input,
        prefix: (lineIndex) => `${lineIndex + 1}. `,
        placeholder: 'List item',
      });
    case 'code-block':
      return wrapSelection({ ...input, prefix: '```\n', suffix: '\n```', placeholder: 'code' });
    case 'link':
      return insertBlock({
        ...input,
        block: '[link text](https://)',
        focusOffset: 1,
        focusLength: 'link text'.length,
      });
    case 'image':
      return insertBlock({
        ...input,
        block: '![alt text](https://)',
        focusOffset: 2,
        focusLength: 'alt text'.length,
      });
    case 'divider':
      return insertBlock({ ...input, block: '\n\n---\n\n', focusOffset: 6 });
  }
}

export { applyArticleEditorCommand };
export type {
  ApplyArticleEditorCommandInput,
  ApplyArticleEditorCommandResult,
  ArticleEditorCommand,
};
