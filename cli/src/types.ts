export interface CliOptions {
  command: string;
  mode: string;
  format: string;
  args: string[];
}

export const WhitelistedCommands = [
  'npm test',
  'npm run compile',
  'npm run build',
  'git status',
  'git diff',
  'git diff --stat'
] as const;

export type WhitelistedCommand = typeof WhitelistedCommands[number];
