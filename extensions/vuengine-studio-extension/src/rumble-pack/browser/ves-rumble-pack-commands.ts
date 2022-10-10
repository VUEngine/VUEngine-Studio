import { Command } from '@theia/core';

export namespace VesRumblePackCommands {
  export const DETECT: Command = Command.toLocalizedCommand(
    {
      id: 'ves:rumblePack:detectConnected',
      label: 'Detect Connected Rumble Pack',
      category: 'Rumble Pack',
    },
    'vuengine/rumblePack/commands/detectConnected',
    'vuengine/rumblePack/commands/category'
  );
};
