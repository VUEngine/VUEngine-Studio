import { Command } from '@theia/core';

export namespace VesRumblePackCommands {
  export const DETECT: Command = Command.toLocalizedCommand(
    {
      id: 'rumblePack.detectConnected',
      label: 'Detect Connected Rumble Pack',
      category: 'Rumble Pack',
    },
    'vuengine/editors/rumbleEffect/commands/detectConnected',
    'vuengine/editors/rumbleEffect/commands/category'
  );
};
