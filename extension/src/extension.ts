import * as vscode from 'vscode';
import { SidebarProvider } from './sidebarProvider';
import { SettingsManager } from './settingsManager';

export function activate(context: vscode.ExtensionContext) {
  console.log('Neuro-Anchor extension is now active!');

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
