import * as vscode from 'vscode';
import * as http from 'http';
import * as path from 'path';
import { SidebarProvider } from './sidebarProvider';
import { SettingsManager } from './settingsManager';

export function activate(context: vscode.ExtensionContext) {
  console.log('Neuro-Anchor extension is now active!');

  // Start local HTTP Deep Link Bridge server
  const PORT = 5174;
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.url === '/openFile' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { file } = JSON.parse(body);
          if (file) {
            let targetPath = file;
            if (!path.isAbsolute(file) && vscode.workspace.workspaceFolders) {
              const root = vscode.workspace.workspaceFolders[0].uri.fsPath;
              targetPath = path.join(root, file);
            }

            const doc = await vscode.workspace.openTextDocument(targetPath);
            await vscode.window.showTextDocument(doc);
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, opened: targetPath }));
          } else {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'No file parameter provided' }));
          }
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: (e as Error).message }));
        }
      });
      return;
    }

    res.statusCode = 404;
    res.end();
  });

  server.on('error', (err: any) => {
    console.error(`⚓ [Neuro-Anchor Bridge] Deep Link server error: ${err.message}`);
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`⚓ [Neuro-Anchor Bridge] Deep Link server listening on http://localhost:${PORT}`);
  });

  context.subscriptions.push({
    dispose: () => {
      server.close();
      console.log('⚓ [Neuro-Anchor Bridge] Deep Link server closed.');
    }
  });

  const sidebarProvider = new SidebarProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebarProvider
    )
  );

  // Command to activate Focus Mode
  context.subscriptions.push(
    vscode.commands.registerCommand('neuro-anchor.toggleFocusMode', async () => {
      await SettingsManager.activateProfile('focus', context);
      await context.workspaceState.update('neuroAnchor.currentProfile', 'focus');
    })
  );

  // Command to activate Low Sensory Mode
  context.subscriptions.push(
    vscode.commands.registerCommand('neuro-anchor.toggleLowSensoryMode', async () => {
      await SettingsManager.activateProfile('low-sensory', context);
      await context.workspaceState.update('neuroAnchor.currentProfile', 'low-sensory');
    })
  );

  // Command to restore Standard Mode
  context.subscriptions.push(
    vscode.commands.registerCommand('neuro-anchor.restoreStandardMode', async () => {
      await SettingsManager.activateProfile('standard', context);
      await context.workspaceState.update('neuroAnchor.currentProfile', 'standard');
    })
  );

  // Command to toggle Interruption Shield
  context.subscriptions.push(
    vscode.commands.registerCommand('neuro-anchor.toggleDND', async () => {
      const current = context.workspaceState.get<boolean>('neuroAnchor.dndActive', false);
      const next = !current;
      await context.workspaceState.update('neuroAnchor.dndActive', next);
      vscode.window.showInformationMessage(
        next ? 'Interruption Shield Active (Do Not Disturb)' : 'Interruption Shield Disabled'
      );
    })
  );

  // Watch for active file changes to notify companion
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      const activeFile = editor.document.fileName;
      // We can broadcast this to our sidebar view if it's active
      // In VS Code, we can trigger state updates
    }
  });

  // Watch for file modifications to help track work state
  const watcher = vscode.workspace.createFileSystemWatcher('**/*');
  context.subscriptions.push(watcher);
  
  watcher.onDidChange((uri) => {
    // File changed, can log to context state
  });
}

export function deactivate(context: vscode.ExtensionContext) {
  // Try to restore settings if the extension is deactivated during a custom profile
  // Standard SettingsManager can handle cleanup if desired, but VS Code usually handles state
}
