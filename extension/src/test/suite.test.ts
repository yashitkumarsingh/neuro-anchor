// Share mock state globally to avoid Node require cache mismatches
if (!(global as any).mockWorkspaceConfig) {
  (global as any).mockWorkspaceConfig = new Map<string, any>();
}
const mockWorkspaceConfig = (global as any).mockWorkspaceConfig;

const mockVscode = {
  workspace: {
    getConfiguration: () => ({
      get: (key: string, defaultValue: any) => {
        if (key === 'ollamaUrl') return 'http://localhost:11434';
        if (key === 'ollamaModel') return 'llama3';
        return mockWorkspaceConfig.get(key) !== undefined ? mockWorkspaceConfig.get(key) : defaultValue;
      },
      update: async (key: string, value: any) => {
        mockWorkspaceConfig.set(key, value);
      },
      inspect: (key: string) => ({
        workspaceValue: mockWorkspaceConfig.get(key),
        defaultValue: undefined
      })
    })
  },
  window: {
    showInformationMessage: () => {},
    showErrorMessage: () => {}
  },
  ConfigurationTarget: {
    Workspace: 2
  }
};

// Register mock vscode module
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id: string) {
  if (id === 'vscode') {
    return mockVscode;
  }
  return originalRequire.apply(this, arguments);
};

// Polyfill global fetch in older Node environments so it doesn't throw ReferenceError
if (typeof (global as any).fetch === 'undefined') {
  (global as any).fetch = function() {
    return Promise.reject(new Error('Offline environment - mock fetch connection failure'));
  };
}

// Now import the local modules which require 'vscode'
import * as assert from 'assert';
import { LocalAi } from '../localAi';
import { SettingsManager } from '../settingsManager';

// Polyfill Node.js native test runner for compatibility with older environments (Node < 18)
let test: (name: string, fn: () => Promise<void> | void) => Promise<void>;
let describe: (name: string, fn: () => void) => void;

try {
  const nodeTest = require('node:test');
  test = nodeTest.test;
  describe = nodeTest.describe;
} catch (e) {
  describe = (name: string, fn: () => void) => {
    console.log(`\n📦 ${name}`);
    fn();
  };
  test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
    } catch (err: any) {
      console.error(`  ❌ ${name}`);
      console.error(err);
      process.exitCode = 1;
    }
  };
}

describe('Local AI Heuristic Fallbacks', () => {
  test('compileTicket extracts tasks correctly for low-energy mode', async () => {
    const ticketText = "Implement date validator helper for date cancellation schedule check. Ensure date is validated.";
    const tasks = await LocalAi.compileTicket(ticketText, 'low-energy');
    
    assert.ok(Array.isArray(tasks));
    assert.ok(tasks.length >= 3, 'Heuristic compiler should break into multiple tasks');
    
    const firstTask = tasks[0];
    assert.ok(firstTask.files && firstTask.files.length > 0);
    
    const fileMatches = firstTask.files.some(f => /Date/i.test(f));
    assert.ok(fileMatches, 'Tasks should suggest files based on keyword frequency (Date)');
  });

  test('translatePRFeedback translates architectural PR concerns', async () => {
    const feedbackText = "Not sure this is the right direction, let's revisit next sync.";
    const translation = await LocalAi.translatePRFeedback(feedbackText);
    
    assert.strictEqual(typeof translation.meaning, 'string');
    assert.match(translation.meaning, /architecture|approach/i);
    assert.ok(translation.reply.includes('API') || translation.reply.includes('design') || translation.reply.includes('pattern'));
  });

  test('translatePRFeedback translates refactoring comment patterns', async () => {
    const feedbackText = "Clean this code up, it looks slightly messy.";
    const translation = await LocalAi.translatePRFeedback(feedbackText);
    
    assert.match(translation.meaning, /style|convention|refactor|clean/i);
  });
});

describe('Settings Profile Manager', () => {
  test('getProfileSettings returns exact changes for focus mode', () => {
    const focusSettings = (SettingsManager as any).getProfileSettings('focus');
    
    assert.strictEqual(focusSettings['editor.minimap.enabled'], false);
    assert.strictEqual(focusSettings['breadcrumbs.enabled'], false);
    assert.strictEqual(focusSettings['workbench.activityBar.visible'], false);
  });

  test('getProfileSettings returns exact changes for low-sensory mode', () => {
    const lowSensorySettings = (SettingsManager as any).getProfileSettings('low-sensory');
    
    assert.strictEqual(lowSensorySettings['editor.minimap.enabled'], false);
    assert.strictEqual(lowSensorySettings['editor.renderLineHighlight'], 'none');
    assert.strictEqual(lowSensorySettings['editor.hover.enabled'], false);
  });
});
