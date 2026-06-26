import * as vscode from 'vscode';
import { LocalAi as CoreLocalAi } from '@neuro-anchor/core';

export { Microtask, PRTranslation, ContextRecoveryState } from '@neuro-anchor/core';

export class LocalAi {
  /**
   * Syncs VS Code setting parameters to the shared Core engine before requests.
   */
  private static syncConfig(): void {
    const url = vscode.workspace.getConfiguration('neuroAnchor').get<string>('ollamaUrl') || 'http://localhost:11434';
    const model = vscode.workspace.getConfiguration('neuroAnchor').get<string>('ollamaModel') || 'llama3';
    
    CoreLocalAi.config.url = url;
    CoreLocalAi.config.model = model;
  }

  /**
   * Compiles developer tickets utilizing the shared Core module.
   */
  public static async compileTicket(ticketText: string, mode: string) {
    this.syncConfig();
    return CoreLocalAi.compileTicket(ticketText, mode);
  }

  /**
   * Translates vague comments utilizing the shared Core module.
   */
  public static async translatePRFeedback(feedbackText: string) {
    this.syncConfig();
    return CoreLocalAi.translatePRFeedback(feedbackText);
  }

  /**
   * Generates checkpoint restoration contexts utilizing the shared Core module.
   */
  public static async generateContextCheckpoint(
    gitDiffSummary: string,
    lastCommands: string[],
    activeFile?: string
  ) {
    this.syncConfig();
    return CoreLocalAi.generateContextCheckpoint(gitDiffSummary, lastCommands, activeFile);
  }
}
