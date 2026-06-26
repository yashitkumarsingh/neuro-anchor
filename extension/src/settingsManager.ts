import * as vscode from 'vscode';

export type CognitiveProfile = 'focus' | 'low-sensory' | 'standard' | 'debug';

interface SettingsBackup {
  [key: string]: any;
}

export class SettingsManager {
  private static readonly BACKUP_KEY = 'neuroAnchor.settingsBackup';

  private static settingsToManage = [
    'editor.minimap.enabled',
    'editor.renderLineHighlight',
    'editor.parameterHints.enabled',
    'editor.hover.enabled',
    'editor.matchBrackets',
    'editor.occurrencesHighlight',
    'editor.colorDecorators',
    'editor.stickyScroll.enabled',
    'breadcrumbs.enabled',
    'workbench.activityBar.visible',
    'workbench.statusBar.visible',
    'workbench.sideBar.location'
  ];

  /**
   * Activates a specific cognitive-load profile, backing up original settings if necessary.
   */
  public static async activateProfile(profile: CognitiveProfile, context: vscode.ExtensionContext): Promise<void> {
    const config = vscode.workspace.getConfiguration();

    // If switching to standard, restore from backup
    if (profile === 'standard') {
      await this.restoreBackup(context);
      vscode.window.showInformationMessage('Neuro-Anchor: Restored Standard Mode layout.');
      return;
    }

    // Backup current settings before applying any new profile (if backup doesn't already exist)
    await this.ensureBackup(context, config);

    // Apply profile settings
    const targetSettings = this.getProfileSettings(profile);
    for (const [key, value] of Object.entries(targetSettings)) {
      try {
        await config.update(key, value, vscode.ConfigurationTarget.Workspace);
      } catch (err) {
        console.error(`Failed to update setting: ${key}`, err);
      }
    }

    vscode.window.showInformationMessage(`Neuro-Anchor: Switched to ${profile.toUpperCase()} Mode.`);
  }

  /**
   * Backs up the current settings to workspaceState.
   */
  private static async ensureBackup(context: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<void> {
    let backup = context.workspaceState.get<SettingsBackup>(this.BACKUP_KEY);
    if (!backup) {
      backup = {};
      for (const key of this.settingsToManage) {
        const inspect = config.inspect(key);
        // We want to record what was actively set at the Workspace level, or fallback to default
        backup[key] = inspect?.workspaceValue !== undefined ? inspect.workspaceValue : inspect?.defaultValue;
      }
      await context.workspaceState.update(this.BACKUP_KEY, backup);
    }
  }

  /**
   * Restores settings from workspaceState backup.
   */
  private static async restoreBackup(context: vscode.ExtensionContext): Promise<void> {
    const backup = context.workspaceState.get<SettingsBackup>(this.BACKUP_KEY);
    if (!backup) {
      return; // Nothing to restore
    }

    const config = vscode.workspace.getConfiguration();
    for (const [key, val] of Object.entries(backup)) {
      try {
        await config.update(key, val, vscode.ConfigurationTarget.Workspace);
      } catch (err) {
        console.error(`Failed to restore setting: ${key}`, err);
      }
    }

    // Clean up backup state
    await context.workspaceState.update(this.BACKUP_KEY, undefined);
  }

  /**
   * Returns target setting changes for each profile.
   */
  private static getProfileSettings(profile: CognitiveProfile): Record<string, any> {
    switch (profile) {
      case 'focus':
        return {
          'editor.minimap.enabled': false,
          'breadcrumbs.enabled': false,
          'workbench.activityBar.visible': false,
          'workbench.statusBar.visible': false,
          'editor.stickyScroll.enabled': false,
          'editor.renderLineHighlight': 'line',
          'editor.hover.enabled': true
        };
      case 'low-sensory':
        return {
          'editor.minimap.enabled': false,
          'editor.renderLineHighlight': 'none',
          'editor.parameterHints.enabled': false,
          'editor.hover.enabled': false,
          'editor.matchBrackets': 'never',
          'editor.occurrencesHighlight': false,
          'editor.colorDecorators': false,
          'editor.stickyScroll.enabled': false,
          'breadcrumbs.enabled': false,
          'workbench.activityBar.visible': true,
          'workbench.statusBar.visible': true
        };
      case 'debug':
        return {
          'editor.minimap.enabled': true,
          'editor.renderLineHighlight': 'all',
          'editor.parameterHints.enabled': true,
          'editor.hover.enabled': true,
          'editor.matchBrackets': 'always',
          'editor.occurrencesHighlight': true,
          'editor.colorDecorators': true,
          'editor.stickyScroll.enabled': true,
          'breadcrumbs.enabled': true,
          'workbench.activityBar.visible': true,
          'workbench.statusBar.visible': true
        };
      default:
        return {};
    }
  }
}
