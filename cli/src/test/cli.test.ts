import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import { renderCompile, renderTranslate, renderStatus } from '../renderer';

describe('CLI Rendering System', () => {
  test('renderCompile outputs clean JSON', () => {
    const tasks = [
      { id: '1', title: 'Task One', duration: '5 min', command: 'npm test', completed: false }
    ];
    const result = renderCompile(tasks, '5-minute', 'json');
    const parsed = JSON.parse(result);
    assert.deepEqual(parsed, tasks);
  });

  test('renderCompile outputs structured Markdown', () => {
    const tasks = [
      { id: '1', title: 'Task One', duration: '5 min', command: 'npm test', completed: false }
    ];
    const result = renderCompile(tasks, '5-minute', 'markdown');
    assert.match(result, /# Actionable Microtasks \(5-minute\)/);
    assert.match(result, /- \[ \] \*\*Step 1: Task One\*\*/);
    assert.match(result, /- \*\*Estimated Duration\*\*: 5 min/);
    assert.match(result, /- \*\*Run Command\*\*: `npm test`/);
  });

  test('renderTranslate outputs clean JSON and Markdown', () => {
    const trans = {
      meaning: 'Reviewer wants changes',
      action: 'Refactor method',
      reply: 'Thanks'
    };
    const jsonResult = renderTranslate(trans, 'json');
    assert.deepEqual(JSON.parse(jsonResult), trans);

    const mdResult = renderTranslate(trans, 'markdown');
    assert.match(mdResult, /# PR Feedback Translation/);
    assert.match(mdResult, /Reviewer wants changes/);
  });

  test('renderStatus formats modified files correctly in Markdown', () => {
    const state = {
      workingOn: 'Refactoring compiler',
      lastState: 'Tests failing',
      changedFiles: ['src/index.ts'],
      nextStep: 'Check syntax',
      suggestedCommand: 'npm run compile'
    };
    const result = renderStatus(state, ['src/index.ts'], 'markdown');
    assert.match(result, /# Context Restoration Point/);
    assert.match(result, /Refactoring compiler/);
    assert.match(result, /- `src\/index.ts`/);
  });
});

describe('CLI Workspace Configuration Overrides', () => {
  const configPath = path.join(process.cwd(), '.neuro-anchor.json');

  test('LocalAi config loads overrides if config file exists', () => {
    const testConfig = {
      url: 'http://test-server:9999',
      model: 'test-model'
    };

    // Write temp configuration
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2), 'utf-8');

    // Re-trigger loadConfig by clearing cache and re-requiring
    delete require.cache[require.resolve('@neuro-anchor/core')];
    const { LocalAi: CoreAi } = require('@neuro-anchor/core');

    assert.strictEqual(CoreAi.config.url, 'http://test-server:9999');
    assert.strictEqual(CoreAi.config.model, 'test-model');

    // Clean up
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  });
});
