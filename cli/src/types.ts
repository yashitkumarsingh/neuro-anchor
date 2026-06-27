import { WhitelistedCommands } from '@neuro-anchor/core';

export { WhitelistedCommands };

export interface CliOptions {
  command: string;
  mode: string;
  format: string;
  args: string[];
}

export type WhitelistedCommand = typeof WhitelistedCommands[number];
