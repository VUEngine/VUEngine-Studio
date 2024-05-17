import { Command } from '@theia/core';

export namespace VesEmulatorCommands {
  export const RUN: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:run',
      label: 'Run on Emulator',
      category: 'Emulator',
    },
    'vuengine/emulator/commands/run',
    'vuengine/emulator/commands/category'
  );

  export const SELECT: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:selectEmulator',
      label: 'Set Default Emulator Config...',
      category: 'Emulator',
    },
    'vuengine/emulator/commands/selectEmulator',
    'vuengine/emulator/commands/category'
  );

  export const INPUT_L_UP: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:controller:lUp',
      label: 'Left D-Pad ⇧',
      category: 'Emulator Game Pad',
    },
    'vuengine/emulator/controller/lUpCommand',
    'vuengine/emulator/controller/category'
  );

  export const INPUT_L_RIGHT: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:controller:lRight',
      label: 'Left D-Pad ⇨',
      category: 'Emulator Game Pad',
    },
    'vuengine/emulator/controller/lRightCommand',
    'vuengine/emulator/controller/category'
  );

  export const INPUT_L_DOWN: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:controller:lDown',
      label: 'Left D-Pad ⇩',
      category: 'Emulator Game Pad',
    },
    'vuengine/emulator/controller/lDownCommand',
    'vuengine/emulator/controller/category'
  );

  export const INPUT_L_LEFT: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:controller:lLeft',
      label: 'Left D-Pad ⇦',
      category: 'Emulator Game Pad',
    },
    'vuengine/emulator/controller/lLeftCommand',
    'vuengine/emulator/controller/category'
  );

  export const INPUT_START: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:controller:start',
      label: 'Start',
      category: 'Emulator Game Pad',
    },
    'vuengine/emulator/controller/startCommand',
    'vuengine/emulator/controller/category'
  );

  export const INPUT_SELECT: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:controller:select',
      label: 'Select',
      category: 'Emulator Game Pad',
    },
    'vuengine/emulator/controller/selectCommand',
    'vuengine/emulator/controller/category'
  );

  export const INPUT_L_TRIGGER: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:controller:lTrigger',
      label: 'Left Trigger',
      category: 'Emulator Game Pad',
    },
    'vuengine/emulator/controller/lTriggerCommand',
    'vuengine/emulator/controller/category'
  );

  export const INPUT_R_UP: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:controller:rUp',
      label: 'Right D-Pad ⇧',
      category: 'Emulator Game Pad',
    },
    'vuengine/emulator/controller/rUpCommand',
    'vuengine/emulator/controller/category'
  );

  export const INPUT_R_RIGHT: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:controller:rRight',
      label: 'Right D-Pad ⇨',
      category: 'Emulator Game Pad',
    },
    'vuengine/emulator/controller/rRightCommand',
    'vuengine/emulator/controller/category'
  );

  export const INPUT_R_DOWN: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:controller:rDown',
      label: 'Right D-Pad ⇩',
      category: 'Emulator Game Pad',
    },
    'vuengine/emulator/controller/rDownCommand',
    'vuengine/emulator/controller/category'
  );

  export const INPUT_R_LEFT: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:controller:rLeft',
      label: 'Right D-Pad ⇦',
      category: 'Emulator Game Pad',
    },
    'vuengine/emulator/controller/rLeftCommand',
    'vuengine/emulator/controller/category'
  );

  export const INPUT_B: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:controller:b',
      label: 'B',
      category: 'Emulator Game Pad',
    },
    'vuengine/emulator/controller/bCommand',
    'vuengine/emulator/controller/category'
  );

  export const INPUT_A: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:controller:a',
      label: 'A',
      category: 'Emulator Game Pad',
    },
    'vuengine/emulator/controller/aCommand',
    'vuengine/emulator/controller/category'
  );

  export const INPUT_R_TRIGGER: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:controller:rTrigger',
      label: 'Right Trigger',
      category: 'Emulator Game Pad',
    },
    'vuengine/emulator/controller/rTriggerCommand',
    'vuengine/emulator/controller/category'
  );

  export const INPUT_SAVE_STATE: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:saveState',
      label: 'Save State',
      category: 'Emulator',
    },
    'vuengine/emulator/input/saveStateCommand',
    'vuengine/emulator/commands/category'
  );

  export const INPUT_LOAD_STATE: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:loadState',
      label: 'Load State',
      category: 'Emulator',
    },
    'vuengine/emulator/input/loadStateCommand',
    'vuengine/emulator/commands/category'
  );

  export const INPUT_STATE_SLOT_DECREASE: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:stateSlotDecrease',
      label: 'Decrease Save State Slot',
      category: 'Emulator',
    },
    'vuengine/emulator/input/stateSlotDecreaseCommand',
    'vuengine/emulator/commands/category'
  );

  export const INPUT_STATE_SLOT_INCREASE: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:stateSlotIncrease',
      label: 'Increase Save State Slot',
      category: 'Emulator',
    },
    'vuengine/emulator/input/stateSlotIncreaseCommand',
    'vuengine/emulator/commands/category'
  );

  export const INPUT_TOGGLE_FAST_FORWARD: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:toggleFastForward',
      label: 'Toggle Fast Forward',
      category: 'Emulator',
    },
    'vuengine/emulator/input/toggleFastForwardCommand',
    'vuengine/emulator/commands/category'
  );

  export const INPUT_PAUSE_TOGGLE: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:pauseToggle',
      label: 'Toggle Pause',
      category: 'Emulator',
    },
    'vuengine/emulator/input/pauseToggleCommand',
    'vuengine/emulator/commands/category'
  );

  export const INPUT_TOGGLE_SLOWMOTION: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:toggleSlowmotion',
      label: 'Toggle Slow Motion',
      category: 'Emulator',
    },
    'vuengine/emulator/input/toggleSlowmotionCommand',
    'vuengine/emulator/commands/category'
  );

  export const INPUT_TOGGLE_LOW_POWER: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:toggleLowPower',
      label: 'Toggle Low Power Signal',
      category: 'Emulator',
    },
    'vuengine/emulator/input/toggleLowPower',
    'vuengine/emulator/commands/category'
  );

  export const INPUT_REWIND: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:rewind',
      label: 'Rewind',
      category: 'Emulator',
    },
    'vuengine/emulator/input/rewindCommand',
    'vuengine/emulator/commands/category'
  );

  export const INPUT_FRAME_ADVANCE: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:frameAdvance',
      label: 'Frame Advance',
      category: 'Emulator',
    },
    'vuengine/emulator/input/frameAdvanceCommand',
    'vuengine/emulator/commands/category'
  );

  export const INPUT_RESET: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:reset',
      label: 'Reset',
      category: 'Emulator',
    },
    'vuengine/emulator/input/resetCommand',
    'vuengine/emulator/commands/category'
  );

  export const INPUT_AUDIO_MUTE: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:audioMute',
      label: 'Audio Mute',
      category: 'Emulator',
    },
    'vuengine/emulator/input/audioMuteCommand',
    'vuengine/emulator/commands/category'
  );

  export const INPUT_FULLSCREEN: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:fullscreen',
      label: 'Fullscreen',
      category: 'Emulator',
    },
    'vuengine/emulator/input/fullscreenCommand',
    'vuengine/emulator/commands/category'
  );

  export const INPUT_TOGGLE_CONTROLS_OVERLAY: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:toggleControlsOverlay',
      label: 'Toggle Controls Overlay',
      category: 'Emulator',
    },
    'vuengine/emulator/input/toggleControlsOverlayCommand',
    'vuengine/emulator/commands/category'
  );

  export const INPUT_SCREENSHOT: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:screenshot',
      label: 'Take Screenshot',
      category: 'Emulator',
    },
    'vuengine/emulator/input/screenshotCommand',
    'vuengine/emulator/commands/category'
  );

  export const INPUT_DUMP_SRAM: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:input:dumpSram',
      label: 'Dump SRAM',
      category: 'Emulator',
    },
    'vuengine/emulator/input/dumpSramCommand',
    'vuengine/emulator/commands/category'
  );

  export const WIDGET_HELP: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:showHelp',
      label: 'Show Handbook Page',
      category: 'Emulator',
      iconClass: 'codicon codicon-book',
    },
    'vuengine/emulator/showHelp',
    'vuengine/emulator/commands/category'
  );

  export const WIDGET_SETTINGS: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:showSettings',
      label: 'Show Emulator Preferences',
      category: 'Emulator',
      iconClass: 'codicon codicon-settings',
    },
    'vuengine/emulator/commands/showSettings',
    'vuengine/emulator/commands/category'
  );

  export const CANCEL_RED_VIPER_TRANSFER: Command = Command.toLocalizedCommand(
    {
      id: 'ves:emulator:cancelRedViperTransfer',
      label: 'Cancel Red Viper Transfer',
      category: 'Emulator',
      iconClass: 'codicon codicon-close',
    },
    'vuengine/emulator/commands/cancelRedViperTransfer',
    'vuengine/emulator/commands/category'
  );
};
