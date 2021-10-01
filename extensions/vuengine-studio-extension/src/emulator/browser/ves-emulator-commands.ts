import { Command } from '@theia/core';

export namespace VesEmulatorCommands {
  export const CATEGORY = 'Emulator';

  export const RUN: Command = {
    id: 'VesEmulator.commands.run',
    label: 'Run on Emulator',
    category: CATEGORY,
    iconClass: 'codicon codicon-play',
  };

  export const SELECT: Command = {
    id: 'VesEmulator.commands.selectEmulator',
    label: 'Set Default Emulator Config...',
    category: CATEGORY,
  };

  export const INPUT_L_UP: Command = {
    id: 'VesEmulator.commands.emulatorInputLUpCommand',
    label: 'Left D-Pad Up',
    category: 'Emulator Game Pad',
  };

  export const INPUT_L_RIGHT: Command = {
    id: 'VesEmulator.commands.emulatorInputLRightCommand',
    label: 'Left D-Pad Right',
    category: 'Emulator Game Pad',
  };

  export const INPUT_L_DOWN: Command = {
    id: 'VesEmulator.commands.emulatorInputLDownCommand',
    label: 'Left D-Pad Down',
    category: 'Emulator Game Pad',
  };

  export const INPUT_L_LEFT: Command = {
    id: 'VesEmulator.commands.emulatorInputLLeftCommand',
    label: 'Left D-Pad Left',
    category: 'Emulator Game Pad',
  };

  export const INPUT_START: Command = {
    id: 'VesEmulator.commands.emulatorInputStartCommand',
    label: 'Start',
    category: 'Emulator Game Pad',
  };

  export const INPUT_SELECT: Command = {
    id: 'VesEmulator.commands.emulatorInputSelectCommand',
    label: 'Select',
    category: 'Emulator Game Pad',
  };

  export const INPUT_L_TRIGGER: Command = {
    id: 'VesEmulator.commands.emulatorInputLTriggerCommand',
    label: 'Left Trigger',
    category: 'Emulator Game Pad',
  };

  export const INPUT_R_UP: Command = {
    id: 'VesEmulator.commands.emulatorInputRUpCommand',
    label: 'Right D-Pad Up',
    category: 'Emulator Game Pad',
  };

  export const INPUT_R_RIGHT: Command = {
    id: 'VesEmulator.commands.emulatorInputRRightCommand',
    label: 'Right D-Pad Right',
    category: 'Emulator Game Pad',
  };

  export const INPUT_R_DOWN: Command = {
    id: 'VesEmulator.commands.emulatorInputRDownCommand',
    label: 'Right D-Pad Down',
    category: 'Emulator Game Pad',
  };

  export const INPUT_R_LEFT: Command = {
    id: 'VesEmulator.commands.emulatorInputRLeftCommand',
    label: 'Right D-Pad Left',
    category: 'Emulator Game Pad',
  };

  export const INPUT_B: Command = {
    id: 'VesEmulator.commands.emulatorInputBCommand',
    label: 'B',
    category: 'Emulator Game Pad',
  };

  export const INPUT_A: Command = {
    id: 'VesEmulator.commands.emulatorInputACommand',
    label: 'A',
    category: 'Emulator Game Pad',
  };

  export const INPUT_R_TRIGGER: Command = {
    id: 'VesEmulator.commands.emulatorInputRTriggerCommand',
    label: 'Right Trigger',
    category: 'Emulator Game Pad',
  };

  export const INPUT_SAVE_STATE: Command = {
    id: 'VesEmulator.commands.emulatorInputSaveStateCommand',
    label: 'Save State',
    category: CATEGORY,
  };

  export const INPUT_LOAD_STATE: Command = {
    id: 'VesEmulator.commands.emulatorInputLoadStateCommand',
    label: 'Load State',
    category: CATEGORY,
  };

  export const INPUT_STATE_SLOT_DECREASE: Command = {
    id: 'VesEmulator.commands.emulatorInputStateSlotDecreaseCommand',
    label: 'Decrease Save State Slot',
    category: CATEGORY,
  };

  export const INPUT_STATE_SLOT_INCREASE: Command = {
    id: 'VesEmulator.commands.emulatorInputStateSlotIncreaseCommand',
    label: 'Increase Save State Slot',
    category: CATEGORY,
  };

  export const INPUT_TOGGLE_FAST_FORWARD: Command = {
    id: 'VesEmulator.commands.emulatorInputToggleFastForwardCommand',
    label: 'Toggle Fast Forward',
    category: CATEGORY,
  };

  export const INPUT_PAUSE_TOGGLE: Command = {
    id: 'VesEmulator.commands.emulatorInputPauseToggleCommand',
    label: 'Toggle Pause',
    category: CATEGORY,
  };

  export const INPUT_TOGGLE_SLOWMOTION: Command = {
    id: 'VesEmulator.commands.emulatorInputToggleSlowmotionCommand',
    label: 'Toggle Slow Motion',
    category: CATEGORY,
  };

  export const INPUT_TOGGLE_LOW_POWER: Command = {
    id: 'VesEmulator.commands.emulatorInputToggleLowPower',
    label: 'Toggle Low Power Signal',
    category: CATEGORY,
  };

  export const INPUT_REWIND: Command = {
    id: 'VesEmulator.commands.emulatorInputRewindCommand',
    label: 'Rewind',
    category: CATEGORY,
  };

  export const INPUT_FRAME_ADVANCE: Command = {
    id: 'VesEmulator.commands.emulatorInputFrameAdvanceCommand',
    label: 'Frame Advance',
    category: CATEGORY,
  };

  export const INPUT_RESET: Command = {
    id: 'VesEmulator.commands.emulatorInputResetCommand',
    label: 'Reset',
    category: CATEGORY,
  };

  export const INPUT_AUDIO_MUTE: Command = {
    id: 'VesEmulator.commands.emulatorInputAudioMuteCommand',
    label: 'Audio Mute',
    category: CATEGORY,
  };

  export const INPUT_FULLSCREEN: Command = {
    id: 'VesEmulator.commands.emulatorInputFullscreenCommand',
    label: 'Fullscreen',
    category: CATEGORY,
  };

  export const INPUT_TOGGLE_CONTROLS_OVERLAY: Command = {
    id: 'VesEmulator.commands.emulatorInputToggleControlsOverlayCommand',
    label: 'Toggle Controls Overlay',
    category: CATEGORY,
  };

  export const INPUT_SCREENSHOT: Command = {
    id: 'VesEmulator.commands.emulatorInputScreenshotCommand',
    label: 'Take Screenshot',
    category: CATEGORY,
  };
};
