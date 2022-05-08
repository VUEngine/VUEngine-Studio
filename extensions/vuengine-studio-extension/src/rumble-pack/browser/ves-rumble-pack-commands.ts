import { Command } from '@theia/core';
import { VesRumblePackWidget } from './ves-rumble-pack-widget';

export namespace VesRumblePackCommands {
  export const CATEGORY = 'Rumble Pack';

  export const OPEN_WIDGET: Command = {
    id: 'vesRumblePack.commands.openWidget',
    label: `Open ${VesRumblePackWidget.LABEL}`,
    category: CATEGORY,
  };

  export const DETECT: Command = {
    id: 'vesRumblePack.commands.detectConnected',
    label: 'Detect Connected Rumble Pack',
    category: CATEGORY,
  };
};
