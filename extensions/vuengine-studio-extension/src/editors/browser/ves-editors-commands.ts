import { Command } from '@theia/core';

export namespace VesEditorsCommands {
  export const CATEGORY = 'Editors';

  export const OPEN_EDITOR: Command = {
    id: 'ves:editors:open',
    label: 'Open Editor'
  };
};
