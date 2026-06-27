import * as path from 'path';

// Share mock state globally to avoid Node require cache mismatches
if (!(global as any).mockWorkspaceState) {
  (global as any).mockWorkspaceState = new Map<string, any>();
}
if (!(global as any).mockWorkspaceConfig) {
  (global as any).mockWorkspaceConfig = new Map<string, any>();
}

const mockWorkspaceState = (global as any).mockWorkspaceState;
const mockWorkspaceConfig = (global as any).mockWorkspaceConfig;

const mockVscode = {
  commands: {
    registerCommand: (id: string, callback: (...args: any[]) => any) => ({
      dispose: () => {}
    })
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/mock/workspace' } }],
    getConfiguration: () => ({
      get: (key: string, defaultValue: any) => {
        if (key === 'ollamaUrl') return 'http://localhost:11434';
        if (key === 'ollamaModel') return 'llama3';
        return mockWorkspaceConfig.get(key) !== undefined ? mockWorkspaceConfig.get(key) : defaultValue;
      },
      update: async (key: string, value: any, target: any) => {
        mockWorkspaceConfig.set(key, value);
      },
      inspect: (key: string) => ({
        workspaceValue: mockWorkspaceConfig.get(key),
        defaultValue: undefined
      })
    }),
    openTextDocument: async (path: string) => ({ path }),
    createFileSystemWatcher: () => ({
      dispose: () => {},
      onDidChange: () => ({ dispose: () => {} }),
      onDidCreate: () => ({ dispose: () => {} }),
      onDidDelete: () => ({ dispose: () => {} })
    })
  },
  window: {
    terminals: [] as any[],
    activeTextEditor: undefined as any,
    showInformationMessage: async (msg: string) => msg,
    showWarningMessage: async (msg: string, ...actions: string[]) => actions[0],
    createTerminal: (name: string) => {
      const term = {
        name,
        show: () => {},
        sendText: () => {}
      };
      mockVscode.window.terminals.push(term);
      return term;
    },
    showTextDocument: async (doc: any) => doc,
    registerWebviewViewProvider: (viewId: string, provider: any) => ({
      dispose: () => {}
    }),
    onDidChangeActiveTextEditor: (callback: (editor: any) => any) => ({
      dispose: () => {}
    })
  },
  ConfigurationTarget: {
    Workspace: 2
  },
  Uri: {
    file: (fsPath: string) => ({
      fsPath,
      scheme: 'file'
    })
  }
};

const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id: string) {
  if (id === 'vscode') {
    return mockVscode;
  }
  return originalRequire.apply(this, arguments);
};

// Polyfill global fetch in older Node environments
if (typeof (global as any).fetch === 'undefined') {
  (global as any).fetch = function() {
    return Promise.reject(new Error('Offline environment - mock fetch connection failure'));
  };
}

// Polyfill Node.js native test runner for older Node versions (Node < 18)
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

import * as assert from 'assert';
import { SidebarProvider } from '../sidebarProvider';

const rootPath = path.resolve(__dirname, '..', '..', '..');
const extensionContextMock = {
  extensionUri: { fsPath: rootPath },
  subscriptions: [] as any[],
  workspaceState: {
    get: (key: string, defaultValue?: any) => {
      return mockWorkspaceState.has(key) ? mockWorkspaceState.get(key) : defaultValue;
    },
    update: async (key: string, value: any) => {
      mockWorkspaceState.set(key, value);
    }
  }
} as any;

describe('End-to-End Webview-Host Communication Loop', () => {

  test('IPC: resolveWebviewView establishes bidirectional communications', async () => {
    const provider = new SidebarProvider({ fsPath: rootPath } as any, extensionContextMock);
    
    let receivedMessages: any[] = [];
    let messageHandlerListener: ((msg: any) => Promise<void>) | undefined;

    const mockWebviewView = {
      webview: {
        options: {},
        html: '',
        onDidReceiveMessage: (listener: (msg: any) => Promise<void>) => {
          messageHandlerListener = listener;
          return { dispose: () => {} };
        },
        postMessage: async (msg: any) => {
          receivedMessages.push(msg);
        }
      }
    } as any;

    provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
    
    assert.ok(messageHandlerListener !== undefined, 'Bidirectional message listener must be bound');
    assert.ok(mockWebviewView.webview.html.includes('Neuro-Anchor'), 'HTML must load real layout containing Neuro-Anchor');

    // Test getInitialState flow
    receivedMessages = [];
    await messageHandlerListener!({ type: 'getInitialState' });
    
    assert.strictEqual(receivedMessages.length, 1);
    const initPayload = receivedMessages[0];
    assert.strictEqual(initPayload.type, 'initialState');
    assert.strictEqual(initPayload.value.profile, 'standard');
    assert.strictEqual(initPayload.value.isDnd, false);
    assert.ok(Array.isArray(initPayload.value.tasks));

    // Test compileTicket fallback flow
    receivedMessages = [];
    await messageHandlerListener!({
      type: 'compileTicket',
      text: 'Write date check validation routines',
      mode: 'low-energy'
    });

    assert.strictEqual(receivedMessages.length, 1);
    const compilePayload = receivedMessages[0];
    assert.strictEqual(compilePayload.type, 'ticketCompiled');
    assert.ok(compilePayload.value.length > 0);

    const cachedTasks = mockWorkspaceState.get('neuroAnchor.activeTasks');
    assert.ok(cachedTasks && cachedTasks.length > 0);

    // Test changeProfile layout overrides
    receivedMessages = [];
    await messageHandlerListener!({
      type: 'changeProfile',
      value: 'focus'
    });

    assert.strictEqual(receivedMessages.length, 1);
    assert.strictEqual(receivedMessages[0].type, 'profileChanged');
    assert.strictEqual(receivedMessages[0].value, 'focus');
    assert.strictEqual(mockWorkspaceConfig.get('editor.minimap.enabled'), false);

    // Test toggleDND flow
    receivedMessages = [];
    await messageHandlerListener!({
      type: 'toggleDND',
      value: true
    });

    assert.strictEqual(receivedMessages.length, 1);
    assert.strictEqual(receivedMessages[0].type, 'dndToggled');
    assert.strictEqual(receivedMessages[0].value, true);
    assert.strictEqual(mockWorkspaceState.get('neuroAnchor.dndActive'), true);
  });
});

import { activate } from '../extension';

describe('HTTP Deep-Link Bridge Server', () => {
  test('HTTP: server responds to /openFile and opens target documents', async () => {
    let openedDocPath: string | null = null;
    
    mockVscode.workspace.openTextDocument = async (filePath: string) => {
      openedDocPath = filePath;
      return { path: filePath } as any;
    };
    
    mockVscode.window.activeTextEditor = undefined;

    // Start HTTP server via activation
    activate(extensionContextMock);

    // Send HTTP POST request to the local server
    try {
      const res = await fetch('http://localhost:5174/openFile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: 'src/test.ts' })
      });

      if (res.status !== 200) {
        const bodyText = await res.text();
        console.error('SERVER ERROR BODY DETAILS:', bodyText);
      }
      assert.strictEqual(res.status, 200);
      const data = await res.json() as { success: boolean; opened: string };
      assert.strictEqual(data.success, true);
      assert.ok(data.opened.includes('src/test.ts'));
      
      assert.ok(openedDocPath !== null);
      assert.ok((openedDocPath as string).includes('src/test.ts'));
    } finally {
      // Clean up server by calling dispose on extension context subscriptions
      const subscriptions = extensionContextMock.subscriptions || [];
      for (const sub of subscriptions) {
        if (sub && typeof sub.dispose === 'function') {
          sub.dispose();
        }
      }
      // Wait for socket to release cleanly
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });
});
