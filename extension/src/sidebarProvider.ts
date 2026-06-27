import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { LocalAi } from './localAi';
import { SettingsManager, CognitiveProfile } from './settingsManager';
import { WhitelistedCommands } from '@neuro-anchor/core';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'neuro-anchor.sidebarView';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri, private readonly _context: vscode.ExtensionContext) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'getInitialState': {
          const diff = await this.getGitDiffSummary();
          const activeEditor = vscode.window.activeTextEditor;
          const activeFile = activeEditor ? activeEditor.document.fileName : undefined;
          const isDnd = this._context.workspaceState.get<boolean>('neuroAnchor.dndActive', false);
          const currentProfile = this._context.workspaceState.get<string>('neuroAnchor.currentProfile', 'standard');
          const tasks = this._context.workspaceState.get<any[]>('neuroAnchor.activeTasks', []) || [];
          const queue = this._context.workspaceState.get<string[]>('neuroAnchor.laterQueue', []) || [];
          
          webviewView.webview.postMessage({
            type: 'initialState',
            value: {
              diff,
              activeFile,
              isDnd,
              profile: currentProfile,
              tasks,
              queue
            }
          });
          break;
        }

        case 'compileTicket': {
          try {
            const tasks = await LocalAi.compileTicket(data.text, data.mode);
            await this._context.workspaceState.update('neuroAnchor.activeTasks', tasks);
            webviewView.webview.postMessage({
              type: 'ticketCompiled',
              value: tasks
            });
          } catch (e: any) {
            vscode.window.showErrorMessage(`Failed to compile ticket: ${e.message}`);
          }
          break;
        }

        case 'updateTasks': {
          await this._context.workspaceState.update('neuroAnchor.activeTasks', data.value);
          break;
        }

        case 'updateQueue': {
          await this._context.workspaceState.update('neuroAnchor.laterQueue', data.value);
          break;
        }

        case 'translateFeedback': {
          try {
            const translation = await LocalAi.translatePRFeedback(data.text);
            webviewView.webview.postMessage({
              type: 'feedbackTranslated',
              value: translation
            });
          } catch (e: any) {
            vscode.window.showErrorMessage(`Failed to translate feedback: ${e.message}`);
          }
          break;
        }

        case 'generateCheckpoint': {
          try {
            const diff = await this.getGitDiffSummary();
            const activeEditor = vscode.window.activeTextEditor;
            const activeFile = activeEditor ? activeEditor.document.fileName : undefined;
            const lastCommands = this._context.workspaceState.get<string[]>('neuroAnchor.commandHistory', []) || [];
            
            const checkpoint = await LocalAi.generateContextCheckpoint(diff, lastCommands, activeFile);
            webviewView.webview.postMessage({
              type: 'checkpointGenerated',
              value: checkpoint
            });
          } catch (e: any) {
            vscode.window.showErrorMessage(`Failed to generate context checkpoint: ${e.message}`);
          }
          break;
        }

        case 'changeProfile': {
          const profile = data.value as CognitiveProfile;
          await SettingsManager.activateProfile(profile, this._context);
          await this._context.workspaceState.update('neuroAnchor.currentProfile', profile);
          webviewView.webview.postMessage({
            type: 'profileChanged',
            value: profile
          });
          break;
        }

        case 'toggleDND': {
          const newState = data.value as boolean;
          await this._context.workspaceState.update('neuroAnchor.dndActive', newState);
          if (newState) {
            vscode.window.showInformationMessage('Interruption Shield active. Non-urgent tasks queued.');
          } else {
            vscode.window.showInformationMessage('Interruption Shield disabled.');
          }
          webviewView.webview.postMessage({
            type: 'dndToggled',
            value: newState
          });
          break;
        }

        case 'executeCommand': {
          const cmd = data.value as string;
          if (cmd) {
            const whitelistedCommands = WhitelistedCommands;

            const normalizedCmd = cmd.trim().replace(/\s+/g, ' ');
            const isWhitelisted = whitelistedCommands.some(w => normalizedCmd === w || normalizedCmd.startsWith(w + ' '));

            const runTerminalCommand = async () => {
              const history = this._context.workspaceState.get<string[]>('neuroAnchor.commandHistory', []) || [];
              history.push(cmd);
              if (history.length > 20) history.shift();
              await this._context.workspaceState.update('neuroAnchor.commandHistory', history);

              let term = vscode.window.terminals.find(t => t.name === 'Neuro-Anchor Exec');
              if (!term) {
                term = vscode.window.createTerminal('Neuro-Anchor Exec');
              }
              term.show();
              term.sendText(cmd);
            };

            if (isWhitelisted) {
              await runTerminalCommand();
            } else {
              const approval = await vscode.window.showWarningMessage(
                `Neuro-Anchor Security Check: Do you want to run this custom command in your terminal?\n\nCommand: "${cmd}"`,
                'Execute Command',
                'Block Command'
              );

              if (approval === 'Execute Command') {
                await runTerminalCommand();
              } else {
                vscode.window.showInformationMessage('Command blocked by user.');
              }
            }
          }
          break;
        }

        case 'openFile': {
          const filePath = data.value as string;
          if (filePath) {
            const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            const fullPath = rootPath ? path.resolve(rootPath, filePath) : filePath;
            if (fs.existsSync(fullPath)) {
              const doc = await vscode.workspace.openTextDocument(fullPath);
              await vscode.window.showTextDocument(doc);
            } else {
              vscode.window.showWarningMessage(`File not found: ${filePath}`);
            }
          }
          break;
        }

        case 'showInfo': {
          vscode.window.showInformationMessage(data.value);
          break;
        }
      }
    });
  }

  private async getGitDiffSummary(): Promise<string> {
    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!rootPath) {
      return '';
    }

    return new Promise((resolve) => {
      exec('git diff --stat', { cwd: rootPath, timeout: 3000 }, (err, stdout) => {
        if (err || !stdout) {
          exec('git status --short', { cwd: rootPath, timeout: 3000 }, (err2, stdout2) => {
            resolve(stdout2 || '');
          });
        } else {
          resolve(stdout || '');
        }
      });
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const htmlPath = vscode.Uri.file(path.join(this._extensionUri.fsPath, 'extension', 'src', 'webview', 'sidebar.html'));
    try {
      let html = fs.readFileSync(htmlPath.fsPath, 'utf8');
      
      // We need to inject VS Code webview script and style if needed,
      // but standard html content is fine. We will configure webview-specific hooks in JS.
      return html;
    } catch (e) {
      return `<html><body><h3>Failed to load sidebar HTML template</h3><p>${e}</p></body></html>`;
    }
  }
}
