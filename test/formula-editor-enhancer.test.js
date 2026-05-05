import test from 'node:test';
import assert from 'node:assert/strict';

import { FormulaEditorEnhancer } from '../src/content/formula-editor-enhancer.js';

function buildLineInfos(lines) {
  const enhancer = new FormulaEditorEnhancer();
  let depth = 0;

  const infos = lines.map(text => {
    const depthBefore = Math.max(0, depth);
    const leadingSpaces = enhancer.countLeadingSpaces(text);
    const bracketMetrics = enhancer.getBracketLineMetrics(text, depthBefore);
    depth = bracketMetrics.depthAfter;

    return {
      text,
      depthBefore,
      depthAfter: bracketMetrics.depthAfter,
      minDepth: bracketMetrics.minDepth,
      indentLevel: leadingSpaces > 0 ? Math.floor(leadingSpaces / 2) : depthBefore,
      foldBaseDepth: Math.min(depthBefore, bracketMetrics.minDepth),
      foldEndIndex: null,
      isFoldable: false,
      usesSeparateCollapsedLine: false,
    };
  });

  infos.forEach((info, index) => {
    const nextInfo = infos[index + 1];
    info.isFoldable = Boolean(
      nextInfo &&
      info.depthAfter > info.foldBaseDepth &&
      nextInfo.depthBefore > info.foldBaseDepth
    );
    if (info.isFoldable) {
      info.foldEndIndex = enhancer.findFoldEnd(infos, index);
    }
  });

  return { enhancer, infos };
}

test('getBracketLineMetrics ignores brackets inside strings and line comments', () => {
  const enhancer = new FormulaEditorEnhancer();
  const metrics = enhancer.getBracketLineMetrics('Concatenate(")", "[") // ({[', 1);

  assert.deepEqual(metrics, {
    depthAfter: 1,
    minDepth: 1,
  });
});

test('fold detection finds the matching closing line for nested formula blocks', () => {
  const { infos } = buildLineInfos([
    'If(',
    '  Condition,',
    '  ListCombine(',
    '    A,',
    '    B',
    '  ),',
    '  ""',
    ')',
  ]);

  assert.equal(infos[0].isFoldable, true);
  assert.equal(infos[0].foldEndIndex, 7);
  assert.equal(infos[2].isFoldable, true);
  assert.equal(infos[2].foldEndIndex, 5);
});

test('collapsed inline tokens preserve comma when the closing line has one', () => {
  const enhancer = new FormulaEditorEnhancer();

  assert.equal(enhancer.getInlineClosingToken('  ),'), '),');
  assert.equal(enhancer.getInlineClosingToken('  ]'), ']');
});

test('separate collapsed rows are used only for complex closing lines', () => {
  const enhancer = new FormulaEditorEnhancer();

  assert.equal(enhancer.shouldUseSeparateCollapsedLine('  ),'), false);
  assert.equal(enhancer.shouldUseSeparateCollapsedLine('  ), OtherArg'), true);
  assert.equal(enhancer.shouldUseSeparateCollapsedLine('  }))'), true);
});

test('long line detection follows the configured column', () => {
  const enhancer = new FormulaEditorEnhancer();

  assert.equal(enhancer.isLongLine('x'.repeat(121), { highlightLongLines: true, longLineColumn: 120 }), true);
  assert.equal(enhancer.isLongLine('x'.repeat(120), { highlightLongLines: true, longLineColumn: 120 }), false);
  assert.equal(enhancer.isLongLine('x'.repeat(180), { highlightLongLines: false, longLineColumn: 120 }), false);
});
